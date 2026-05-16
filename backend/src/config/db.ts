import mongoose from "mongoose";
import dns from "dns";

// Fix for DNS resolution issues with MongoDB Atlas in certain regions (e.g., Egypt)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aegis-ai";
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
