import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../model/userModal';
import { createActivationResetToken, createActivationToken, generateAccessToken, generateRefreshToken, verifyActivationResetToken, verifyActivationToken } from '../utils/tokenUtils';
import { sendEmail } from '../utils/emailService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

type RequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;


export const register: RequestHandler = async (req, res) => {
  const { fullname, email, phonenumber, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    const { token, activationCode } = createActivationToken({ fullname, email, phonenumber, password });

    await sendEmail(email, 'Activate your account', `Your activation code is: ${activationCode}`);

    res.status(201).json({
      success: true,
      message: 'Activation code sent to your email. Please verify to complete registration.',
      token 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const activateUser: RequestHandler = async (req, res) => {
  const { token, activationCode } = req.body;

  try {
    const verified: any = verifyActivationToken(token); 
    
    if (!verified || verified.activationCode !== activationCode) {
      res.status(400).json({ success: false, message: 'Invalid activation code' });
      return;
    }


    const existingUser = await User.findOne({ email: verified.user.email });
    if (existingUser) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(verified.user.password, 10);
    const newUser = new User({
        fullname: verified.user.fullname,
      email: verified.user.email,
      phonenumber: verified.user.phonenumber,
      password: hashedPassword,
    });
    
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      user: newUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const userId = user._id.toString();

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: true , maxAge: 15 * 60 * 1000 ,sameSite: 'none'});
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, maxAge: 5 * 24 * 60 * 60 * 1000,sameSite: 'none' });

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const refreshToken: RequestHandler = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    res.status(401).json({ message: 'No refresh token' });
    return;
  }

  try {
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    const accessToken = generateAccessToken(decoded.userId);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });

    res.status(200).json({ message: 'Access token refreshed' });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

export const logout: RequestHandler = (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

export const profileDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
      
      const userId = req.user?.id;

      if (!userId) {
           res.status(401).json({ error: "Unauthorized access" });
           return;
      }

      const user = await User.findById(userId);
      if (!user) {
           res.status(404).json({ error: "User not found" });
           return;
      }
      res.status(200).json({ userDetails: user });
  } catch (e: any) {
      console.log("Error fetching user details:", e);
      res.status(500).json({ error: "Internal server error" });
  }
};

export const forgotPassword = async(req:Request,res:Response):Promise<void> =>{
    const{email} = req.body;

    try {
      const user = await User.findOne({email});

    if(!user){
      res.status(404).json({message:"User not found"})
      return;
    }

    const {token,resetToken} = createActivationResetToken({email});

    await sendEmail(email,'Password Reset OTP', `Your OTP is: ${resetToken}`);

    res.status(201).json({message:"OTP sent to email. Please verify",token})
    } catch (e:any) {
      console.log(e);
    res.status(500).json({ message: 'Server error' });
    }
}

export const verifyOTP = async(req:Request,res:Response):Promise<void> =>{
  try {
    const {token,otp} = req.body;

    console.log("OTP",otp)

    const verified:any = verifyActivationResetToken(token);

    if(!verified || verified.resetToken !== otp){
      res.status(400).json({message:"Invalid OTP"})
      return;
    }

    res.status(200).json({ message: 'OTP verified. You can now reset your password.' });
  } catch (e:any) {
    console.log(e);
    res.status(500).json({ message: 'Server error' });
  }
}

export const resetPassword = async(req:Request,res:Response):Promise<void> =>{
  try {
    const{token,password} = req.body;
    const verified:any = verifyActivationResetToken(token);
    if (!verified) {
       res.status(400).json({ message: 'Invalid token' });
       return;
    }

    const user = await User.findOne({ email: verified.user.email });
    if (!user) {
       res.status(404).json({ message: 'User not found' });
       return;
    }

    const hashedPassword = await bcrypt.hash(password,10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (e:any) {
    console.log(e);
    res.status(500).json({ message: 'Server error' });
  }
}


export const hello = async(req:Request,res:Response):Promise<void> =>{
  res.send("Hello , How are you")
}