import jwt, { decode } from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

// since we are not using .post, .get etc. methods from express, we can use the generic Request and Response types

// export const adminMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const header = req.headers["authorization"];
//   const token = header?.split(" ")[1];

//   if (!token) {
//     res.status(403).json({ message: "Unauthorized" });
//     return;
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as {
//       role: string;
//       userId: string;
//     };
//     if (decoded.role !== "Admin") {
//       res.status(403).json({ message: "Unauthorized" });
//       return;
//     }
//     req.userId = decoded.userId;
//     next();
//   } catch (e) {
//     res.status(401).json({ message: "Unauthorized" });
//     return;
//   }
// };
// export const userMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const header = req.headers["authorization"];
//   const token = header?.split(" ")[1];

//   if (!token) {
//     res.status(403).json({ message: "Unauthorized" });
//     return;
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as {
//       role: string;
//       userId: string;
//     };
//     req.userId = decoded.userId;
//     next();
//   } catch (e) {
//     res.status(401).json({ message: "Unauthorized" });
//     return;
//   }
// };

export const authMiddleware = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => {
  const header = req.headers["authorization"];
  const token = header?.split(" ")[1];

  if (!token) {
    res.status(403).json({ message: "Access denied. No token found." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      role: string;
      userId: string;
    };
    // if (decoded.role !== "User") {
    //   res.status(403).json({ message: "Forbidden. Not a user." });
    //   return;
    // }
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (e) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
