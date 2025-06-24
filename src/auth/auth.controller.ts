import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { IpInfo } from './decorators/ip-info.decorator';
import { VerifiyAccountDto } from './dto/verify-accound.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UserAgent } from './decorators/user-agent.decorator';
import { JWTGuard } from './guards/jwt.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserInfo } from './decorators/user.decorator';
import { LoginThrottlerGuard } from './guards/login-throttle.guard';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}

    @Post('/sign-up')
    async SignUp(@Body() body:SignUpDto,@IpInfo()  ip:string){
        return this.authService.createUser(body,ip)
    }
    @Post('/verify/:id')
    async verifyUser(@Param('id', new ParseUUIDPipe()) id:string,@Body() body:VerifiyAccountDto){
        return this.authService.verifyUser(id,body)
    }
    @UseGuards(LoginThrottlerGuard)
    @Post('/sign-in')
    async SignIn(@Body() body:SignInDto, @IpInfo() ip:string ,@UserAgent() agent:string){
        return this.authService.signInUser(body,ip,agent)
    }
    @UseGuards(JWTGuard)
    @Get('/reset/password')
    async generateResetLink(@Request() req){
        console.log(req.user)
        return this.authService.genrateResetPasswordLink(req.user.id)
    }
    // @UseGuards(JWTGuard)
    @Post('/reset/password/:id')
    async resetPassowrd(@Request() req, @Body() data:ResetPasswordDto,@Param('id', new ParseUUIDPipe()) id:string){
        return this.authService.resetPassword(id,data,req.user?.token)
    }
    @UseGuards(JWTGuard)
    @Get('/verify/token')
    async verifyToken(@UserInfo() user){
        return this.authService.verifyToken(user.token,user.id)
    }
    @UseGuards(JWTGuard)
    @Post('/refresh/token')
    async refreshToken(@UserInfo() user,@IpInfo() ip:string ,@UserAgent() agent:string){
        return this.authService.refreshToken(user,ip,agent)
    }
    @Post('/forgot/password')
    async forgotPassword(@Body() body){
        
        return this.authService.genrateForogotPasswordLink(body.email)
    }

}
