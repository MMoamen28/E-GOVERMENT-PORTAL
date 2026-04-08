import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthApiService } from './auth-api.service';
import { AuthApiLoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

interface RequestWithUser extends Request {
  user: Record<string, unknown>;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthApiController {
  constructor(private readonly authApiService: AuthApiService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and get token' })
  login(@Body() loginDto: AuthApiLoginDto) {
    return this.authApiService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new citizen' })
  register(@Body() registerDto: RegisterDto) {
    return this.authApiService.register(registerDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info from token' })
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }
}
