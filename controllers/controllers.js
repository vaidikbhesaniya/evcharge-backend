import jwt from "jsonwebtoken";
import { User } from "../models/models.js";
const setToken = (user) => {
    return jwt.sign(
        {
            email: user.email,
            userName: user.userName,
        },
        String(process.env.SECRET_KEY),
        {
            expiresIn: "7d",
        }
    );
};

export const getToken = (token) => {
    if (!token) return null;
    return jwt.verify(token, String(process.env.SECRET_KEY));
};

export const registerUser = async (req, res) => {
    try {
        // Get userData from Cookies
        // const { userDataId } = req.cookies;

        // const userData = await UserData.findById({
        //     _id: userDataId,
        // });

        // if (!userData) {
        //     return res.status(401).json({ message: "User Data Expired" });
        // }

        // Destructure the Decoded User
        let { email, userName, password } = req.body;

        // Check if User Exist

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: "User Already Exist" });
        }

        // Upload Profile Picture if exist
        // let profileUrl = "";
        // let publicId = "";

        // if (profilePicture) {
        //     const result: UploadApiResponse = await cloudinary.uploader.upload(
        //         profilePicture,
        //         {
        //             folder: "uploads",
        //         }
        //     );
        //     profileUrl = result.secure_url;
        //     publicId = result.public_id;
        // }

        // Create User
        await User.create({
            email: email,
            userName: userName,
            password: password,
        });

        // Encode the Token and Set it in the Cookies
        const token = setToken({
            email: email,
            userName: userName,
        });

        res.cookie("token", token);
        console.log(token);
        // Clear userDataId & email from cookies

        // await UserData.deleteOne({ _id: userDataId });
        res.status(200).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
