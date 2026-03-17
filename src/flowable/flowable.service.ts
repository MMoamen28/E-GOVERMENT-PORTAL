import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class FlowableService {
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

  async getProcessInstance(processInstanceId: string) {
    try {
      const response = await this.axiosInstance.get(`/runtime/process-instances/${processInstanceId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Flowable process instance: ${error.message}`);
      throw error;
    }
  }
}
