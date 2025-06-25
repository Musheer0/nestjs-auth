import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Redirect, Request, Res, UseGuards } from '@nestjs/common';
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
import { PublicAuthRoute } from './guards/auth-route.guard';
import { Response } from 'express';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}

    @Post('/sign-up')
    async SignUp(@Body() body:SignUpDto,@IpInfo()  ip:string,@UserAgent() agent:string){
        return this.authService.createUser(body,ip,agent)
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
    @UseGuards(JWTGuard)
    @Get('/sign-out')
    async signOut(@UserInfo() user){
        return this.authService.logoutUser(user.token, user.id)
    }
    @Get('/oauth/github')
    async githubsend(@Res() res:Response){

const params = new URLSearchParams({
  client_id: process.env.GITHUB_CLIENT_ID!,
  redirect_uri: process.env.GITHUB_CALLBACK_URL!,
  scope: 'user',
});
res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
    }
      @UseGuards(PublicAuthRoute)
    @Get('/oauth/github/callback')
    async githubcallback(@Query('code') code:string, @IpInfo() ip:string, @UserAgent() agent:string,@Res() res :Response){
        const url = await this.authService.oauthGithub(code, agent,ip);
        if(url) res.redirect(url);
    }

}
