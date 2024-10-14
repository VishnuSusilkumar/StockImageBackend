import jwt, { Secret } from 'jsonwebtoken';
import 'dotenv/config'

export interface IActivationToken{
    token:string;
    activationCode:string;
}

export interface IResetToken{
    token:string;
    resetToken:string;
}

export const createActivationToken = (user: { fullname: string; email: string; phonenumber: string; password: string }): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit activation code
    const token = jwt.sign(
        { user, activationCode },
        process.env.JWT_SECRET as Secret,
        {
            expiresIn: '15m',
        }
    );
    return { token, activationCode};
};


export const createActivationResetToken = (user:{email:string}):IResetToken =>{
    const resetToken = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign(
        {user,resetToken},
        process.env.JWT_SECRET as Secret,
        {
            expiresIn:"15m"
        }
    );
    return {token,resetToken}
}



export const verifyActivationToken = (token: string): any => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as Secret);
    } catch (error) {
        return null; 
    }
};

export const verifyActivationResetToken = (token: string): any => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as Secret);
    } catch (error) {
        return null; 
    }
};


export const generateAccessToken = (userId:string) =>{
    return jwt.sign({id:userId},process.env.JWT_ACCESS_SECRET!,{expiresIn:"15m"});
};

export const generateRefreshToken = (userId:string) =>{
    return jwt.sign({id:userId},process.env.JWT_REFRESH_SECRET!,{expiresIn:"5d"});
}