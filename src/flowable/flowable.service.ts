import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

export interface FlowableProcess {
  processInstanceId: string;
  processDefinitionKey: string;
  status: string;
}

export interface FlowableTask {
  id: string;
  name: string;
  assignee: string | null;
  processInstanceId: string;
  taskDefinitionKey: string;
  created: string;
}

@Injectable()
export class FlowableService {
  private readonly flowableUrl =
    process.env.FLOWABLE_URL || 'http://localhost:8082';

  private readonly flowableUser = process.env.FLOWABLE_USER || 'rest-admin';

  private readonly flowablePass = process.env.FLOWABLE_PASS || 'test';

  private get auth() {
    return { username: this.flowableUser, password: this.flowablePass };
  }

  async deployProcess(): Promise<void> {
    try {
      const filePath = path.join(
        __dirname,
        'processes/id-renewal-process.bpmn20.xml',
      );

      const form = new FormData();
      form.append('file', fs.createReadStream(filePath), {
        filename: 'id-renewal-process.bpmn20.xml',
        contentType: 'application/xml',
      });

      await axios.post(
        `${this.flowableUrl}/flowable-rest/service/repository/deployments`,
        form,
        { auth: this.auth, headers: form.getHeaders() },
      );
    } catch {
      throw new HttpException(
        'Failed to deploy process',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async startRenewalProcess(
    requestId: string,
    firstName: string,
    lastName: string,
    nationalId: string,
  ): Promise<FlowableProcess> {
    try {
      const response = await axios.post<FlowableProcess>(
        `${this.flowableUrl}/flowable-rest/service/runtime/process-instances`,
        {
          processDefinitionKey: 'id-renewal-process',
          variables: [
            { name: 'requestId', value: requestId },
            { name: 'firstName', value: firstName },
            { name: 'lastName', value: lastName },
            { name: 'nationalId', value: nationalId },
          ],
        },
        { auth: this.auth },
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Flowable workflow service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getProcessStatus(processInstanceId: string): Promise<FlowableProcess> {
    try {
      const response = await axios.get<FlowableProcess>(
        `${this.flowableUrl}/flowable-rest/service/runtime/process-instances/${processInstanceId}`,
        { auth: this.auth },
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Process instance not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async getSupervisorTasks(): Promise<FlowableTask[]> {
    try {
      const response = await axios.get<{ data: FlowableTask[] }>(
        `${this.flowableUrl}/flowable-rest/service/runtime/tasks?candidateGroup=supervisor`,
        { auth: this.auth },
      );
      return response.data.data ?? [];
    } catch {
      throw new HttpException(
        'Flowable workflow service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getTaskById(taskId: string): Promise<FlowableTask> {
    try {
      const response = await axios.get<FlowableTask>(
        `${this.flowableUrl}/flowable-rest/service/runtime/tasks/${taskId}`,
        { auth: this.auth },
      );
      return response.data;
    } catch {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }
  }

  async completeTask(taskId: string, approved: boolean): Promise<void> {
    try {
      await axios.post(
        `${this.flowableUrl}/flowable-rest/service/runtime/tasks/${taskId}`,
        {
          action: 'complete',
          variables: [{ name: 'approved', value: approved }],
        },
        { auth: this.auth },
      );
    } catch {
      throw new HttpException(
        'Failed to complete task',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
