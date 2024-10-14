import mongoose, { Model, ObjectId, Schema } from "mongoose";

export interface IUser extends Document {
    fullname?: string;
    email: string;
    phonenumber: number;
    password: string;
    
  }


const userSchema:Schema<IUser> = new mongoose.Schema({
    fullname:{
        type:String,
        required:true
    },
    email:{type:String,required:true},
    phonenumber:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    }
},{timestamps:true})

 const User :Model<IUser>=  mongoose.model('User',userSchema);
 
 export default User