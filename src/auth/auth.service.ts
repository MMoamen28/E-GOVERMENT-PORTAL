import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly issuer: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.issuer =
      this.configService.get<string>('keycloak.issuer') ||
      'http://localhost:8080/realms/e-gov-portal';
  }

  async login(loginDto: LoginDto) {
    const internalUrl =
      this.configService.get<string>('keycloak.internalUrl') || this.issuer;
    const tokenUrl = `${internalUrl}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', 'scholarship-api');
    params.append(
      'client_secret',
      'scholarship-api-secret-change-in-production',
    );
    params.append('username', loginDto.username);
    params.append('password', loginDto.password);
    params.append('scope', 'openid profile email');

    try {
      console.log(`Attempting login at: ${tokenUrl}`);
      const response: { data: unknown } = await firstValueFrom(
        this.httpService.post(tokenUrl, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('Keycloak login error:', axiosError.response?.data);
      } else if (error instanceof Error) {
        console.error('Keycloak login error:', error.message);
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
