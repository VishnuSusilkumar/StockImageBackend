"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const imageController_1 = require("../controller/imageController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const imageRouter = express_1.default.Router();
imageRouter.post('/upload', authMiddleware_1.isvalidate, imageController_1.uploadMiddleware, imageController_1.uploadImages);
imageRouter.get('/', authMiddleware_1.isvalidate, imageController_1.getImages);
imageRouter.put('/:id/title', authMiddleware_1.isvalidate, imageController_1.updateImageTitle);
imageRouter.delete('/:id', authMiddleware_1.isvalidate, imageController_1.deleteImage);
imageRouter.put('/reorder', authMiddleware_1.isvalidate, imageController_1.reorderImages);
exports.default = imageRouter;
