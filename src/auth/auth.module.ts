import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JWTStrategy } from './strategies/jwt.strategy';

@Module({
  providers: [AuthService,JWTStrategy],
  controllers: [AuthController],
  imports:[PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory:async(configService:ConfigService)=>({
        secret:configService.get<string>('SECRET'),
        signOptions:{
          expiresIn: '7d'
        }
      }),
      inject:[ConfigService]
    }),
    ConfigModule,
    PassportModule
  ],
  exports:[JWTStrategy,PassportModule]
})
export class AuthModule {}
 