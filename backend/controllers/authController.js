import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

const publicUser = (user) => ({
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    followers: user.followers,
    following: user.following,
    profileImg: user.profileImg,
    coverImg: user.coverImg,
});

export const signup = async (req, res, next) => {
    try{
        const {fullName, username, email, password} = req.body ?? {};

        if(!fullName || !username || !email || !password){
            return res.status(400).json({error: "fullName, username, email and password are required"});
        }
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

        if(password.length < 6){
            return res.status(400).json({error: "Password must be at least 6 characters long"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword
        });

        // Persist first: a failing save must not leave the client holding a
        // session cookie for a user that does not exist.
        await newUser.save();
        generateTokenAndSetCookie(newUser._id, res);

        res.status(201).json(publicUser(newUser));
    }catch(error){
        next(error);
    }
}

export const login = async (req, res, next) => {
    try{
        const {username, password} = req.body ?? {};
        if(!username || !password){
            return res.status(400).json({error: "Username and password are required"});
        }

        const user = await User.findOne({username});
        const correctPassword = await bcrypt.compare(password, user?.password || "");

        if(!user || !correctPassword){
            return res.status(400).json({error: "Invalid username or password"});
        }
        generateTokenAndSetCookie(user._id, res);
        res.status(200).json(publicUser(user))
    } catch(error){
        next(error);
    }
}

export const logout = async (req, res, next) => {
    try{
        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({message: "User logged out successfully"})
    } catch(error){
        next(error);
    }
}

export const getMe = async (req, res, next) => {
    try{
        const user = await User.findById(req.user._id).select("-password");
        if(!user){
            return res.status(404).json({error: "User not found"});
        }
        res.status(200).json(user);
    } catch (error){
        next(error);
    }
}
