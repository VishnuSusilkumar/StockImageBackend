import mongoose, { ConnectOptions } from "mongoose";

const connectDB = async () => {
  console.log("Connecting to MongoDB..."); 
  try {
    const uri = process.env.MONGO_URI!; 

    const options: ConnectOptions = {};

    
    await mongoose.connect(uri, options);
    console.log("Connected to MongoDB");
  } catch (error:any) {
    console.error("MongoDB connection error:", error.message); 
  }
};

export default connectDB;
