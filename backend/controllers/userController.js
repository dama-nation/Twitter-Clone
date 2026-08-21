import  User  from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import bcrypt from 'bcryptjs'
import { asyncHandler } from "../lib/utils/asyncHandler.js";
import { uploadImage, destroyImageByUrl } from "../lib/utils/cloudinary.js";
import { hashPassword, isValidPassword } from "../lib/utils/password.js";

export const getProfile = asyncHandler(async (req, res) => {
    const {username} = req.params;
    const user = await User.findOne({username}).select("-password");
    if(!user){return res.status(404).json({error: "User not found"});}
    res.status(200).json(user);
}, "Error in the getProfile");

export const followUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = await User.findById(req.user._id);
    const userToFollow = await User.findById(id);

    if(id === req.user._id.toString()){return res.status(400).json({error: "You cannot follow / unfollow yourself"});}
    if(!userToFollow || !currentUser){return res.status(404).json({error: "User not found"});}

    const isFollowing = currentUser.following.includes(id);

    if(isFollowing){
        await User.findByIdAndUpdate(id, {$pull: {followers: req.user._id}})
        await User.findByIdAndUpdate(req.user._id, {$pull: {following: id}})
        return res.status(200).json({message: "User unfollowed successfully"})
    }else{
        await User.findByIdAndUpdate(id, {$push: {followers: req.user._id}});
        await User.findByIdAndUpdate(req.user._id, {$push: {following: id}});

        // Send notification to the user
        const newNotification = new Notification({
            type: 'follow',
            from: req.user._id,
            to: userToFollow._id,
        });
        await newNotification.save();

        return res.status(200).json({message: "User followed successfully"})
    }
}, "Error in the followUser");

export const getSuggestedUsers = asyncHandler(async (req, res) => {
	const userId = req.user._id;

	const usersFollowedByMe = await User.findById(userId).select("following");

	const users = await User.aggregate([
		{
			$match: {
				_id: { $ne: userId },
			},
		},
		{ $sample: { size: 10 } },
	]);
	const followingIds = usersFollowedByMe.following.map(id => id.toString());
	const filteredUsers = users.filter((user) => !followingIds.includes(user._id.toString()));
	const suggestedUsers = filteredUsers.slice(0, 4);

	suggestedUsers.forEach((user) => (user.password = null));

	res.status(200).json(suggestedUsers);
}, "Error in getSuggestedUsers:");

export const updateUser = asyncHandler(async (req, res) => {
    const { fullName,  email, username, currentPassword, newPassword, bio, link } = req.body
    let { profileImg, coverImg } = req.body

    const userId = req.user._id;

    let user = await User.findById(userId);
    if(!user){return res.status(404).json({message: "User not found"})}

    if((!newPassword && currentPassword) || (!currentPassword && newPassword)){
        return res.status(400).json({error: "Please provide both current and new password"})
// Tell Abba to go to procurement
    }
    if(currentPassword &&newPassword){
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if(!isPasswordCorrect){return res.status(400).json({error: "Current Password is incorrect"})}
        if(!isValidPassword(newPassword)){return res.status(400).json({error: "Password must be at least 6 characters long"})}
        
        user.password = await hashPassword(newPassword)
    }
    if(profileImg){
        if(user.profileImg){
            await destroyImageByUrl(user.profileImg);
        }
        profileImg = await uploadImage(profileImg);
    }
    if(coverImg){
        if(user.coverImg){
            await destroyImageByUrl(user.coverImg);
        }
        coverImg = await uploadImage(coverImg);
    }
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    await user.save();
    user.password = null;
    res.status(200).json(user)

}, "Error in updating user:");

export const searchUsers = asyncHandler(async (req, res) => {
    const { query } = req.params;

    // Return empty array if search is empty
    if (!query) return res.status(200).json([]);

    // Use $regex for partial matching and $options: "i" for case-insensitivity
    const users = await User.find({
        $or: [
            { username: { $regex: query, $options: "i" } },
            { fullName: { $regex: query, $options: "i" } }
        ]
    }).select("-password"); // Exclude passwords from the results

    res.status(200).json(users);
}, "Error in searchUsers:");