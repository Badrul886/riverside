import z from "zod";

// export const HttpMethod = z.enum([
//   'GET',
//   'POST',
//   'PUT',
//   'PATCH',
//   'DELETE',
//   'HEAD',
//   'OPTIONS',
// ]);

export const RegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z
    .string()
    .min(6, "Confirm Password must be at least 6 characters long"),
  role: z.enum(["user", "admin"]).default("user").optional(),
});

export const LoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  rememberMe: z.boolean().optional().default(false),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  newPassword: z
    .string()
    .min(6, "New Password must be at least 6 characters long"),
  confirmPassword: z
    .string()
    .min(6, "Confirm Password must be at least 6 characters long"),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const OAuthSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  code: z.string().min(1, "Code is required"),
  redirectUri: z.string().url("Invalid redirect URI").optional(),
});

// export type RegistrationType = z.infer<typeof RegistrationSchema>;
// export type LoginType = z.infer<typeof LoginSchema>;
// export type ForgotPasswordType = z.infer<typeof ForgotPasswordSchema>;
// export type VerifyEmailType = z.infer<typeof VerifyEmailSchema>;
// export type OAuthType = z.infer<typeof OAuthSchema>;

// Room schema for creating or updating a room
export const CreateRoomSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .max(100, "Name must be at most 100 characters long"),

  description: z
    .string()
    .max(500, "Description must be at most 500 characters long")
    .optional(),

  maxParticipants: z
    .number()
    .max(100, "Maximum participants cannot exceed 100")
    .default(10)
    .optional(),

  isPrivate: z.boolean().default(false).optional(),

  recordingEnabled: z.boolean().default(true).optional(),

  settings: z
    .object({
      audioOnly: z.boolean().default(false),
      requireApproval: z.boolean().default(false),
      allowScreenShare: z.boolean().default(true),
      allowChat: z.boolean().default(true),
      autoRecord: z.boolean().default(false),
      muteOnJoin: z.boolean().default(false),
    })
    .default({}),
});

// export const joinRoomSchema = z
//   .object({
//     roomCode: z.string().optional(),
//     displayName: z.string().optional(),
//     isPrivate: z.boolean(), // this must be passed in to check the condition
//   })
//   .refine(
//     (data) => {
//       if (data.isPrivate) {
//         return !!data.roomCode && data.roomCode.trim().length > 0;
//       }
//       return true;
//     },
//     {
//       message: "roomCode is required when the room is private",
//       path: ["roomCode"],
//     }
//   );

export const joinRoomSchema = z.object({
  // If you already have isPrivate known from context (not from the client), and want to validate just roomCode and displayName, then use this schema instead and pass isPrivate separately
  roomCode: z.string().optional(),
  displayName: z.string().optional(),
});

export const validateJoinRoom = (input: any, isPrivate: boolean) => {
  const result = joinRoomSchema.safeParse(input);

  if (!result.success) return result;

  if (isPrivate && (!input.roomCode || input.roomCode.trim() === "")) {
    return {
      success: false,
      error: {
        issues: [
          {
            path: ["roomCode"],
            message: "roomCode is required when the room is private",
          },
        ],
      },
    };
  }

  return result;
};

export const UpdateRoomSettingsSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  maxParticipants: z.number().optional(),
  settings: z.object({
    audioOnly: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    allowScreenShare: z.boolean().optional(),
    allowChat: z.boolean().optional(),
  }),
  //.optional(),
});

export const StartRecordingSchema = z.object({
  recordingType: z.enum(["audio", "video", "screen"]),
  quality: z.enum(["low", "medium", "high", "ultra"]).optional(),
  includeAudio: z.boolean().default(true),
  includeVideo: z.boolean().default(true),
  includeScreen: z.boolean().default(false),
});

export const UploadFileSchema = z
  .object({
    type: z.enum(["avatar", "recording", "chat-attachment"]),
    roomId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // if type is chat-attachment, roomId must be present
      if (data.type === "chat-attachment" && !data.roomId) {
        return false;
      }
      return true;
    },
    {
      message: "roomId is required for chat-attachment type",
      path: ["roomId"],
    }
  );

export const UpdateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  avatarUrl: z.string().optional(),
  settings: z.object({
    notifications: z.boolean().optional(),
    autoJoinAudio: z.boolean().optional(),
    autoJoinVideo: z.boolean().optional(),
    theme: z.string().optional(),
  }),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters long"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password must match",
    path: ["confirmPassword"],
  });

//this is for Start Live Stream schema validation
const platformSchema = z
  .object({
    name: z.enum(["youtube", "twitch", "facebook", "custom"]),
    streamKey: z.string().min(1, "streamKey is required"),
    rtmpUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.name === "custom" && !data.rtmpUrl) {
        return false;
      }
      return true;
    },
    {
      message: 'rtmpUrl is required when platform name is "custom"',
      path: ["rtmpUrl"],
    }
  );

export const StartLiveStreamSchema = z.object({
  platforms: z
    .array(platformSchema)
    .min(1, "At least one platform is required"),
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  quality: z.enum(["720p", "1080p", "1440p", "4k"]),
});

// Extend Express Request to include userId and role
// This allows us to access req.userId and req.role in our middleware and routes
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: string;
      user: {
        id: string;
        email: string;
      };
    }
  }
}
