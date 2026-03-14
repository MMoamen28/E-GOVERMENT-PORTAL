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

@Injectable()
export class FlowableService {
  private readonly flowableUrl =
    process.env.FLOWABLE_URL || 'http://localhost:8082';

  private readonly flowableUser = process.env.FLOWABLE_USER || 'rest-admin';

  private readonly flowablePass = process.env.FLOWABLE_PASS || 'test';

  async deployProcess(): Promise<void> {
    try {
      const filePath = path.join(
        process.cwd(),
        'src/flowable/processes/id-renewal-process.bpmn20.xml',
      );

      const form = new FormData();
      form.append('file', fs.createReadStream(filePath), {
        filename: 'id-renewal-process.bpmn20.xml',
        contentType: 'application/xml',
      });

      await axios.post(
        `${this.flowableUrl}/flowable-rest/service/repository/deployments`,
        form,
        {
          auth: {
            username: this.flowableUser,
            password: this.flowablePass,
          },
          headers: form.getHeaders(),
        },
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
        {
          auth: {
            username: this.flowableUser,
            password: this.flowablePass,
          },
        },
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
        {
          auth: {
            username: this.flowableUser,
            password: this.flowablePass,
          },
        },
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Process instance not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
