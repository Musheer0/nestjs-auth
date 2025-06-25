import { BadRequestException, Body, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import { genOtp, getSessionExpireDate, getVerificationExpireDate, hashPassword, verifyPassword } from 'src/libs/utils';
import { VerifiyAccountDto } from './dto/verify-accound.dto';
import { EditAccess, User, VerificationType } from '@prisma/client';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { ResetPasswordDto } from './dto/reset-password.dto';


@Injectable()
export class AuthService {
    constructor(private prismaService:PrismaService,private jwtService:JwtService){}
    private async sendVerificationCode(newUser:User){
         const verificationEmail = await this.prismaService.verificationToken.create({
                data:{
                    identifier:newUser.id,
                    expires: getVerificationExpireDate(),
                    code: genOtp(),
                    type:newUser.email?  VerificationType.EMAIL: VerificationType.PHONE
                }
            });
            //EMIT EMAIL EVENT USING EVENEMIITER2 OR KAFKA
            //SEND BASED ON EMAIL OR PHONE_NUMBER
            if(newUser.email){}else{}
            console.log(verificationEmail)
    }
    private async userExisits(id:string){
        return this.prismaService.user.findUnique({where:{id}})
    }
    async createUser (data:SignUpDto,ip?:string){
        if(!ip) throw new BadRequestException("invalid request");
        const {email,name,password,phone_number} = data; 
        
        if(!email && !phone_number) throw new BadRequestException("missing required data")
        const userExists = phone_number ?
        await this.prismaService.user.findUnique({
            where:{
                phone_number
            }
        })
        :
        await this.prismaService.user.findUnique({
            where:{
                email
            }
        });
        if(!userExists) {
            const hashed_password = await hashPassword(password)
            //TODO ADD REAL INFO
            const newUser = await this.prismaService.user.create({
                data:{
                    email,
                    name,
                    password:hashed_password,
                    phone_number,
                    createdByIp:ip,
                    createdByUserAgent: 'test agent',
                    country_code: 'test'
                }
            });
            await this.sendVerificationCode(newUser)
             throw new BadRequestException(`please verify your account using the link sent to your newUser.email? ${email ? 'email':'phone number'}`)
        }
        throw new ConflictException(`user already exisits with ${phone_number===userExists?.phone_number ? 'this phone number': 'with this email'}`)
    }
    async verifyUser(id:string,data:VerifiyAccountDto){
        const {code} = data;
        const token = await this.prismaService.verificationToken.findFirst({
            where:{
                id,
                expires:{
                    gte:new Date()
                }
            }
        });
   
        if(!token) throw new BadRequestException("invalid token id or token expired");
        if(token.code!==code) throw new BadRequestException("invalid code");
       try {
        const payload =  token.type==VerificationType.PHONE ? 
                  {  isPhoneNumberVerified: new Date()}
                    :
                    {isVerified:new Date()}
                   
         const user = await this.prismaService.user.update({
            where:{
                id: token.identifier
            },
            data:{
              ...payload
            }
          
        });
        await this.prismaService.verificationToken.delete({where:{id}})
        return {
            message:user.email ? 'your account is verified':'your phone number is verified',
            type :token.type,
            email:user.email,
            phone_number:user.phone_number
        }
        
       } catch (error) {
            Logger.error(error,'\n error from verify account');
            throw new InternalServerErrorException("error users not found")
       }
    }

    async signInUser(data:SignInDto,ip:string,userAgent:string){
         if(!ip) throw new BadRequestException("invalid request");
        const {email,password,phone_number} = data; 
        if(!email && !phone_number) throw new BadRequestException("missing required data")
        const userExists = phone_number ?
        await this.prismaService.user.findUnique({
            where:{
                phone_number,
            }
        })
        :
        await this.prismaService.user.findUnique({
            where:{
                email
            }
        });
        if(userExists){
            const isCorrectPassword = await verifyPassword(userExists.password, password);
            if(!isCorrectPassword)  throw  new BadRequestException('invalid credentials')
            const isVerified = userExists.email ? userExists.isVerified : userExists.isPhoneNumberVerified;
            if(!isVerified){
                await this.sendVerificationCode(userExists)
                 throw new BadRequestException(`please verify your account using the link sent to your  ${email ? 'email':'phone number'}`)
            }
            const session_token = await this.prismaService.session.create({
                data:{
                    userId:userExists.id,
                    ip,
                    user_agent:userAgent,
                    expires:getSessionExpireDate(),
                    location: 'test location'
                }
            });
            const token = await this.jwtService.sign({id:userExists.id, email:userExists.email,image:userExists.image,token:session_token.id})
            return {
                message:'login successfull',
                bearer:token,
                expires:  session_token.expires
            }
            
        }
        throw  new BadRequestException('invalid credentials')
      
    }
    async resetPassword(id:string, data:ResetPasswordDto,session:string){
        const {password,code} = data;
        const token = await this.prismaService.editUserProfileToken.findFirst({
            where:{
                id,
                expires:{gte:new Date()}
            }
        });
        if(!token) throw new BadRequestException("invalid token or code");
        if(code!==token.code || token.type!==EditAccess.PASSWORD)  throw new BadRequestException("invalid code");
        const hashed_password = await hashPassword(password);
        await this.prismaService.user.update({
            where:{
                id:token.identifier_id
            },
            data:{
                password:hashed_password
            }
        });
        //revoke auth exept current device
        if(session){
            await this.prismaService.session.deleteMany({
                where:{
                    id:{not:session}
                }
            });

        }
        await this.prismaService.editUserProfileToken.delete({
            where:{id}
        })
        return {
            message:'password reset successfull'
        }
    }
    async genrateResetPasswordLink(user_id:string){
        const user = await this.userExisits(user_id);
        if(!user) throw new BadRequestException("user not found");
        const token = await this.prismaService.editUserProfileToken.create({
            data:{
                code:genOtp(),
                identifier_id:user.id,
                expires: getVerificationExpireDate()
            }
        });
        //TODO SEND EMAIL
        return {
            type:token.type
        }
    }
    async verifyToken(session_id:string,user_id:string){
        const session = await this.prismaService.session.findUnique({
            where:{
                id:session_id,
                userId:user_id,
                expires:{gte:new Date()}
            }
        });
        if(!session) throw new NotFoundException("token not found");
        const user_info = await this.prismaService.user.findUnique({
            where:{
                id:session.userId
            }
        });
        if(!user_info)throw new NotFoundException("user not found");
        const {id,name,email,image,phone_number,createdAt,country_code,isPhoneNumberVerified,isVerified,...rest} = user_info;
        return {
            id,name,email,image,phone_number,createdAt,country_code,
            isPhoneNumberVerified:!!isPhoneNumberVerified,
            isVerified:!!isVerified
        }
    }
    async refreshToken(user:any,ip:string, userAgent:string){
        const location = 'test loaction'
        const {id:user_id,token:session_id,email,image} = user
        const session = await this.prismaService.session.findUnique({
            where:{
                id:session_id,
                userId:user_id,
                expires:{gte:new Date()}
            }
        });
        if(!session) throw new NotFoundException("token not found");
        await this.prismaService.session.delete({
            where:{id:session_id, userId:user_id}
        });
        const new_session = await this.prismaService.session.create({
            data:{
                userId:user_id,
                location,
                ip,
                user_agent:userAgent,
                expires: getSessionExpireDate()
            }
        });
        const token = await this.jwtService.sign({id:user_id, email,image,token:new_session.id});
        return{
            message: 'token refreshed',
            bearer: token
        }
    }
  async genrateForogotPasswordLink(email:string){
        const user = await this.prismaService.user.findUnique({where:{email}})
        if(!user) throw new BadRequestException("user not found");
        const token = await this.prismaService.editUserProfileToken.create({
            data:{
                code:genOtp(),
                identifier_id:user.id,
                expires: getVerificationExpireDate()
            }
        });
        //TODO SEND EMAIL
        return {
            id:token.id,
            type:token.type
        }
    }
    async logoutUser(token:string,user:string){
        try {
             const del = await this.prismaService.session.delete({
            where:{id:token, userId:user}
        });
        return {
            message: 'logout sucessfull'
        }
        } catch (error) {
            console.log(error,'logout error');
            throw new InternalServerErrorException("internal server error")
        }
    }   
}
