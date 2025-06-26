import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [FileService],
  controllers: [FileController],
  imports:[PrismaModule]
})
export class FileModule {}
