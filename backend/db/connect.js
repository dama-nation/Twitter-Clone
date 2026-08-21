import mongoose from "mongoose";

const connectMongoDB = async () => {
    mongoose.connection.on("error", (error) => {
        console.error("MongoDB connection error:", error);
    });
    mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected");
    });
    mongoose.connection.on("reconnected", () => {
        console.log("MongoDB reconnected");
    });

    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB connected: ${conn.connection.host}`)
    return conn;
}
export default connectMongoDB;
