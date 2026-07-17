import express from "express"
import authRoutes from "./routes/auth.js"
import dotenv from 'dotenv'
import connectMongoDB from './db/connect.js'

const app = express();
dotenv.config();
const PORT = process.env.PORT || 8000;


app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
    connectMongoDB();
});