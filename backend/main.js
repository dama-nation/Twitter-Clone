import express from "express"
import userRoutes from "./routes/users.js"
import  authRoutes from "./routes/auth.js"
import dotenv from 'dotenv'
import connectMongoDB from './db/connect.js'
import cookieparser from 'cookie-parser'
import { v2 as cloudinary } from 'cloudinary'
import postRoutes from "./routes/post.js";



const app = express();
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const PORT = process.env.PORT || 8000;

app.use(express.json()) // Middleware to parse req.body
app.use(express.urlencoded({extended: true})) //parse form data(urlencoded)
app.use(cookieparser())

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
    connectMongoDB();
});