import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AppsModule } from './apps/apps.module';

@Module({
  imports: [PrismaModule, AuthModule,ConfigModule.forRoot({isGlobal:true}),AdminModule, AppsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
