import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUploadDto } from './dto/file-upload.dto';
import { Storage } from '@prisma/client';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getExpiryBySize } from 'src/libs/utils';


@Injectable()
export class FileService {
    private s3: S3Client;

    constructor(private prisma: PrismaService) {
        this.s3 = new S3Client({
            region: 'auto',
            endpoint: process.env.BUCKET,
            forcePathStyle: false,
        });
    }

    async GenerateUploadURL(data:FileUploadDto,storage:Storage) {
        const timestampmed_name = Date.now()+data.name;
        
        const empty_file = await this.prisma.file.create({
            data:{
                name:timestampmed_name,
                size:data.size,
                originalName:data.name,
                type:data.contentType,
                folder_id:data.folder_id,
                user_id:storage.user_id,
                storage_id:storage.id
            }
        });
        const uploadCommand = new PutObjectCommand({
            Bucket:process.env.NAME!,
            Key:empty_file.id,
            ContentType:data.contentType,
            ContentLength:data.size
        });
        
        const presigned_url = await getSignedUrl(this.s3,uploadCommand,{
            expiresIn:360
        });
        await this.prisma.storage.update({
            where:{
                id:storage.id
            },
            data:{
                storage_used: {increment:data.size}
            }
        });
        if(data.folder_id){
            await this.prisma.folder.update({
                where:{
                    user_id:storage.user_id,
                    id:data.folder_id
                },
                data:{
                    size: {increment:data.size}
                }
            })
        }
        return {
            url:presigned_url,
            id:empty_file.id
        }
    };
    async UploadFile(id:string,userId:string){
      const file =  await this.prisma.file.update({
            where:{
                id,
                user_id:userId
            },
            data:{
                isUploaded:true
            }
        });
            const {isUploaded,storage_id,...rest} = file
        return {
            message: 'file uploaded',
            file:rest
        }
    };
    async DeleteFile(id:string,userId:string){
        const file =    await this.prisma.file.delete({
            where:{
                id,
                user_id:userId
            }
        });
        const DeleteCommand = new DeleteObjectCommand({
            Bucket:process.env.NAME!,
            Key:id
        });
        await this.s3.send(DeleteCommand);
        await this.prisma.storage.update({
            where:{
                user_id:userId,
            },
            data:{
                storage_used: {decrement: file.size}
            }
        });
        if(file.folder_id){
              await this.prisma.folder.update({
            where:{
                user_id:userId,
                id:file.folder_id
            },
            data:{
                size: {decrement: file.size}
            }
        });
        }
        return {
            message: 'file deleted',
        }
    };
     async RenameFile(id:string,userId:string,name:string){
         await this.prisma.file.update({
            where:{
                id,
                user_id:userId
            },
            data:{
                name
            }
         })
        return {
            message: 'file renamed',
        }
    };
    async MoveToFolder(id:string,folderId:string,userId:string){
          const file = await this.prisma.file.update({
            where:{
                id,
                isPublic:null,
                user_id:userId
            },
            data:{
                folder_id:folderId
            }
        });
        await this.prisma.folder.update({
            where:{
                user_id:userId,
                id:folderId
            },
            data:{
                size:{increment:file.size}
            }
        })
        return {
            message: 'file moved to folder',
            isPublic:file.isPublic
        }
    };
      async MoveToRoot(id:string,userId:string){
          const file = await this.prisma.file.update({
            where:{
                id,
                isPublic:null,
                user_id:userId
            },
            data:{
                folder_id:null
            }
        });
          await this.prisma.folder.update({
            where:{
                user_id:userId,
                id:file.folder_id!
            },
            data:{
                size:{increment:file.size}
            }
        })
        return {
            message: 'file removed from folder',
        }
    };
      async TogglePrivacy(id:string,userId:string,isPrivated:boolean){
          const file = await this.prisma.file.update({
            where:{
                id,
                isPublic:null,
                user_id:userId
            },
            data:{
                isPublic:isPrivated ?new Date():null
            }
        });
        return {
            message: 'file privacy changed',
            isPublic:file.isPublic
        }
    };
    async GetUserFiles(userId:string, nextCursor:string){
        const files = await this.prisma.file.findMany({
            where:{
                user_id:userId
            },
            take:11,
            skip: nextCursor? 1:0,
          cursor: nextCursor ? { id: nextCursor } : undefined,
        });
        const hasNextCursor = files.length>10;
        const sanitizedFiles = files.map((file)=>{
            const {isUploaded,storage_id,...rest} = file;
            return rest;
        });
        return {
            files:sanitizedFiles,
            nextCursor: hasNextCursor? files[files.length].id:null
        }
    };
      async GetUserFolderFiles(userId:string, nextCursor:string,folder_id:string){
        const files = await this.prisma.file.findMany({
            where:{
                user_id:userId,
                folder_id:folder_id
            },
            take:11,
            skip: nextCursor? 1:0,
          cursor: nextCursor ? { id: nextCursor } : undefined,
        });
        const hasNextCursor = files.length>10;
        const sanitizedFiles = files.map((file)=>{
            const {isUploaded,storage_id,...rest} = file;
            return rest;
        });
        return {
            files:sanitizedFiles,
            nextCursor: hasNextCursor? files[files.length].id:null
        }
    };
     async GetUserFolder(userId:string, nextCursor:string){
        const folders = await this.prisma.folder.findMany({
            where:{
                user_id:userId
            },
            take:11,
            skip: nextCursor? 1:0,
          cursor: nextCursor ? { id: nextCursor } : undefined,
        });
        const hasNextCursor = folders.length>10;
        const sanitizedFiles = folders.map((folder)=>{
            const {...rest} = folder;
            return rest;
        });
        return {
            files:sanitizedFiles,
            nextCursor: hasNextCursor? folders[folders.length].id:null
        }
    };
    async CreateFolder(user_id:string,name:string){
        const new_folder = await this.prisma.folder.create({
            data:{
                user_id:user_id,
                name:name
            }
        });
        return new_folder
    };
    async DeleteFolder(user_id:string,folder:string, deleteFiles:boolean){
        const deleted_folder = await this.prisma.folder.delete({
            where:{
                user_id:user_id,
                id:folder
            }
        });
        if(deleteFiles){

            try {
                const totalsize = deleted_folder.size;
                 await this.prisma.file.deleteMany({
                where:{
                    user_id,
                    folder_id:folder
                }
            });
            await this.prisma.storage.update({
                where:{
                    user_id:user_id
                },
                data:{
                    storage_used:{decrement:totalsize}
                }
            })
            } catch (error) {
            console.log(error, 'error deleting files from db') 
          return {
            folderDelete:true,
            filesDelete:false
        }
        
        }
            
        }
        return {
            folderDelete:true,
            filesDelete:deleteFiles
        }
    };
    async RenameFolder(id:string,userId:string,name:string){
         await this.prisma.folder.update({
            where:{
                id,
                user_id:userId
            },
            data:{
                name
            }
         })
        return {
            message: 'folder renamed',
        }
    };
    async GetStorage(userid:string){
        const storage = await this.prisma.storage.upsert({
            where:{
                user_id:userid
            },
            create:{
                user_id:userid
            },
            update:{}

        });
        return storage
    }
}
