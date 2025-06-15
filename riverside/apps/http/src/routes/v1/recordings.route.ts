import { Router } from "express";

const recordingsRouter = Router();

recordingsRouter.post("/{recordingId}/upload", (req, res) => {});
recordingsRouter.get("/{recordingId}", (req, res) => {});

export { recordingsRouter };
