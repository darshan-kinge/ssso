import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshTokenHash: { type: String, required: true },
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
