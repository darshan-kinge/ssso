import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const verificationTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    endUserId: {
      type: Schema.Types.ObjectId,
      ref: "EndUser",
      default: null,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    oauthReturn: { type: String, default: null },

  },
  { timestamps: true }
);

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type VerificationTokenDocument = InferSchemaType<
  typeof verificationTokenSchema
> & { _id: mongoose.Types.ObjectId };

export const VerificationToken =
  (mongoose.models.VerificationToken as Model<VerificationTokenDocument>) ??
  mongoose.model<VerificationTokenDocument>(
    "VerificationToken",
    verificationTokenSchema
  );
