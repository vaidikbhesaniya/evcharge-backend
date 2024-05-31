import { compare, genSalt, hash } from "bcrypt";
import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../db/index.js";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../utils/cloudinary.js";
import { generateJWT, verifyJWT } from "../lib/auth.js";
import { formatDistanceToNow } from "date-fns";
// import station_data from "./data.js";
const registerSchema = z.object({
    email: z.string().email(),
    userName: z.string(),
    password: z
        .string()
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/,
            "Password must contain at least one lowercase letter, one uppercase letter, one special character, and be at least 8 characters long."
        ),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/,
            "Invalide Password"
        ),
});

const addReviewSchema = z.object({
    stationId: z.string(),
    review: z.string(),
});

export const registerUser = async (req: Request, res: Response) => {
    try {
        // Validate Request
        const validateData = registerSchema.parse(req.body);
        const { email, userName, password } = validateData;

        // Check if User Exists
        const userExists = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (userExists) {
            // Send Conflict
            return res.status(409).json({ message: "User already exists" });
        }

        // Create User
        const user = await prisma.user.create({
            data: {
                email,
                userName,
                password: await hash(password, await genSalt(10)),
            },
        });
        if (!user) {
            return res
                .status(500)
                .json({ message: "User creation failed unexpectedly" });
        }

        // Set Token in Cookies
        const token = generateJWT({ email, userName });
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        });

        // Send Created
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login User Controller
export const loginUser = async (req: Request, res: Response) => {
    try {
        // Validate Request
        const validateData = loginSchema.parse(req.body);
        const { email, password } = validateData;

        // Check if User Exists
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            // Send Not Found
            return res.status(404).json({ message: "User not found" });
        }

        const passwordMatch = await compare(password, user.password);
        if (!passwordMatch) {
            // Send Unauthorized
            return res.status(401).json({ message: "Incorrect password" });
        }

        // Set Token in Cookies
        const token = generateJWT({ email, userName: user.userName });
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        });

        res.status(201).json({ token, message: "Login successful" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const logoutUser = async (req: Request, res: Response) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    });
    res.status(200).json({ message: "Logout Successfully" });
};

