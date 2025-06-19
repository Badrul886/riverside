import { Router } from "express";
import { RegistrationSchema } from "../../types";
import client from "@repo/db/client"; // Assuming you have a database client set up
import { hash, compare } from "../../scrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  JWT_SECRET,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  cookieDomain,
} from "../../config";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import crypto from "crypto";
import { authMiddleware } from "../../middleware/auth.middleware";
// import * as config from "../../config";


const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  // console.log("=== REGISTER ROUTE START ===");
  // console.log("Request body:", req.body);
  const parsedData = RegistrationSchema.safeParse(req.body);
  // console.log("Parsed data:", parsedData);

  if (!parsedData.success) {
    // console.log("Validation failed:", parsedData.error);
    res.status(400).json({
      message: "validation failed",
    });
    return;
  }

  const { name, email, password, confirmPassword, role } = parsedData.data;
  // console.log("Extracted fields:", { name, email, role });
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
    res
      .status(400)
      .json({ error: "Password and confirm password do not match" });
    return;
  }
  // Here you would typically hash the password and save the user to a database
  // console.log("About to hash password...");
  const hashedPassword = await hash(password);
  // console.log("Password hashed successfully");
  try {
    // console.log("About to create user in database...");
    const user = await client.user.create({
      data: {
        name,
        email,
        // Map role to expected enum values
        role: role === "admin" ? "ADMIN" : "USER",
        passwordHash: hashedPassword,
      },
    });
    // console.log("User created successfully:", user.id);

    // console.log("JWT_SECRET exists:", !!JWT_SECRET);

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
    // console.error("=== ERROR DETAILS ===");
    // console.error("Error creating user:", error);
    if (typeof error === "object" && error !== null) {
      // console.error("Error message:", (error as any).message);
      // console.error("Error code:", (error as any).code);
      // console.error("Stack trace:", (error as any).stack);
    }
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  // Validate input
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    // Find user
    const user = await client.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Verify password
    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Check JWT secrets
    if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
      res.status(500).json({ error: "JWT secrets not configured" });
      return;
    }

    // Generate access token (short-lived)
    const accessToken = jwt.sign({ userId: user.id }, JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });

    // Generate refresh token (long-lived)
    const refreshTokenExpiry = rememberMe ? "15d" : "7d";
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        tokenId: uuidv4(), // Unique ID for each token
      },
      JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiry }
    );

    // Calculate expiration date
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(
      refreshTokenExpiresAt.getDate() + (rememberMe ? 15 : 7)
    );

    // Generate device fingerprint
    const deviceFingerprint = createDeviceFingerprint(req);

    // Store refresh token in session table
    await client.session.create({
      data: {
        refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
        userAgent: req.headers["user-agent"] || "",
        ipAddress: req.ip || req.socket.remoteAddress || "",
        deviceFingerprint,
        tokenFamily: uuidv4(), // Initial token family ID
      },
    });

    // Update last login
    await client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Set HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: (rememberMe ? 7 : 1) * 24 * 60 * 60 * 1000,
      domain: cookieDomain || "localhost", // Use the configured cookie domain
      path: "/",
    });

    // Return response without password hash
    const { passwordHash, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: safeUser,
        token: accessToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to create device fingerprint

function createDeviceFingerprint(req: ExpressRequest): string {
  const components = [
    req.headers["user-agent"],
    req.headers["accept-language"],
    req.headers["sec-ch-ua-platform"],
    req.ip,
  ];
  return crypto.createHash("sha256").update(components.join("|")).digest("hex");
}

authRouter.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  // Clear cookie
  res.clearCookie("refreshToken", {
    domain: cookieDomain || "localhost", // Use the configured cookie domain
    path: "/",
  });

  if (refreshToken) {
    try {
      // Revoke token in database
      await client.session.updateMany({
        where: { refreshToken },
        data: { revoked: true },
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Error while logging out" });
      return;
    }
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

authRouter.post("/forgot-password", (req, res) => {});

authRouter.post("/verify-email", (req, res) => {});

authRouter.post("/oauth/{provider}", (req, res) => {});

authRouter.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: "Refresh token missing" });
    return;
  }

  // Get session from database
  const session = await client.session.findUnique({
    where: { refreshToken },
  });

  if (!session) {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
      tokenId: string;
    };

    // Validate session
    if (
      !session ||
      session.revoked ||
      session.expiresAt < new Date() ||
      session.userId !== decoded.userId
    ) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    // Validate device
    const currentDeviceFingerprint = createDeviceFingerprint(req);
    if (session.deviceFingerprint !== currentDeviceFingerprint) {
      await client.session.update({
        where: { id: session.id },
        data: { revoked: true },
      });
      res.status(401).json({ error: "Device mismatch" });
      return;
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    // Generate new refresh token (rotation)
    const newRefreshToken = jwt.sign(
      {
        userId: decoded.userId,
        tokenId: uuidv4(), // New unique ID
      },
      JWT_REFRESH_SECRET,
      { expiresIn: "1d" }
    );

    // Update session (token rotation)
    await client.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        tokenFamily: session.tokenFamily, // Keep same token family
      },
    });

    // Set new HTTP-only cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
      domain: cookieDomain || "localhost", // Use the configured cookie domain
      path: "/",
    });

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh error:", error);

    // Handle token reuse
    if (error instanceof jwt.TokenExpiredError) {
      // Find and revoke all tokens in the same family
      const decoded = jwt.decode(refreshToken) as {
        userId: string;
        tokenId: string;
      };
      await client.session.updateMany({
        where: {
          userId: decoded.userId,
          tokenFamily: session.tokenFamily,
        },
        data: { revoked: true },
      });
    }

    res.status(401).json({ error: "Invalid refresh token" });
  }
});

authRouter.post(
  "/invalidate-all",
  authMiddleware,
  async (req, res) => {
    await client.session.updateMany({
      where: {
        userId: req.user.id,
        revoked: false,
      },
      data: { revoked: true },
    });
    res.json({ success: true });
  }
);

authRouter.get("/sessions", authMiddleware, async (req, res) => {
  const sessions = await client.session.findMany({
    where: { userId: req.user.id },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
      revoked: true,
    },
  });
  res.json(sessions);
});

export { authRouter };
