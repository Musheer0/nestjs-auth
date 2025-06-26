import { IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class FileUploadDto{
    @IsString()
    name:string

    @IsString()
    contentType:string

    @IsNumber()
    size:number

    @IsOptional()
    @IsString()
    @IsUUID()
    folder_id:string
}