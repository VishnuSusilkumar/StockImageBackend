import express, { Router } from "express";
import { uploadMiddleware,uploadImages,getImages,updateImageTitle,deleteImage,reorderImages } from "../controller/imageController";
import { isvalidate } from "../middleware/authMiddleware";

const imageRouter:Router = express.Router()

imageRouter.post('/upload',isvalidate, uploadMiddleware, uploadImages);
imageRouter.get('/',isvalidate, getImages);
imageRouter.put('/:id/title',isvalidate, updateImageTitle);
imageRouter.delete('/:id',isvalidate, deleteImage);
imageRouter.put('/reorder',isvalidate, reorderImages);


export default imageRouter;