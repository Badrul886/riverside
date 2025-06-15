import { Router } from "express";
import { authRouter } from "./auth.route";
import { roomsRouter } from "./rooms.route";
import { recordingsRouter } from "./recordings.route";
import { filesRouter } from "./files.route";
import { usersRouter } from "./users.route";
import { analyticsRouter } from "./analytics.route";

export const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "Welcome to Riverside HTTP API",
    version: "v1",
  });
});

router.use("/auth", authRouter);
router.use("/rooms", roomsRouter);
router.use("/recordings", recordingsRouter);
router.use("/files", filesRouter);
router.use("/users", usersRouter);
router.use("/analytics", analyticsRouter);
