import express from 'express'
import { protectRoute } from '../middleware/protectRoute.js';
import { getProfile, followUser, getSuggestedUsers, updateUser, searchUsers } from '../controllers/userController.js';



const router = express.Router();
router.get('/profile/:username', protectRoute,getProfile)
router.get('/suggested',protectRoute, getSuggestedUsers)
router.post('/follow/:id', protectRoute, followUser)
router.get("/search/:query", protectRoute, searchUsers);
router.post('/update',protectRoute, updateUser)


export default router