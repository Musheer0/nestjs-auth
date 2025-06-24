import { IsString, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto{
    @IsString()
    @MinLength(6)
    @MaxLength(64)
    password:string

    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code:string
}