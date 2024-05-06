import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { userRouter } from "./routes/router.js";
import path from "path";
dotenv.config();
// Create an Express application
const app = express();

// Define a route

app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        origin: [
            "https://evcharge-theta.vercel.app",
            "http://localhost:5173",
            "http://192.168.2.7:5173",
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);
app.use(express.urlencoded({ extended: true }));

app.set("view-engine", "ejs");
app.set("views", path.resolve("./views"));
app.use("/user", userRouter);

// Start the server
const PORT = 8080;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Database Connected");
        app.listen(PORT, () => {
            console.log("Server Started");
        });
    })
    .catch((err) => {
        console.log(err);
    });
