import  User  from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import bcrypt from 'bcryptjs'
import { destroyImage, uploadImage } from '../lib/utils/cloudinary.js'

export const getProfile = async (req, res, next) => {
    const {username} = req.params;
    try{
        const user = await User.findOne({username}).select("-password");
        if(!user){return res.status(404).json({error: "User not found"});}
        res.status(200).json(user);
    } catch (error){
        next(error);
    }
}

export const followUser = async (req, res, next) => {
    try{
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
            // A failed notification must not report the completed follow as an error.
            try {
                await newNotification.save();
            } catch (notificationError) {
                console.error("Failed to create follow notification:", notificationError);
            }

            return res.status(200).json({message: "User followed successfully"})
        }
    } catch (error){
        next(error);
    }
};

export const getSuggestedUsers = async (req, res, next) => {
	try {
		const userId = req.user._id;

		const usersFollowedByMe = await User.findById(userId).select("following");
		if (!usersFollowedByMe) {
			return res.status(404).json({ error: "User not found" });
		}

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
	} catch (error) {
		next(error);
	}
};

export const updateUser = async (req, res, next) => {
    const { fullName,  email, username, currentPassword, newPassword, bio, link } = req.body ?? {}
    let { profileImg, coverImg } = req.body ?? {}

    const userId = req.user._id;

    try{
        let user = await User.findById(userId);
        if(!user){return res.status(404).json({error: "User not found"})}

        if((!newPassword && currentPassword) || (!currentPassword && newPassword)){
            return res.status(400).json({error: "Please provide both current and new password"})
        }
        if(currentPassword &&newPassword){
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            if(!isPasswordCorrect){return res.status(400).json({error: "Current Password is incorrect"})}
            if(newPassword.length < 6){return res.status(400).json({error: "Password must be at least 6 characters long"})}
            
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(newPassword, salt)
        }
        // Upload the replacement before dropping the old asset, so a failed
        // upload leaves the current image intact.
        if(profileImg){
            const previousImg = user.profileImg
            profileImg = await uploadImage(profileImg)
            await destroyImage(previousImg)
        }
        if(coverImg){
            const previousImg = user.coverImg
            coverImg = await uploadImage(coverImg)
            await destroyImage(previousImg)
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

    } catch(error){
        next(error);
    }
}

export const searchUsers = async (req, res, next) => {
    try {
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
    } catch (error) {
        next(error);
    }
};