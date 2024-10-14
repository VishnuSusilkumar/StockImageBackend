import mongoose,{Document, Model, Schema, Types} from "mongoose";

export interface IImage extends Document{
userId:Types.ObjectId;
title:string;
imageUrl:string;
imageKey:string;
order:number;
createdAt:Date;
}

const imageSchema:Schema<IImage> = new Schema({
userId:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
},
title: { 
    type: String, 
    required: true 
  },
imageUrl: { 
    type: String, 
    required: true 
  },
  imageKey: { 
    type: String, 
    required: true 
  },
  order: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
})

const Image:Model<IImage> = mongoose.model("Image",imageSchema)
export default Image;