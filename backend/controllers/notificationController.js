import Notification from '../models/notificationModel.js'
import User from '../models/userModel.js'
import { asyncHandler } from "../lib/utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const notifications = await Notification.find({to: userId})
    .populate({
        path: 'from',
        select: 'username profileImg'
    })
    await Notification.updateMany({to: userId}, {read: true})
    res.status(200).json(notifications)
}, "Error in getting notifications:");

export const deleteNotification = asyncHandler(async (req, res) => {
    const notificationId = req.params.id
    const userId = req.user._id
    const notification = await Notification.findById(notificationId)

    if(!notification){return res.status(404).json({error: "Notification not found"})}
    if(notification.to.toString() !== userId){return res.status(403).json({error: "Forbidden"})}

    await Notification.findByIdAndDelete(notificationId)
    res.status(200).json({message: "Notification deleted successfully"})
}, "Error in deleting notification:");

export const deleteAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id
    await Notification.deleteMany({to: userId})
    res.status(200).json({message: "Notifications deleted successfully"})
}, "Error in deleting notifications:");