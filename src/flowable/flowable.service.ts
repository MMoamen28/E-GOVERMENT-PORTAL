import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
const FormData = require('form-data');

@Injectable()
export class FlowableService implements OnModuleInit {
  private readonly logger = new Logger(FlowableService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseURL = this.configService.get<string>('FLOWABLE_URL') || '';
    const auth = {
      username: this.configService.get<string>('FLOWABLE_USER') || '',
      password: this.configService.get<string>('FLOWABLE_PASS') || '',
    };

    this.axiosInstance = axios.create({
      baseURL,
      auth,
    });
  }

  async onModuleInit() {
    // Automatically deploy bundled BPMN files on startup
    const bpmnDir = path.join(process.cwd(), 'flowable');
    if (fs.existsSync(bpmnDir)) {
      const files = fs.readdirSync(bpmnDir).filter(f => f.endsWith('.bpmn20.xml'));
      for (const file of files) {
        try {
          await this.deployProcessDefinition(path.join(bpmnDir, file), file);
        } catch (e) {
          this.logger.warn(`Failed to auto-deploy ${file} (engine might not be ready): ${e.message}`);
        }
      }
    }
  }

  async startProcessInstance(processDefinitionKey: string, variables: any = {}) {
    try {
      const flowableVariables = Object.entries(variables).map(([name, value]) => ({
        name,
        value,
      }));

      const response = await this.axiosInstance.post('/runtime/process-instances', {
        processDefinitionKey,
        variables: flowableVariables,
      });

      this.logger.log(`Started Flowable process instance: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to start Flowable process instance: ${error.message}`);
      if (error.response) {
        this.logger.error(`Flowable error data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async deployProcessDefinition(filePath: string, deploymentName: string) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      form.append('deploymentName', deploymentName);

      const response = await this.axiosInstance.post('/repository/deployments', form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      this.logger.log(`Deployed Flowable process: ${response.data.name} (ID: ${response.data.id})`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to deploy Flowable process: ${error.message}`);
      throw error;
    }
  }

  async getProcessInstance(processInstanceId: string) {
    try {
      const response = await this.axiosInstance.get(`/runtime/process-instances/${processInstanceId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Flowable process instance: ${error.message}`);
      throw error;
    }
  }

  async getTasksForProcessInstance(processInstanceId: string) {
    try {
      const response = await this.axiosInstance.get('/runtime/tasks', {
        params: {
          processInstanceId,
        },
      });
      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Failed to get Flowable tasks: ${error.message}`);
      throw error;
    }
  }

  async completeTask(taskId: string, variables: any = {}) {
    try {
      const flowableVariables = Object.entries(variables).map(([name, value]) => ({
        name,
        value,
      }));

      const response = await this.axiosInstance.post(`/runtime/tasks/${taskId}`, {
        action: 'complete',
        variables: flowableVariables,
      });

      this.logger.log(`Completed Flowable task: ${taskId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to complete Flowable task: ${error.message}`);
      throw error;
    }
  }

  async getTaskVariables(taskId: string) {
    try {
      const response = await this.axiosInstance.get(`/runtime/tasks/${taskId}/variables`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get task variables: ${error.message}`);
      throw error;
    }
  }

  async setTaskVariable(taskId: string, name: string, value: any) {
    try {
      const response = await this.axiosInstance.put(`/runtime/tasks/${taskId}/variables/${name}`, {
        value,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to set task variable: ${error.message}`);
      throw error;
    }
  }
}
