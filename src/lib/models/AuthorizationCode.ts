import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const authorizationCodeSchema = new Schema(
  {
    codeHash: { type: String, required: true, unique: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: { type: String, required: true, index: true },
    redirectUri: { type: String, required: true },
    /** PKCE S256 challenge (plain, not secret) */
    codeChallenge: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

authorizationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AuthorizationCodeDocument = InferSchemaType<
  typeof authorizationCodeSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export type AuthorizationCodeModel = Model<AuthorizationCodeDocument>;

export const AuthorizationCode: AuthorizationCodeModel =
  (mongoose.models.AuthorizationCode as AuthorizationCodeModel) ??
  mongoose.model<AuthorizationCodeDocument>(
    "AuthorizationCode",
    authorizationCodeSchema
  );
