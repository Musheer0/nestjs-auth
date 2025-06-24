import {IsEmail, IsOptional, IsString, MaxLength, MinLength} from 'class-validator'
export class VerifiyAccountDto{
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code:string

}