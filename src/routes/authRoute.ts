import express, { Router } from 'express';
import { register, activateUser, login, refreshToken, logout, profileDetails, forgotPassword, verifyOTP, resetPassword, hello } from '../controller/authController';
import { isvalidate } from '../middleware/authMiddleware';


const router: Router = express.Router();

router.post('/register', register);

router.post('/activate', activateUser);

router.post('/login', login);

router.post('/refresh-token', refreshToken);

router.post('/logout', logout);

router.post('/profile',isvalidate,profileDetails)

router.post('/forgot-password',forgotPassword);

router.post('/verify-otp',verifyOTP);

router.post('/reset-password',resetPassword);

router.get('/hello',hello);

export default router;
