import jwt from "jsonwebtoken";
import { User, OTP, UserData } from "../models/models.js";
import path from "path";
import nodemailer from "nodemailer";
import ejs from "ejs";
import bcrypt from "bcrypt";
import otpGenerator from "otp-generator";
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
        const { email, userName, password } = req.body;

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

        await res.cookie("token", token);

        // Clear userDataId & email from cookies

        // await UserData.deleteOne({ _id: userDataId });
        res.status(200).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// export const sendVerificationMail = async (req, res) => {
//     const __dirname = path.resolve();

//     const { email, userName, password } = req.body;
//     // const profilePicture = req.file?.path;

//     const user = await User.findOne({
//         $or: [{ email: email }, { userName: userName }],
//     });
//     // Check for unique Email
//     if (user?.email === email) {
//         return res.status(400).json({ message: "Email should be unique" });
//     }
//     // Check for unique userName
//     if (user?.userName === userName) {
//         return res.status(400).json({ message: "Username should be unique" });
//     }

//     // Generate OTP
//     const otp = otpGenerator.generate(6, {
//         lowerCaseAlphabets: false,
//         upperCaseAlphabets: false,
//         specialChars: false,
//     });
//     // console.log("OTP generated: " + otp);

//     // Render EJS Template
//     const templatePath = path.resolve(__dirname, "./views/mailFormat.ejs");
//     const htmlContent = await ejs.renderFile(templatePath, { otp });

//     // Send Email
//     const mailOptions = {
//         from: String(process.env.USER),
//         to: email,
//         subject: "Email Verification",
//         html: htmlContent,
//     };

//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         host: String(process.env.SMTP_HOST),
//         port: Number(process.env.SMTP_PORT),
//         secure: true,
//         auth: {
//             user: process.env.USER,
//             pass: process.env.PASS,
//         },
//     });

//     try {
//         await transporter.sendMail(mailOptions);

//         // Hash OTP and save it in the database
//         const salt = await bcrypt.genSalt(10);
//         const hashedOtp = await bcrypt.hash(otp, salt);

//         const otpDocument = await OTP.create({
//             otp: hashedOtp,
//             email: email,
//         });

//         // Set the Registration Data in Token
//         const userData = {
//             email: email,
//             userName: userName,
//             password: password,
//             // profilePicture: profilePicture,
//         };
//         const UserDataDocument = await UserData.create(userData);

//         // Set the User Data Id in the Cookies
//         res.cookie("userDataId", UserDataDocument._id, {
//             // httpOnly: true,
//             // secure: true,
//             // sameSite: "none",
//         });
//         // Set the OTP ID in the cookies
//         res.cookie("otpId", otpDocument._id);
//         res.status(200).json({ message: "OTP Sent Successfully" });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };

// // POST: /user/verifyOtp
// export const verifyOtp = async (req, res) => {
//     const { userOtp } = req.body;
//     const { otpId } = req.cookies;

//     // Verify OTP
//     try {
//         // Find the OTP document in the database by its ID
//         const otp = await OTP.findById(otpId);

//         // Check if the OTP document exists
//         if (!otp) {
//             return res.status(404).json({ message: "OTP not found" });
//         }

//         // Compare the user-provided OTP with the OTP from the database
//         const isVerified = await bcrypt.compare(userOtp, otp.otp);

//         if (!isVerified) {
//             return res.status(401).json({ message: "Incorrect OTP" });
//         }

//         // Set Email in the cookies
//         res.cookie("email", otp.email, {
//             // httpOnly: true,
//             // secure: true,
//             // sameSite: "none",
//         });
//         // Clear Cookie and delete the OTP from the database
//         res.clearCookie("otpId");
//         await OTP.deleteOne({ _id: otpId });

//         return res.sendStatus(200);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

// POST : /user/sendMail
// export const sendMail = async (req, res) => {
//     const { email } = req.body;

//     const user = await User.findOne({ email });

//     if (!user) {
//         return res.status(400).json({ message: "Email doesn't exist" });
//     }

// Generate OTP
//     const otp = otpGenerator.generate(6, {
//         lowerCaseAlphabets: false,
//         upperCaseAlphabets: false,
//         specialChars: false,
//     });

//     // Render EJS Template
//     const templatePath = path.resolve(__dirname, "../views/mailFormat.ejs");
//     const htmlContent = await ejs.renderFile(templatePath, { otp });

//     // Send Email
//     const mailOptions = {
//         from: String(process.env.USER),
//         to: email,
//         subject: "OTP Verification",
//         html: htmlContent,
//     };

//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         host: String(process.env.SMTP_HOST),
//         port: Number(process.env.SMTP_PORT),
//         secure: true,
//         auth: {
//             user: process.env.USER,
//             pass: process.env.PASS,
//         },
//     });

//     try {
//         await transporter.sendMail(mailOptions);

//         // Hash OTP and save it in the database
//         const salt = await bcrypt.genSalt(10);
//         const hashedOtp = await bcrypt.hash(otp, salt);

//         const otpDocument = await OTP.create({
//             otp: hashedOtp,
//             email: email,
//         });

//         // Set the OTP ID in the cookies
//         res.cookie("otpId", otpDocument._id, {
//             // httpOnly: true,
//             // secure: true,
//             // sameSite: "none",
//         });
//         res.status(200).json({ message: "OTP Sent Successfully" });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };

export const loginUser = async (req, res) => {
    let { email, password } = req.body;

    // userNameOrEmail = userNameOrEmail.toLowerCase();

    try {
        const user = await User.findOne({
            email: email,
        });

        // Check if User Exist or not
        if (!user) {
            return res
                .status(401)
                .json({ message: "You need to Register First" });
        }

        // Comapre the Password using bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            res.status(501).json({ message: "Incorrect Password" });
            return;
        } else {
            // Set Token in Cookies if Password is correct
            const token = setToken(user);
            res.cookie("token", token);
            res.status(201).json({ message: "Login Successfully" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
