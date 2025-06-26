import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ClientAuthMiddleware } from './middlewares/client.middleware';
import { FileModule } from './file/file.module';

@Module({
  imports: [PrismaModule, AuthModule,ConfigModule.forRoot({isGlobal:true}),AdminModule,
    ThrottlerModule.forRoot({
      throttlers:[
        {
          ttl: 60000,
          limit: 10,
        }
      ]
    }),
    FileModule

  ],
  controllers: [AppController],
  providers: [AppService,
    // {provide:APP_GUARD,useClass:ThrottlerGuard}
  ],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ClientAuthMiddleware).forRoutes('*')
  }
}
