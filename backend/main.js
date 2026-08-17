import path from "path";
import express from "express"
import userRoutes from "./routes/users.js"
import  authRoutes from "./routes/auth.js"
import  'dotenv/config'
import connectMongoDB from './db/connect.js'
import cookieparser from 'cookie-parser'
import { v2 as cloudinary } from 'cloudinary'
import postRoutes from "./routes/post.js";
import notificationRoutes from "./routes/notification.js";


const app = express();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const PORT = process.env.PORT || 8000;
const __dirname = path.resolve()

app.use(express.json({ limit: "5mb" }));// Middleware to parse req.body
//limit is set and shouldnt be too high to prevent DOS attack
app.use(express.urlencoded({extended: true})) //parse form data(urlencoded)
app.use(cookieparser())

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/notifications', notificationRoutes)

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("{*splat}", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.listen(PORT, () => {
    connectMongoDB();
    console.log(`Server is running on http://localhost:${PORT}`)
});