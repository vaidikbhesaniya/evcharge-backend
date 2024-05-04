import { Router } from "express";
import * as controller from "../controllers/controllers.js";
const userRouter = Router();

userRouter.post("/register", controller.registerUser);

export { userRouter };
