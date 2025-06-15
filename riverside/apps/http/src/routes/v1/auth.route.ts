import { Router } from "express";

const authRouter = Router();

authRouter.post("/register", (req, res) => {});

authRouter.post("/login", (req, res) => {});

authRouter.post("/forgot-password", (req, res) => {});

authRouter.post("/verify-email", (req, res) => {});

authRouter.post("/oauth/{provider}", (req, res) => {});

export { authRouter };
