import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const appSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    clientId: { type: String, required: true, unique: true, index: true },
    clientSecretHash: { type: String, required: true },
    redirectUrls: { type: [String], default: [] },
    /** public = PKCE required; confidential = may use client_secret */
    clientType: {
      type: String,
      enum: ["public", "confidential"],
      default: "public",
    },
  },
  { timestamps: true }
);

export type AppDocument = InferSchemaType<typeof appSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type AppModel = Model<AppDocument>;

export const App: AppModel =
  (mongoose.models.App as AppModel) ??
  mongoose.model<AppDocument>("App", appSchema);
