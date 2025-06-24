import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AdminService {
    constructor(private prisma:PrismaService){}

    // async login(data:LoginDto, ip:string, userAgent:string){
    //     const {email,password} = data;
    //     const admin = await this.prisma.admin.findFirst({
    //         where:{
    //             email
    //         }
    //     });
    //     if(!admin) throw new UnauthorizedException("admin not found")
    //     const isSuperUser = admin?.email===process.env.SPUPER_USER;
    //     if(isSuperUser){
    //         const isCorrectPassword = 
    //     }
    // }

}
