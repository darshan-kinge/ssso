import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const endUserSchema = new Schema(
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
    passwordHash: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    externalId: { type: String, default: null },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

endUserSchema.index({ workspaceId: 1, email: 1 }, { unique: true });

export type EndUserDocument = InferSchemaType<typeof endUserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type EndUserModel = Model<EndUserDocument>;

export const EndUser: EndUserModel =
  (mongoose.models.EndUser as EndUserModel) ??
  mongoose.model<EndUserDocument>("EndUser", endUserSchema);
