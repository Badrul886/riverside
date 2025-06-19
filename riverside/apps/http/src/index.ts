import express from 'express';
import cookieParser from "cookie-parser";
import { router } from './routes/v1';
// import client from '@repo/db/client'; // Adjust the import path based on your project structure

import dotenv from 'dotenv';
import path from 'path';

// Load the env file from db package
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });

// ✅ Must come before any import that uses the Prisma client


const app = express();
app.use(express.json());
app.use(cookieParser()); 

app.use("/api/v1", router);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
});
