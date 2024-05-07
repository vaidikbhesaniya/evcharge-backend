import { compare, genSalt, hash } from "bcrypt";
import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../db/index.js";
import { generateJWT } from "../lib/auth.js";

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
    res.cookie("token", token);

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
    res.cookie("token", token);

    res.status(201).json({ message: "Login Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
