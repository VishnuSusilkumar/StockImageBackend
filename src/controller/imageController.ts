import { Request,Response,NextFunction } from "express";
import User from "../model/userModal";
import Image from "../model/imageModal";
import AWS from 'aws-sdk';
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import s3 from "../utils/s3";

const upload = multer({
    storage:multer.memoryStorage(),
    limits:{fileSize:5*1024*1024}
});

const MAX_TITLE_LENGTH = 50;
const MAX_FILENAME_LENGTH = 50;

export const uploadMiddleware = upload.array("images",10);



export const uploadImages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
      const files = req.files as Express.Multer.File[];
      
      
      const titlesRaw = req.body.titles; 
      if (typeof titlesRaw !== 'string') {
          res.status(400).json({ error: "Titles must be a comma-separated string." });
          return;
      }

      const titles = titlesRaw.split(',').map((title: string) => title.trim());

      if (!req.user) {
          res.status(401).json({ message: "Unauthorized, user not found" });
          return;
      }

      const userId = req.user.id;

      if (!files || files.length === 0) {
          res.status(400).json({ error: "No files uploaded" });
          return;
      }

      const highestOrderImage = await Image.findOne({ userId }).sort("-order").select("order");
      const nextOrder = highestOrderImage ? highestOrderImage.order + 1 : 0;

      const uploadPromises = files.map(async (file, index) => {
          const truncatedFileName = file.originalname.slice(0, MAX_FILENAME_LENGTH);
          const fileExtension = truncatedFileName.split(".").pop();
          const imageKey = `${uuidv4()}.${fileExtension}`;

          const params = {
              Bucket: process.env.AWS_BUCKET_NAME as string,
              Key: imageKey,
              Body: file.buffer,
              ContentType: file.mimetype,
          };

          const uploadResult = await s3.upload(params).promise();

          const title = titles[index]?.slice(0, MAX_TITLE_LENGTH) || truncatedFileName;

          const newImage = new Image({
              userId,
              imageUrl: uploadResult.Location,
              imageKey: imageKey,
              title,
              order: nextOrder + index,
          });
          return newImage.save();
      });

      const savedImages = await Promise.all(uploadPromises);
      res.status(201).json({
          message: "Images uploaded successfully",
          images: savedImages,
      });
  } catch (e: any) {
      console.log("Error uploading images:", e);
      res.status(500).json({ e: "Error uploading images" });
  }
};


export const getImages = async(req:AuthenticatedRequest,res:Response,next:NextFunction):Promise<void> =>{
    try {

        if (!req.user) {
             res.status(401).json({ message: "Unauthorized, user not found" });
             return;
        }
        const userId = req.user.id;
        const images = await Image.find({userId}).sort("order");
        res.status(200).json({images})
    } catch (e:any) {
        console.log("Error fetching images:", e);
    res.status(500).json({ e: "Internal server error" });
    }
}

export const updateImageTitle = async(req:AuthenticatedRequest,res:Response,next:NextFunction):Promise<void> =>{
    try {
        const {id} = req.params;
        const{title} = req.body;
        const userId = req.user?.id;

        const truncatedTitle = title.slice(0,MAX_TITLE_LENGTH);

        const image = await Image.findOneAndUpdate(
            {_id:id,userId},
            {title:truncatedTitle},
            {new:true}
        );

        if(!image){
             res.status(404).json({error:"Image not found"});
             return;
        }

        res.json(image)
    } catch (error:any) {
        console.log("Error updating image title:", error);
        res.status(500).json({ error: "Error updating image title" });
    }
}

export const deleteImage = async (req: AuthenticatedRequest,res: Response,next: NextFunction
  ):Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
  
      const image = await Image.findOneAndDelete({ _id: id, userId });
  
      if (!image) {
         res.status(404).json({ error: "Image not found" });
         return
      }
  
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: image.imageKey,
      };
  
      await s3.deleteObject(params).promise();
  
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.log("Error deleting image:", error);
      res.status(500).json({ error: "Error deleting image" });
    }
  };


  export const reorderImages = async (req: AuthenticatedRequest,res: Response,next: NextFunction
  ) => {
    try {
      const { imageIds } = req.body;
      const userId = req.user?.id;
  
      await Promise.all(
        imageIds.map((image: { id: string; order: number }) =>
          Image.findOneAndUpdate(
            { _id: image.id, userId },
            { order: image.order }
          )
        )
      );
  
      res.json({ message: "Images reordered successfully" });
    } catch (error) {
      console.error("Error reordering images:", error);
      res.status(500).json({ error: "Error reordering images" });
    }
  };