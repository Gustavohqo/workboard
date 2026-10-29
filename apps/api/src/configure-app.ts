import { type INestApplication, ValidationPipe } from '@nestjs/common';

/** Global settings shared by the server and the HTTP tests (ADR 0007). */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' });
}
