import { compare, genSalt, hash } from "bcrypt";
import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../db/index.js";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../utils/cloudinary.js";
import { generateJWT, verifyJWT } from "../lib/auth.js";
// import station_data from "./data.js";

const registerSchema = z.object({
    email: z.string().email(),
    userName: z.string(),
    password: z
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/),
});

const addReviewSchema = z.object({
    stationId: z.string(),
    review: z.string(),
});

export const registerUser = async (req: Request, res: Response) => {
    // Validate Request
    const validateData = registerSchema.parse(req.body);
    const { email, userName, password } = validateData;

    if (!email || !userName || !password) {
        // Send Bad Request
        return res.status(400).json({ message: "Invalid Credentials" });
    }

    try {
        // Check if User Exist
        const userExists = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (userExists) {
            // Send Conflict
            return res.status(409).json({ message: "User Already Exist" });
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
                .json({ message: "User Creation Failed Unexpectedly" });
        }

        // Set Token in the Cookies
        const token = generateJWT({ email, userName });
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        // Send Created
        res.status(201).json({ message: "User Created Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    // Validate Request
    const validateData = loginSchema.parse(req.body);
    const { email, password } = validateData;

    if (!email || !password) {
        // Send Bad Request
        return res.status(400).json({ message: "Invalid Credentials" });
    }

    try {
        // Check if User Exist
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            // Send Not Found
            return res.status(404).json({ message: "User Not Found" });
        }

        const passwordMatch = await compare(password, user.password);
        if (!passwordMatch) {
            // Send Unauthorized
            res.status(401).json({ message: "Incorrect Password" });
        }

        // Set Token in the Cookies
        const token = generateJWT({ email, userName: user.userName });
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.status(201).json({ message: "Login Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logoutUser = async (req: Request, res: Response) => {
    res.clearCookie("token");
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

export const removeBookmark = async (req: Request, res: Response) => {
    const { stationId } = req.body;
    if (!stationId || typeof stationId !== "number") {
        // Send Bad Request
        return res.status(400).json({ message: "Invalid Station" });
    }

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

        // Remove Bookmark
        const removeBookmarkTransaction = await prisma.$transaction(
            async (prisma) => {
                const bookmark = await prisma.bookmark.findFirst({
                    where: {
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
                            disconnect: {
                                id: bookmark?.id,
                            },
                        },
                    },
                });
                await prisma.bookmark.delete({
                    where: {
                        id: bookmark?.id,
                    },
                });

                return bookmark?.id;
            }
        );

        if (typeof removeBookmarkTransaction !== "number") {
            return res
                .status(500)
                .json({ message: "Failed to remove bookmark" });
        }

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

        // Send OK
        res.status(200).json({ bookmarks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addReview = async (req: Request, res: Response) => {
    const { stationId, review } = req.body;

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

        // Add Review
        const addReviewTransaction = await prisma.$transaction(
            async (prisma) => {
                // Create Review
                const reviewData = await prisma.review.create({
                    data: {
                        userId: user.id,
                        stationId,
                        review,
                    },
                });
                // Update Station
                await prisma.station.update({
                    where: {
                        id: stationId,
                    },
                    data: {
                        reviews: {
                            connect: {
                                id: reviewData.id,
                            },
                        },
                    },
                });
                // Update User
                await prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        reviews: {
                            connect: {
                                id: reviewData.id,
                            },
                        },
                    },
                });

                return reviewData.id;
            }
        );

        if (typeof addReviewTransaction !== "number") {
            return res.status(500).json({ message: "Failed to add review" });
        }
        res.status(200).json({ message: "Review Added" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const removeReview = async (req: Request, res: Response) => {
    const { stationId, reviewId } = req.body;
    if (!stationId || typeof stationId !== "number") {
        // Send Bad Request
        return res.status(400).json({ message: "Invalid Station" });
    }

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

        // Remove Review
        const removeReviewTransaction = await prisma.$transaction(
            async (prisma) => {
                // Delete Review
                await prisma.review.delete({
                    where: {
                        id: reviewId,
                    },
                });
                // Update Station
                await prisma.station.update({
                    where: {
                        id: stationId,
                    },
                    data: {
                        reviews: {
                            disconnect: {
                                id: reviewId,
                            },
                        },
                    },
                });
                // Update User
                await prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        reviews: {
                            disconnect: {
                                id: reviewId,
                            },
                        },
                    },
                });

                return reviewId;
            }
        );

        if (typeof removeReviewTransaction !== "number") {
            return res.status(500).json({ message: "Failed to remove review" });
        }
        // Send OK
        res.status(200).json({ message: "Review Removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// export const getStations = async (req: Request, res: Response) => {
//     try {
//         // Fetch gas station data from the database
//         const stations = await prisma.station.findMany();

//         // Send the retrieved data as JSON response
//         res.json(stations);
//     } catch (error) {
//         // If an error occurs, send an error response
//         console.error("Error fetching gas stations:", error);
//         res.status(500).json({
//             error: "An error occurred while fetching gas stations.",
//         });
//     }
// };

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
