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
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { isCloudinaryConfigured } from "./lib/utils/cloudinary.js";


const app = express();

const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
    console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary is not configured: image uploads will be rejected with 503");
}
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

// Unmatched API routes must answer with JSON so the client never tries to parse
// the SPA's HTML as an error payload.
app.use('/api', notFoundHandler)

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("{*splat}", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.use(errorHandler)

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught exception, shutting down:", error);
    process.exit(1);
});

const start = async () => {
    await connectMongoDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`)
    });
};

start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
