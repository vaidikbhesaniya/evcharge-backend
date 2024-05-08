import { Router } from "express";
import {
  addBookmark,
  addReview,
  getBookmarks,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  removeBookmark,
  removeReview,
} from "../controllers/controller.js";

// Routers
const router: Router = Router();

router
  // User
  .get("/user", getUser)
  .post("/user/register", registerUser)
  .post("/user/login", loginUser)
  .post("/user/logout", logoutUser)
  // Bookmark
  .get("/bookmarks", getBookmarks)
  .post("/bookmark/add", addBookmark)
  .delete("/bookmark/remove", removeBookmark)
  // Review
  .post("/review/add", addReview)
  .delete("/review/delete", removeReview)

export { router };
