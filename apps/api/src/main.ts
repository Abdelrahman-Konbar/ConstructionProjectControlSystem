import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const required = ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL', 'PORT', 'NODE_ENV']
  const missing = required.filter((key) => !config.get<string>(key))
  if (missing.length) throw new Error(`Missing required API environment variables: ${missing.join(', ')}`)
  const isProduction = config.get<string>('NODE_ENV') === 'production'
  const configuredOrigins = config.get<string>('FRONTEND_URL')!.split(',').map((value) => value.trim()).filter(Boolean)
  app.setGlobalPrefix('api/v1')
  app.use(helmet())
  const localOrigins = ['http://localhost:8443', 'http://127.0.0.1:8443']
  app.enableCors({ origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => { if (!origin || configuredOrigins.includes(origin) || (!isProduction && localOrigins.includes(origin))) return callback(null, true); return callback(new Error('Origin is not allowed by CORS'), false) }, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
  if (process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder().setTitle('Construction Project Control API').setDescription('Tenant-aware project control API').setVersion('1.0').addBearerAuth().build()
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))
  }
  const port = Number(config.get<string>('PORT'))
  if (!isProduction && port !== 5000) throw new Error('Development API PORT must be 5000')
  await app.listen(port)
}

void bootstrap()
