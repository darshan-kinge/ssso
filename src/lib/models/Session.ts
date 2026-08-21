import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const sessionSchema = new Schema(
  {
    sessionType: {
      type: String,
      enum: ["platform", "end_user"],
      default: "platform",
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    refreshTokenHash: { type: String, required: true },
    usedTokenHashes: { type: [String], default: [], index: true },
    device: { type: String, default: "unknown" },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

sessionSchema.index({ refreshTokenHash: 1 });

export type SessionDocument = InferSchemaType<typeof sessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type SessionModel = Model<SessionDocument>;

export const Session: SessionModel =
  (mongoose.models.Session as SessionModel) ??
  mongoose.model<SessionDocument>("Session", sessionSchema);
