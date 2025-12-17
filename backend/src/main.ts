import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🤖 Ollama API: ${process.env.OLLAMA_API_URL}`);
}
bootstrap().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
