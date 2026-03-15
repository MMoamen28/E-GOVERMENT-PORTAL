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
    this.issuer = this.configService.get<string>('keycloak.issuer') || 'http://localhost:8080/realms/e-gov-portal';
  }

  async login(loginDto: LoginDto) {
    // Determine token URL. Always use the internal hostname if we are the backend.
    const tokenUrl = `${this.issuer}/protocol/openid-connect/token`;
    
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', 'scholarship-api');
    params.append('client_secret', 'scholarship-api-secret-change-in-production');
    params.append('username', loginDto.username);
    params.append('password', loginDto.password);
    params.append('scope', 'openid profile email');

    try {
      console.log(`Attempting login at: ${tokenUrl}`);
      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Keycloak login error:', error.response?.data || error.message);
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
