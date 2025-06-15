import { Router } from "express";

const filesRouter = Router();

filesRouter.post("/upload", (req, res) => {});
filesRouter.get("/{fileId}/download", (req, res) => {});

export { filesRouter };
