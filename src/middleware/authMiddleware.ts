import { Request,Response,NextFunction } from "express";
import jwt, { decode } from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config()

export interface AuthenticatedRequest extends Request {
    user?: {id:string}
  }

export const isvalidate = (req:AuthenticatedRequest,res:Response,next:NextFunction):any =>{
    const accessToken = req.cookies.accessToken;

    console.log('Access Token:', accessToken);

    if(!accessToken){
        return res.status(401).json({message:"Not authorized , no token"})
    }
    try {
        const decoded:any = jwt.verify(accessToken,process.env.JWT_ACCESS_SECRET!);
        req.user = {id:decoded.id}
        next();
    } catch (error) {
        res.status(401).json({message:"Not authorized , token failed"})
    }
}