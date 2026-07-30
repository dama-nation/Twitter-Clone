import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
    fullName:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true,
        minlength: 6
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    followers: {
        type: [mongoose.Schema.ObjectId],
        ref: 'User',
        default: []
    },
    following: {
        type: [mongoose.Schema.ObjectId],
        ref: 'User',
        default: []
    },
    profileImage: {
        type: String,
        default: ''
    },
    coverImg: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: ''
    },
    likedPosts: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Post',
            default: []
        }
    ]
},{timestamps: true});

const User = mongoose.model('User', userSchema);

export default User;    