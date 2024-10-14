"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = exports.resetPassword = exports.verifyOTP = exports.forgotPassword = exports.profileDetails = exports.logout = exports.refreshToken = exports.login = exports.activateUser = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModal_1 = __importDefault(require("../model/userModal"));
const tokenUtils_1 = require("../utils/tokenUtils");
const emailService_1 = require("../utils/emailService");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fullname, email, phonenumber, password } = req.body;
    try {
        const userExists = yield userModal_1.default.findOne({ email });
        if (userExists) {
            res.status(400).json({ success: false, message: "User already exists" });
            return;
        }
        const { token, activationCode } = (0, tokenUtils_1.createActivationToken)({ fullname, email, phonenumber, password });
        yield (0, emailService_1.sendEmail)(email, 'Activate your account', `Your activation code is: ${activationCode}`);
        res.status(201).json({
            success: true,
            message: 'Activation code sent to your email. Please verify to complete registration.',
            token
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.register = register;
const activateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, activationCode } = req.body;
    try {
        const verified = (0, tokenUtils_1.verifyActivationToken)(token);
        if (!verified || verified.activationCode !== activationCode) {
            res.status(400).json({ success: false, message: 'Invalid activation code' });
            return;
        }
        const existingUser = yield userModal_1.default.findOne({ email: verified.user.email });
        if (existingUser) {
            res.status(400).json({ success: false, message: "User already exists" });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(verified.user.password, 10);
        const newUser = new userModal_1.default({
            fullname: verified.user.fullname,
            email: verified.user.email,
            phonenumber: verified.user.phonenumber,
            password: hashedPassword,
        });
        yield newUser.save();
        res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            user: newUser,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.activateUser = activateUser;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield userModal_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        const userId = user._id.toString();
        const accessToken = (0, tokenUtils_1.generateAccessToken)(userId);
        const refreshToken = (0, tokenUtils_1.generateRefreshToken)(userId);
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, maxAge: 15 * 60 * 1000, sameSite: 'none' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, maxAge: 5 * 24 * 60 * 60 * 1000, sameSite: 'none' });
        res.status(200).json({ message: 'Login successful', user });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.login = login;
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        res.status(401).json({ message: 'No refresh token' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const accessToken = (0, tokenUtils_1.generateAccessToken)(decoded.userId);
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
        res.status(200).json({ message: 'Access token refreshed' });
    }
    catch (error) {
        console.error(error);
        res.status(403).json({ message: 'Invalid refresh token' });
    }
});
exports.refreshToken = refreshToken;
const logout = (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
};
exports.logout = logout;
const profileDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized access" });
            return;
        }
        const user = yield userModal_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ userDetails: user });
    }
    catch (e) {
        console.log("Error fetching user details:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.profileDetails = profileDetails;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield userModal_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const { token, resetToken } = (0, tokenUtils_1.createActivationResetToken)({ email });
        yield (0, emailService_1.sendEmail)(email, 'Password Reset OTP', `Your OTP is: ${resetToken}`);
        res.status(201).json({ message: "OTP sent to email. Please verify", token });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.forgotPassword = forgotPassword;
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, otp } = req.body;
        console.log("OTP", otp);
        const verified = (0, tokenUtils_1.verifyActivationResetToken)(token);
        if (!verified || verified.resetToken !== otp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }
        res.status(200).json({ message: 'OTP verified. You can now reset your password.' });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.verifyOTP = verifyOTP;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, password } = req.body;
        const verified = (0, tokenUtils_1.verifyActivationResetToken)(token);
        if (!verified) {
            res.status(400).json({ message: 'Invalid token' });
            return;
        }
        const user = yield userModal_1.default.findOne({ email: verified.user.email });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        user.password = hashedPassword;
        yield user.save();
        res.status(200).json({ message: 'Password reset successfully' });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.resetPassword = resetPassword;
const hello = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("Hello , How are you");
});
exports.hello = hello;
