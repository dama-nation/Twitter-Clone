import express from "express"
import authRoutes from "./routes/auth.js"
import dotenv from 'dotenv'
import connectMongoDB from './db/connect.js'
import cookieparser from 'cookie-parser'

const app = express();
dotenv.config();
const PORT = process.env.PORT || 8000;

app.use(express.json()) // Middleware to parse req.body
app.use(express.urlencoded({extended: true})) //parse form data(urlencoded)
app.use(cookieparser())

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
    connectMongoDB();
});