export const getUser = async (req: Request, res: Response) => {
    // Get Token from Cookies
    const token = req.cookies["token"];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Decode Token
        const decodedUser = verifyJWT(token);
        if (!decodedUser || typeof decodedUser !== "object") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if User Exist
        const user = await prisma.user.findUnique({
            where: {
                email: decodedUser.email,
            },
            select: {
                id: true,
                email: true,
                userName: true,
                phoneno: true,
                profilePicture: true,
            },
        });
        if (!user) {
            // Send Not Found
            return res.status(404).json({ message: "User Not Found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTokenUser = async (req: Request, res: Response) => {
    // Get Token from Cookies
    const { token } = req.body;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Decode Token
        const decodedUser = verifyJWT(token);
        if (!decodedUser || typeof decodedUser !== "object") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if User Exist
        const user = await prisma.user.findUnique({
            where: {
                email: decodedUser.email,
            },
            select: {
                id: true,
                email: true,
                userName: true,
                phoneno: true,
                profilePicture: true,
            },
        });
        if (!user) {
            // Send Not Found
            return res.status(404).json({ message: "User Not Found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const addBookmark = async (req: Request, res: Response) => {
    const { stationId } = req.body;
    if (!stationId || typeof stationId !== "number") {
        // Send Bad Request
        return res.status(400).json({ message: "Invalid Station" });
    }

    // Get Token from Cookies
    const token = req.cookies["token"];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Decode Token
        const decodedUser = verifyJWT(token);
        if (!decodedUser || typeof decodedUser !== "object") {
            // Send Unauthorized
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if User Exist
        const user = await prisma.user.findUnique({
            where: {
                email: decodedUser.email,
            },
        });
        if (!user) {
            // Send Not Found
            return res.status(404).json({ message: "User Not Found" });
        }

        // Add Bookmark
        const addBookmarkTransaction = await prisma.$transaction(
            async (prisma) => {
                const bookmark = await prisma.bookmark.create({
                    data: {
                        userId: user.id,
                        stationId,
                    },
                });
                await prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        bookmarks: {
                            connect: {
                                id: bookmark.id,
                            },
                        },
                    },
                });

                return bookmark.id;
            }
        );

        if (typeof addBookmarkTransaction !== "number") {
            return res.status(500).json({ message: "Failed to add bookmark" });
        }

        // Send Created
        res.status(201).json({ message: "Bookmark Added" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getReview = async (req: Request, res: Response) => {
    const { stationId } = req.body;
    console.log(typeof stationId);

    // if (!stationId || isNaN(Number(stationId))) {
    //     return res.status(400).json({ message: "Invalid Station ID" });
    // }

    const token = req.cookies["token"];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decodedUser = verifyJWT(token);
        if (!decodedUser || typeof decodedUser !== "object") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: decodedUser.email,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }
        // console.log(user);

        const reviews = await prisma.review.findMany({
            where: {
                stationId: stationId,
            },
            include: {
                User: {
                    select: {
                        id: true,
                        userName: true,
                        email: true,
                        profilePicture: true,
                    },
                },
                Station: {
                    select: {
                        stationName: true,
                    },
                },
            },
        });

        const reviewsWithTimeAgo = reviews.map((review) => ({
            ...review,
            timeAgo: formatDistanceToNow(new Date(review.createdAt), {
                addSuffix: true,
            }),
        }));

        res.status(200).json(reviewsWithTimeAgo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const removeBookmark = async (req: Request, res: Response) => {
    const { stationId } = req.body;
    // if (!stationId || typeof stationId !== "number") {
    //     // Send Bad Request
    //     return res.status(400).json({ message: "Invalid Station" });
    // }

    // Get Token from Cookies
    const token = req.cookies["token"];
    if (!token) {
        // Send Unauthorized
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Decode Token
        const decodedUser = verifyJWT(token);
        if (!decodedUser || typeof decodedUser !== "object") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if User Exist
        const user = await prisma.user.findUnique({
            where: {
                email: decodedUser.email,
            },
        });
        if (!user) {
            // Send Not Found
            return res.status(404).json({ message: "User Not Found" });
        }

        // Find the Bookmark
        const bookmark = await prisma.bookmark.findFirst({
            where: {
                userId: user.id,
                stationId: stationId,
            },
        });
        console.log("====================================");
        console.log(bookmark, user.id);
        console.log("====================================");
        if (!bookmark) {
            return res.status(404).json({ message: "Bookmark Not Found" });
        }

        // Remove Bookmark
        await prisma.bookmark.delete({
            where: {
                id: bookmark.id,
            },
        });

        // Send Deleted
        res.status(200).json({ message: "Bookmark Removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getBookmarks = async (req: Request, res: Response) => {
    // Get Token from Cookies
    const token = req.cookies["token"];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Decode Token
        const decodedUser = verifyJWT(token);
        if (!decodedUser || typeof decodedUser !== "object") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if User Exist
        const user = await prisma.user.findUnique({
            where: {
                email: decodedUser.email,
            },
        });
        if (!user) {
            // Send Not Found
            return res.status(404).json({ message: "User Not Found" });
        }

        // Get Bookmarks
        const bookmarks = await prisma.bookmark.findMany({
            where: {
                userId: user.id,
            },
        });
        if (!bookmarks) {
            return res.status(500).json({ message: "Failed to get bookmarks" });
        }

        const stationIds = bookmarks.map((bookmark) => bookmark.stationId);

        // Fetch Station Details
        const stations = await prisma.station.findMany({
            where: {
                id: { in: stationIds },
            },
        });

        // Send OK
        res.status(200).json({ stations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addReview = async (req: Request, res: Response) => {
    const { stationId, reviewText } = req.body;

    // if (
    //     !stationId ||
    //     typeof stationId !== "number" ||
    //     !reviewText ||
    //     typeof reviewText !== "string"
    // ) {
    //     // Send Bad Request
    //     return res
    //         .status(400)
    //         .json({ message: "Invalid Station ID or Review Text" });
    // }

    // Get Token from Cookies
    const token = req.cookies["token"];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Decode Token
        const decodedUser = verifyJWT(token);
        if (!decodedUser || typeof decodedUser !== "object") {
            // Send Unauthorized
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if User Exists
        const user = await prisma.user.findUnique({
            where: {
                email: decodedUser.email,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        // Check if the user has already reviewed this station
        const existingReview = await prisma.review.findFirst({
            where: {
                userId: user.id,
                stationId: stationId,
            },
        });

        if (existingReview) {
            // Update the existing review
            const updatedReview = await prisma.review.update({
                where: {
                    id: existingReview.id,
                },
                data: {
                    review: reviewText,
                },
            });

            return res
                .status(200)
                .json({ message: "Review Updated", review: updatedReview });
        } else {
            // Add a new review
            const newReview = await prisma.review.create({
                data: {
                    userId: user.id,
                    stationId,
                    review: reviewText,
                },
            });

            return res
                .status(201)
                .json({ message: "Review Added", review: newReview });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const removeReview = async (req: Request, res: Response) => {
    const { reviewId } = req.body;

    // if (!reviewId || typeof reviewId !== "number") {
    //     // Send Bad Request
    //     return res.status(400).json({ message: "Invalid Review ID" });
    // }

    // Get Token from Cookies
    const token = req.cookies["token"];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Decode Token
        const decodedUser = verifyJWT(token);
        if (!decodedUser || typeof decodedUser !== "object") {
            // Send Unauthorized
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if User Exist
        const user = await prisma.user.findUnique({
            where: {
                email: decodedUser.email,
            },
        });
        if (!user) {
            // Send Not Found
            return res.status(404).json({ message: "User Not Found" });
        }

        // Check if the review exists and belongs to the user
        const review = await prisma.review.findUnique({
            where: {
                id: reviewId,
                userId: user.id,
            },
        });

        if (!review) {
            return res.status(404).json({ message: "Review Not Found" });
        }

        if (review.userId !== user.id) {
            return res.status(403).json({
                message: "Forbidden: You can only delete your own reviews",
            });
        }

        // Remove Review
        await prisma.review.delete({
            where: {
                id: reviewId,
                userId: user.id,
            },
        });

        // Send Success Response
        res.status(200).json({ message: "Review Removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStations = async (req: Request, res: Response) => {
    try {
        // Fetch gas station data from the database
        const stations = await prisma.station.findMany();

        // Send the retrieved data as JSON response
        res.json(stations);
    } catch (error) {
        // If an error occurs, send an error response
        console.error("Error fetching gas stations:", error);
        res.status(500).json({
            error: "An error occurred while fetching gas stations.",
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    // Get Token from Cookies

    const { email, userName, phoneno } = req.body;
    const profilePicture = req.file?.path;
    let profileUrl = "";
    let publicId = "";
    console.log(profilePicture);

    if (profilePicture) {
        const result: UploadApiResponse = await cloudinary.uploader.upload(
            profilePicture,
            {
                folder: "vbcdev",
            }
        );
        profileUrl = result.secure_url;
        publicId = result.public_id;
    }
    console.log(profileUrl, publicId);

    const token = req.cookies["token"];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Decode Token
        const decodedUser = verifyJWT(token);
        if (!decodedUser || typeof decodedUser !== "object") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: decodedUser.email,
            },
        });
        if (!user) {
            // Send Not Found
            return res.status(404).json({ message: "User Not Found" });
        }
        // if (profilePicture) {
        //     user.profilePicture = profileUrl;
        //     // if (user.publicId.includes("uploads")) {
        //     //     cloudinary.uploader.destroy(user?.publicId, (error) => {
        //     //         if (error) {
        //     //             console.log(error);
        //     //         } else {
        //     //             console.log("Photo Deleted Successfully");
        //     //         }
        //     //     });
        //     // }
        //     user.publicId = profilePublicId;
        // }

        // const passwordMatch = await compare(password, user.password);
        // if (!passwordMatch) {
        //     // Send Unauthorized
        //     res.status(401).json({ message: "Incorrect Password" });
        // }

        // Check if User Exist
        const updatedUser = await prisma.user.update({
            where: {
                email: decodedUser.email,
            },
            data: {
                userName: userName,
                email: email,
                phoneno: phoneno,
                password: user.password,
                profilePicture: profileUrl,
                publicId: publicId,
            },
        });

        res.clearCookie("token");
        const newToken = generateJWT({
            email: updatedUser.email,
            userName: updatedUser.userName,
        });
        res.cookie("token", newToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.status(200).json({ message: "user updated" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
