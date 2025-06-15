import { Router } from "express";

const roomsRouter = Router();

roomsRouter.post("/", (req, res) => {});

roomsRouter.post("/{roomId}/join", (req, res) => {});

roomsRouter.get("/{roomId}", (req, res) => {});

roomsRouter.patch("/{roomId}", (req, res) => {});

roomsRouter.post("/{roomId}/recordings/start", (req, res) => {});
roomsRouter.post("/{roomId}/recordings/{recordingId}/stop", (req, res) => {});
roomsRouter.post("/{roomId}/stream/start", (req, res) => {});

export { roomsRouter };
