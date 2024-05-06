import bcrypt from "bcrypt";
import { Document, Schema, Types, model } from "mongoose";

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
    },
    profilePicture: {
        type: String,
        contentType: String,
    },
    publicId: {
        type: String,
    },
});

userSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified("password")) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        user.password = hashedPassword;
        next();
    } catch (error) {
        console.log(error);
    }
});

export const User = model("User", userSchema);

const otpSchema = new Schema({
    otp: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600,
    },
});

export const OTP = model("OTP", otpSchema);

const dataSchema = new Schema({
    userName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },
    profilePicture: {
        type: String,
        contentType: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600,
    },
});

export const UserData = model("UserData", dataSchema);
