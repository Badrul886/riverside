import { Router } from "express";

const usersRouter = Router();

usersRouter.get("/profile", (req, res) => {});

usersRouter.patch("/profile", (req, res) => {});

usersRouter.post("/change-password", (req, res) => {});

export { usersRouter };
