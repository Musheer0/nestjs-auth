import {IsEmail, IsOptional, IsString, MaxLength, MinLength} from 'class-validator'
export class SignUpDto{
    @IsEmail()
      @IsOptional()
    email:string

    @IsString()
    @MinLength(3)
    name:string

    @IsString()
    @MinLength(7)
    @MaxLength(64)
    password:string


    @IsString()
    @IsOptional()
    @MinLength(9)
    @MaxLength(11)
    phone_number:string

    //    @IsString()
    // @IsOptional()
    // image:string

}