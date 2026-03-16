import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  // Serve frontend static files first for paths that are not API/docs, so /pages/scholarship.html loads
  const frontendPath = join(__dirname, '..', 'frontend');
  const staticMiddleware = express.static(frontendPath);
  app.use((req, res, next) => {
    console.log(`[Main Logger] ${req.method} ${req.path}`);
    if (
      req.path.startsWith('/scholarship') ||
      req.path.startsWith('/policies') ||
      req.path.startsWith('/docs') ||
      req.path.startsWith('/api')
    ) {
      console.log(`[Main Logger] Forwarding ${req.path} to API`);
      return next();
    }
    staticMiddleware(req, res, next);
  });

  const config = new DocumentBuilder()
    .setTitle('E-Government Portal API')
    .setDescription(
      'API for the E-Government Portal (scholarship, services, etc.)',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
