import Notification from '../models/notificationModel.js'
import Post from '../models/postModel.js'
import User from '../models/userModel.js'
import { destroyImage, uploadImage } from '../lib/utils/cloudinary.js'

export const createPost = async (req, res, next) => {
    try {
        const { text } = req.body ?? {};
        // Accept either 'image' or 'img' from the request body
        let image = req.body?.image || req.body?.img;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (!text && !image) {
            return res.status(400).json({ error: "Please provide text or image" });
        }

        if (image) {
            image = await uploadImage(image);
        }

        const newPost = new Post({
            user: userId,
            text,
            image, // Matches schema definition: image: { type: String }
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        next(error);
    }
};

export const deletePost = async (req, res, next) => {
    try{
        const post = await Post.findById(req.params.id)
        if(!post){
            return res.status(404).json({error: "Post not found"})
        }
        if(post.user.toString() !== req.user._id.toString()){
            return res.status(401).json({error: "You are not authorized to delete this post"})
        }
        await Post.findByIdAndDelete(req.params.id)
        // Removing the asset is best-effort and logged: the post is already gone.
        await destroyImage(post.image)
        res.status(200).json({message: "Post deleted successfully"})
    }catch(error){
        next(error);
    }
};

export const commentOnPost = async (req, res, next) => {
    try{
        const { text } = req.body ?? {}
        const postId = req.params.id
        const userId = req.user._id.toString()

        if(!text){return res.status(400).json({error: "Please Provide Text"})}
        const post = await Post.findById(postId)
        if(!post){return res.status(404).json({error: "Post not found"})}

        const comment = {user: userId, text}
        post.comments.push(comment)
        await post.save()
        res.status(200).json(post)
    }catch(error){
        next(error);
    }
};

export const likeUnlikePost = async (req, res, next) => {
    try {
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
                // A failed notification must not turn a successful like into an error.
                try {
                    await notification.save();
                } catch (notificationError) {
                    console.error("Failed to create like notification:", notificationError);
                }
            }
            const updatedLikes = post.likes
            res.status(200).json(updatedLikes);
        }
    } catch (error) {
        next(error);
    }
};

export const getAllPosts = async (req, res, next) => {
    try{
        const posts = await Post.find().sort({ createdAt: -1}).
        populate({path: 'user', select: '-password'}).populate({path: 'comments.user', select: '-password'})

        res.status(200).json(posts)
    }catch(error){
        next(error);
    }
};

export const getLikedPosts = async (req, res, next) => {
    try{
        const userId = req.params.id
        const user = await User.findById(userId);
        if(!user){return res.status(404).json({error: "User not found"})}

        const likedPosts = await Post.find({_id: {$in: user.likedPosts}})
        .populate({
            path: 'user',
            select: '-password'
        })
        .populate({
            path: 'comments.user',
            select: '-password'
        })
        res.status(200).json(likedPosts)
    }catch(error){
        next(error);
    }
};

export const getFollowingPosts = async (req, res, next) => {
    try{
        const user = await User.findById(req.user._id)
        if(!user){return res.status(404).json({error: "User not found"})}

        const following = user.following

        const feedPosts = await Post.find({user: {$in: following}})
        .sort({createdAt: -1})
        .populate({
            path: 'user',
            select: '-password'
        })
        .populate({
            path: 'comments.user',
            select: '-password'
        })
        res.status(200).json(feedPosts)
    }catch(error){
        next(error);
    }
};

export const getUserPosts = async (req, res, next) => {
    try{
        const { username } = req.params
        const user = await User.findOne({ username })
        if(!user){return res.status(404).json({error: "User not found"})}

        const posts = await Post.find({user: user._id})
        .sort({createdAt: -1})
        .populate({
            path: 'user',
            select: '-password'
        })
        .populate({
            path: 'comments.user',
            select: '-password'
        })
        res.status(200).json(posts)
    }catch(error){
        next(error);
    }
}
