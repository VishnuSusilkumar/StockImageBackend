"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderImages = exports.deleteImage = exports.updateImageTitle = exports.getImages = exports.uploadImages = exports.uploadMiddleware = void 0;
const imageModal_1 = __importDefault(require("../model/imageModal"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const s3_1 = __importDefault(require("../utils/s3"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});
const MAX_TITLE_LENGTH = 50;
const MAX_FILENAME_LENGTH = 50;
exports.uploadMiddleware = upload.array("images", 10);
const uploadImages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        const titlesRaw = req.body.titles;
        if (typeof titlesRaw !== 'string') {
            res.status(400).json({ error: "Titles must be a comma-separated string." });
            return;
        }
        const titles = titlesRaw.split(',').map((title) => title.trim());
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized, user not found" });
            return;
        }
        const userId = req.user.id;
        if (!files || files.length === 0) {
            res.status(400).json({ error: "No files uploaded" });
            return;
        }
        const highestOrderImage = yield imageModal_1.default.findOne({ userId }).sort("-order").select("order");
        const nextOrder = highestOrderImage ? highestOrderImage.order + 1 : 0;
        const uploadPromises = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const truncatedFileName = file.originalname.slice(0, MAX_FILENAME_LENGTH);
            const fileExtension = truncatedFileName.split(".").pop();
            const imageKey = `${(0, uuid_1.v4)()}.${fileExtension}`;
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: imageKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            const uploadResult = yield s3_1.default.upload(params).promise();
            const title = ((_a = titles[index]) === null || _a === void 0 ? void 0 : _a.slice(0, MAX_TITLE_LENGTH)) || truncatedFileName;
            const newImage = new imageModal_1.default({
                userId,
                imageUrl: uploadResult.Location,
                imageKey: imageKey,
                title,
                order: nextOrder + index,
            });
            return newImage.save();
        }));
        const savedImages = yield Promise.all(uploadPromises);
        res.status(201).json({
            message: "Images uploaded successfully",
            images: savedImages,
        });
    }
    catch (e) {
        console.log("Error uploading images:", e);
        res.status(500).json({ e: "Error uploading images" });
    }
});
exports.uploadImages = uploadImages;
const getImages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized, user not found" });
            return;
        }
        const userId = req.user.id;
        const images = yield imageModal_1.default.find({ userId }).sort("order");
        res.status(200).json({ images });
    }
    catch (e) {
        console.log("Error fetching images:", e);
        res.status(500).json({ e: "Internal server error" });
    }
});
exports.getImages = getImages;
const updateImageTitle = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { title } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const truncatedTitle = title.slice(0, MAX_TITLE_LENGTH);
        const image = yield imageModal_1.default.findOneAndUpdate({ _id: id, userId }, { title: truncatedTitle }, { new: true });
        if (!image) {
            res.status(404).json({ error: "Image not found" });
            return;
        }
        res.json(image);
    }
    catch (error) {
        console.log("Error updating image title:", error);
        res.status(500).json({ error: "Error updating image title" });
    }
});
exports.updateImageTitle = updateImageTitle;
const deleteImage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const image = yield imageModal_1.default.findOneAndDelete({ _id: id, userId });
        if (!image) {
            res.status(404).json({ error: "Image not found" });
            return;
        }
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: image.imageKey,
        };
        yield s3_1.default.deleteObject(params).promise();
        res.json({ message: "Image deleted successfully" });
    }
    catch (error) {
        console.log("Error deleting image:", error);
        res.status(500).json({ error: "Error deleting image" });
    }
});
exports.deleteImage = deleteImage;
const reorderImages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { imageIds } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        yield Promise.all(imageIds.map((image) => imageModal_1.default.findOneAndUpdate({ _id: image.id, userId }, { order: image.order })));
        res.json({ message: "Images reordered successfully" });
    }
    catch (error) {
        console.error("Error reordering images:", error);
        res.status(500).json({ error: "Error reordering images" });
    }
});
exports.reorderImages = reorderImages;
