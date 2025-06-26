import {hash, compare} from 'bcrypt'
import { randomInt } from 'crypto';

export const hashPassword = (password:string)=>{
    return hash(password,10)
}
export const verifyPassword = (hash:string, password:string)=>{
    return compare(password, hash)
}

export const getSessionExpireDate = ()=>{
    return new Date(Date.now()+ 7 * 24 * 60 * 60 * 1000)
}
export const getVerificationExpireDate = ()=>{
    return new Date(Date.now()+  15 * 60 * 1000)
}
export const genOtp = ()=>{
      return randomInt(100000, 1000000).toString();

}

export const getIpInfo = async(ip:string)=>{
    const request = await fetch(`https://ipapi.co/${ip}/json/`)
    if(request.ok) {
        const response = await request.json()
        return response
    }
    return null
}
export const isSuperUser = (email:string)=>email===process.env.SUPER_USER

export const STORAGE_LIMIT=262144000
export const bytesToMB = (bytes) => bytes / 1048576;
export const getExpiryBySize = (fileSizeInMB: number) => {
  const speedInMBps = 0.5; // assume average network speed
  const bufferTimeInSec = 10; // just in case
  const uploadTime = fileSizeInMB / speedInMBps;
  return Math.ceil(uploadTime + bufferTimeInSec);
};
