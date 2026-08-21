import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
    const token = req.cookies.jwt;
    if(!token){
        return res.status(401).json({error: "Unauthorized: No Token Provided"});
    }

    let decoded;
    try{
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error){
        if(error.name === "TokenExpiredError"){
            return res.status(401).json({error: "Unauthorized: Token Expired"});
        }
        if(error.name === "JsonWebTokenError" || error.name === "NotBeforeError"){
            return res.status(401).json({error: "Unauthorized: Invalid Token"});
        }
        return next(error);
    }

    try{
        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(401).json({error: "User not found"});
        }
        req.user = user;
        next();
    } catch (error){
        next(error);
    }
}
