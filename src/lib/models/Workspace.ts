import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const workspaceSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    settings: {
      logoUrl: { type: String, default: null },
      primaryColor: { type: String, default: null },
      themeType: {
        type: String,
        enum: ["neo-brutalist", "simple-bg", "custom-colors"],
        default: "neo-brutalist",
      },
      backgroundImageUrl: { type: String, default: null },
      backgroundColor: { type: String, default: null },
      customCardBg: { type: String, default: null },
      customCardBorder: { type: String, default: null },
      customCardText: { type: String, default: null },
      customButtonBg: { type: String, default: null },
      customButtonText: { type: String, default: null },
      loginMode: {
        type: String,
        enum: ["open", "sso-only"],
        default: "open",
      },
    },
  },
  { timestamps: true }
);

export type WorkspaceDocument = InferSchemaType<typeof workspaceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type WorkspaceModel = Model<WorkspaceDocument>;

export const Workspace: WorkspaceModel =
  (mongoose.models.Workspace as WorkspaceModel) ??
  mongoose.model<WorkspaceDocument>("Workspace", workspaceSchema);
