import { Router } from "express";
import * as controller from "../controllers/controllers.js";
const userRouter = Router();

userRouter
    .post("/register", controller.registerUser)
    .post("/login", controller.loginUser);
// .post("/sendVerificationMail", controller.sendVerificationMail)
// .post("/sendMail", controller.sendMail)
// .post("/verifyOtp", controller.verifyOtp)

export { userRouter };
