import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy){
    constructor(private configService:ConfigService){
        super({
            jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration:false,
            secretOrKey:configService.get<'string'>('SECRET')||'SECRET'
        })
    
    }
        async validate(payload:any){
            return payload
        }
}