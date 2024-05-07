import { Router } from "express";
import { loginUser, registerUser } from "../controllers/controller.js";
const userRouter: Router = Router();

userRouter.post("/register", registerUser).post("/login", loginUser);

export { userRouter };
