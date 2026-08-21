import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { MEMBERSHIP_ROLES } from "./Membership";

const workspaceInviteSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: MEMBERSHIP_ROLES.filter((r) => r !== "owner"),
      required: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    invitedByPlatformUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

workspaceInviteSchema.index(
  { workspaceId: 1, email: 1 },
  { unique: true, partialFilterExpression: { acceptedAt: null } }
);

export type WorkspaceInviteDocument = InferSchemaType<
  typeof workspaceInviteSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const WorkspaceInvite =
  (mongoose.models.WorkspaceInvite as Model<WorkspaceInviteDocument>) ??
  mongoose.model<WorkspaceInviteDocument>(
    "WorkspaceInvite",
    workspaceInviteSchema
  );
