import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../lib/utils/asyncHandler.js";
import { hashPassword, isValidPassword } from "../lib/utils/password.js";
import { serializePublicUser } from "../lib/utils/user.js";

export const signup = asyncHandler(async (req, res) => {
    const {fullName, username, email, password} = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
        return res.status(400).json({error: "Invalid email format"});
    }
    const existingUser = await User.findOne({username});
    if(existingUser){
        return res.status(400).json({error: "Username already exists"});
    }
    const existingEmail = await User.findOne({email});
    if(existingEmail){
        return res.status(400).json({error: "Email already exists"});
    }

    if(!isValidPassword(password)){
        return res.status(400).json({error: "Password must be at least 6 characters long"});
    }
    const hashedPassword = await hashPassword(password);

    const newUser = new User({
        fullName,
        username,
        email,
        password: hashedPassword
    });

    if(newUser){
        generateTokenAndSetCookie(newUser._id, res);
        await newUser.save();

        res.status(201).json(serializePublicUser(newUser));
    } else{
        res.status(400).json({error: "Invalid User data"})
    }

}, "Error creating user:");

export const login = asyncHandler(async (req, res) => {
    const {username, password} = req.body;
    const user = await User.findOne({username});
    const correctPassword = await bcrypt.compare(password, user?.password || "");

    if(!user || !correctPassword){
        return res.status(400).json({error: "Invalid username or password"});

    }
    generateTokenAndSetCookie(user._id, res);
    res.status(200).json(serializePublicUser(user))

}, "Error in logging user:");

export const logout = asyncHandler(async (req, res) => {
    res.cookie("jwt", "", {maxAge: 0});
    res.status(200).json({message: "User logged out successfully"})
}, "Error in logging out user:");

export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
}, "Error in the getMe controller");