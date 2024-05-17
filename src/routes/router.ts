import { Router } from "express";
import upload from "../middleware/multer.js";
import {
    addBookmark,
    addReview,
    getBookmarks,
    getReview,
    getUser,
    loginUser,
    logoutUser,
    registerUser,
    removeBookmark,
    removeReview,
    updateUser,
} from "../controllers/controller.js";

// Routers
const router: Router = Router();

router
    // User
    .get("/user", getUser)
    .post("/user/register", registerUser)
    .put("/user/update", upload.single("profilePicture"), updateUser)
    .post("/user/login", loginUser)
    .post("/user/logout", logoutUser)
    // Bookmark
    .get("/bookmarks", getBookmarks)
    .post("/bookmark/add", addBookmark)
    .delete("/bookmark/remove", removeBookmark)
    // Review
    .post("/review/add", addReview)
    .get("/reviews", getReview)
    .delete("/review/delete", removeReview);
// .get("/stations", getStations);
//station

export { router };
