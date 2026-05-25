import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type UserModel = Model<UserDocument>;

export const User: UserModel =
  (mongoose.models.User as UserModel) ??
  mongoose.model<UserDocument>("User", userSchema);
