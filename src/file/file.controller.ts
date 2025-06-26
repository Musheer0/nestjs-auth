import { BadRequestException, Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JWTGuard } from 'src/auth/guards/jwt.guard';
import { FileSizeChecker } from './guards/file-size.guard';
import { FileUploadDto } from './dto/file-upload.dto';
import { UserStorage } from './decorators/user-storage.decorator';
import { Storage } from '@prisma/client';
import { FileService } from './file.service';
@UseGuards(JWTGuard)
@Controller('file')
export class FileController {
    constructor(private readonly fileService:FileService){}

    @Get('/storage')
    async getStorage(@Request() req){
        return this.fileService.GetStorage(req.user.id)
    }
    @Post('/get/upload-url')
    @UseGuards(FileSizeChecker)
    async uploadfile(@Body() data:FileUploadDto,@UserStorage() storage:Storage|null){
        if(!storage) throw new BadRequestException("user storage not found");
            return this.fileService.GenerateUploadURL(data, storage);
        }
    
}
