import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { emailRegex, isNonEmptyString } from "../lib/utils/validate.js";

export const signup = async (req, res) => {
    try{
        const {fullName, username, email, password} = req.body;
        if(![fullName, username, email, password].every(isNonEmptyString)){
            return res.status(400).json({error: "fullName, username, email and password are required"});
        }
        if(!emailRegex.test(email)){
            return res.status(400).json({error: "Invalid email format"});
        }
        if(!/^[a-zA-Z0-9_]{3,30}$/.test(username)){
            return res.status(400).json({error: "Username must be 3-30 characters (letters, numbers, underscores)"});
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

        if(newUser){
            await newUser.save();
            generateTokenAndSetCookie(newUser._id, res);

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,
            });
        } else{
            res.status(400).json({error: "Invalid User data"})
        }

    }catch(error){
        res.status(500).json({error: "Internal Server Error"})
        console.log(`Error creating user: ${error.message}`);
    }
}

export const login = async (req, res) => {
    try{
        const {username, password} = req.body;
        if(!isNonEmptyString(username) || !isNonEmptyString(password)){
            return res.status(400).json({error: "Invalid username or password"});
        }
        const user = await User.findOne({username});
        const correctPassword = await bcrypt.compare(password, user?.password || "");

        if(!user || !correctPassword){
            return res.status(400).json({error: "Invalid username or password"});
            
        }
        generateTokenAndSetCookie(user._id, res);
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
        })

    } catch(error){
        console.log(`Error in logging user: ${error.message}`)
        res.status(500).json({error: 'internal Server Error'});
    }
}

export const logout = async (req, res) => {
    try{
        res.cookie("jwt", "", {
            maxAge: 0,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development",
        });
        res.status(200).json({message: "User logged out successfully"})
    } catch(error){
        console.log(`Error in logging out user: ${error.message}`)
        res.status(500).json({error: 'internal Server Error'});
    }
}

export const getMe = async (req, res) => {
    try{
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error){
        console.log("Error in the getMe controller", error.message);
        res.status(500).json({error: "Internal server error"})
    }
}