import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const rateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 1 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false }
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDocument = InferSchemaType<typeof rateLimitSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RateLimit =
  (mongoose.models.RateLimit as Model<RateLimitDocument>) ??
  mongoose.model<RateLimitDocument>("RateLimit", rateLimitSchema);
