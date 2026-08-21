import Notification from '../models/notificationModel.js'
import Post from '../models/postModel.js'
import User from '../models/userModel.js'
import { asyncHandler } from "../lib/utils/asyncHandler.js";
import { uploadImage, destroyImageByUrl } from "../lib/utils/cloudinary.js";
import { populatePostUsers } from "../lib/utils/postQuery.js";

export const createPost = asyncHandler(async (req, res) => {
    const { text } = req.body;
    // Accept either 'image' or 'img' from the request body
    let image = req.body.image || req.body.img;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!text && !image) {
        return res.status(400).json({ error: "Please provide text or image" });
    }

    if (image) {
        image = await uploadImage(image);
        if (!image) {
            return res.status(400).json({ error: "Image upload failed" });
        }
    }

    const newPost = new Post({
        user: userId,
        text,
        image, // Matches schema definition: image: { type: String }
    });

    await newPost.save();
    res.status(201).json(newPost);
}, "Error in creating post:");

export const deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id)
    if(!post){
        return res.status(404).json({error: "Post not found"})
    }
    if(post.user.toString() !== req.user._id.toString()){
        return res.status(401).json({error: "You are not authorized to delete this post"})
    }
    if(post.image){
        await destroyImageByUrl(post.image)
    }
    await Post.findByIdAndDelete(req.params.id)
    res.status(200).json({message: "Post deleted successfully"})

}, "Error in deleting post:");

export const commentOnPost = asyncHandler(async (req, res) => {
    const { text } = req.body
    const postId = req.params.id
    const userId = req.user._id.toString()

    if(!text){return res.status(400).json({error: "Please Provide Text"})}
    const post = await Post.findById(postId)
    if(!post){return res.status(404).json({error: "Post not found"})}

    const comment = {user: userId, text}
    post.comments.push(comment)
    await post.save()
    res.status(200).json(post)
}, "Error in commenting:");

export const likeUnlikePost = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { id: postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
        await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
        await User.updateOne({_id: userId}, {$pull: {likedPosts: postId}})

        const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
        res.status(200).json(updatedLikes);
    } else {
        post.likes.push(userId);
        await User.updateOne({_id: userId}, {$push: {likedPosts: postId}})
        await post.save();


        if (post.user.toString() !== userId) {
            const notification = new Notification({
                from: userId,
                to: post.user,
                type: 'like',
            });
            await notification.save();
        }
        const updatedLikes = post.likes
        res.status(200).json(updatedLikes);
    }
}, "Error in liking / unliking post:");

export const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await populatePostUsers(Post.find().sort({ createdAt: -1}))

    if(posts.length === 0){
        return res.status(200).json([])
    }
    res.status(200).json(posts)
}, "Error in getting all posts:");

export const getLikedPosts = asyncHandler(async (req, res) => {
    const userId = req.params.id
    const user = await User.findById(userId);
    if(!user){return res.status(404).json({error: "User not found"})}

    const likedPosts = await populatePostUsers(Post.find({_id: {$in: user.likedPosts}}))
    res.status(200).json(likedPosts)
}, "Error in getting liked posts:");

export const getFollowingPosts = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    if(!user){res.status(404).json({error: "User not found"})}

    const following = user.following

    const feedPosts = await populatePostUsers(Post.find({user: {$in: following}}).sort({createdAt: -1}))
    res.status(200).json(feedPosts)
}, "Error in getting following posts:");

export const getUserPosts = asyncHandler(async (req, res) => {
    const { username } = req.params
    const user = await User.findOne({ username })
    if(!user){res.status(400).json({error: "User not found"})}

    const posts = await populatePostUsers(Post.find({user: user._id}).sort({createdAt: -1}))
    res.status(200).json(posts)
}, "Error in getting user posts:");