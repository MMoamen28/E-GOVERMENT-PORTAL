import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

export interface FlowableProcess {
  id: string;
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
  variables: Record<string, string>;
}

@Injectable()
export class FlowableService {
  private readonly logger = new Logger(FlowableService.name);

  private readonly flowableUrl =
    process.env.FLOWABLE_URL || 'http://localhost:8082';

  private readonly flowableUser = process.env.FLOWABLE_USER || 'rest-admin';

  private readonly flowablePass = process.env.FLOWABLE_PASS || 'test';

  private get auth() {
    return { username: this.flowableUser, password: this.flowablePass };
  }

  private extractError(err: unknown, fallback: string): string {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const data: unknown = err.response?.data;
      const dataStr =
        typeof data === 'object' && data !== null ? JSON.stringify(data) : '';
      const msg = dataStr || '';
      this.logger.error(
        `Flowable HTTP ${status ?? 'N/A'}: ${msg || err.message}`,
      );
      if (status === 401)
        return 'Flowable authentication failed — check FLOWABLE_USER / FLOWABLE_PASS in .env';
      if (status === 404)
        return 'Flowable resource not found (is the process deployed?)';
      if (status === 409)
        return 'Flowable conflict — process may already be deployed';
      return msg || err.message || fallback;
    }
    this.logger.error(`Non-HTTP error: ${String(err)}`);
    return fallback;
  }

  async deployProcess(): Promise<void> {
    const filePath = path.join(
      __dirname,
      '../../flowable/processes/id-renewal-process.bpmn20.xml',
    );

    if (!fs.existsSync(filePath)) {
      throw new HttpException(
        `BPMN file not found at: ${filePath}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: 'id-renewal-process.bpmn20.xml',
      contentType: 'application/xml',
    });

    try {
      await axios.post(
        `${this.flowableUrl}/flowable-rest/service/repository/deployments`,
        form,
        { auth: this.auth, headers: form.getHeaders() },
      );
      this.logger.log('BPMN process deployed successfully');
    } catch (err) {
      const msg = this.extractError(err, 'Failed to deploy BPMN process');
      throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
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
    } catch (err) {
      const msg = this.extractError(
        err,
        'Flowable workflow service unavailable',
      );
      throw new HttpException(msg, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getProcessStatus(processInstanceId: string): Promise<FlowableProcess> {
    try {
      const response = await axios.get<FlowableProcess>(
        `${this.flowableUrl}/flowable-rest/service/runtime/process-instances/${processInstanceId}`,
        { auth: this.auth },
      );
      return response.data;
    } catch (err) {
      const msg = this.extractError(err, 'Process instance not found');
      throw new HttpException(msg, HttpStatus.NOT_FOUND);
    }
  }

  async getSupervisorTasks(): Promise<FlowableTask[]> {
    try {
      const response = await axios.get<{
        data: (FlowableTask & {
          variables: { name: string; value: string }[];
        })[];
      }>(
        `${this.flowableUrl}/flowable-rest/service/runtime/tasks?candidateGroup=supervisor&includeProcessVariables=true`,
        { auth: this.auth },
      );
      return (response.data.data ?? []).map((task) => {
        const vars: Record<string, string> = {};
        (task.variables ?? []).forEach(
          (v: { name: string; value: string }) => (vars[v.name] = v.value),
        );
        return {
          ...task,
          variables: {
            ...vars,
            citizenName: `${vars.firstName ?? ''} ${vars.lastName ?? ''}`.trim(),
          },
        };
      });
    } catch (err) {
      const msg = this.extractError(
        err,
        'Flowable workflow service unavailable',
      );
      throw new HttpException(msg, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getTaskById(taskId: string): Promise<FlowableTask> {
    try {
      const response = await axios.get<FlowableTask>(
        `${this.flowableUrl}/flowable-rest/service/runtime/tasks/${taskId}`,
        { auth: this.auth },
      );
      return response.data;
    } catch (err) {
      const msg = this.extractError(err, 'Task not found');
      throw new HttpException(msg, HttpStatus.NOT_FOUND);
    }
  }

  async completeTask(taskId: string, approved: boolean): Promise<void> {
    try {
      await axios.post(
        `${this.flowableUrl}/flowable-rest/service/runtime/tasks/${taskId}`,
        {
          action: 'complete',
          variables: [{ name: 'approved', value: approved, type: 'boolean' }],
        },
        { auth: this.auth },
      );
      this.logger.log(`Task ${taskId} completed — approved: ${approved}`);
    } catch (err) {
      const msg = this.extractError(err, 'Failed to complete task');
      throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
