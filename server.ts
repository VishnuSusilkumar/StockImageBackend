import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import router from './src/routes/authRoute';
import connectDB from './src/config/db';
import imageRouter from './src/routes/imageRoute';

dotenv.config();

const app = express();


connectDB()
    .then(() => console.log('Connected to Database'))
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1); 
    });

app.use(express.json());
app.use(cors({
    origin: "https://stock-image-frontend.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));
app.use(cookieParser());

app.use('/api/auth', router);
app.use('/api/image', imageRouter);

const port = process.env.PORT || 10000;

app.listen(port, () => {
    console.log(`Server running on PORT: ${port}`);
});
