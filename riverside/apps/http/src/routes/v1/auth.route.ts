import { Router } from "express";
import { RegistrationSchema } from "../../types";
import client from "@repo/db/client"; // Assuming you have a database client set up
import { hash, compare } from "../../scrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  console.log("=== REGISTER ROUTE START ===");
  console.log("Request body:", req.body);
  const parsedData = RegistrationSchema.safeParse(req.body);
  console.log("Parsed data:", parsedData);

  if (!parsedData.success) {
    console.log("Validation failed:", parsedData.error);
    res.status(400).json({
      message: "validation failed",
    });
    return;
  }

  const { name, email, password, confirmPassword, role } = parsedData.data;
  console.log("Extracted fields:", { name, email, role });
  // Logic to create a new user
  if (!name || !email || !password || !confirmPassword) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  // check if the email already exists
  const existingUser = await client.user.findUnique({
    where: {
      email,
    },
  });
  if (existingUser) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: "Password and confirm password do not match" });
    return;
  }
  // Here you would typically hash the password and save the user to a database
  console.log("About to hash password...");
  const hashedPassword = await hash(password);
  console.log("Password hashed successfully");
  try {
    console.log("About to create user in database...");
    const user = await client.user.create({
      data: {
        name,
        email,
        // Map role to expected enum values
        role: role === "admin" ? "ADMIN" : "USER",
        passwordHash: hashedPassword,
      },
    });
    console.log("User created successfully:", user.id);


    console.log("JWT_SECRET exists:", !!JWT_SECRET);
    

    const jwtSecret = JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: "JWT secret not configured" });
      return;
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: "1h",
    });
    //create refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          SubscriptionType: "free",
          avatarUrl: null,
          createdAt: "timestamp",
          isEmailVerified: false,
        },
        token: token,
        refreshToken: refreshToken,
      },
    });
    return;
  } catch (error) {
    console.error("=== ERROR DETAILS ===");
    console.error("Error creating user:", error);
    if (typeof error === "object" && error !== null) {
      console.error("Error message:", (error as any).message);
      console.error("Error code:", (error as any).code);
      console.error("Stack trace:", (error as any).stack);
    }
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

authRouter.post("/login", (req, res) => {});

authRouter.post("/forgot-password", (req, res) => {});

authRouter.post("/verify-email", (req, res) => {});

authRouter.post("/oauth/{provider}", (req, res) => {});

export { authRouter };
