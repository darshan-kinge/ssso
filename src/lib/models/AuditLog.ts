import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const auditLogSchema = new Schema(
  {
    action: { type: String, required: true, index: true },
    plane: {
      type: String,
      enum: ["platform", "tenant"],
      default: "platform",
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    email: { type: String, lowercase: true, trim: true },
    ip: { type: String, default: "unknown" },
    success: { type: Boolean, required: true },
    meta: { type: Schema.Types.Mixed },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
auditLogSchema.index({ workspaceId: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLog =
  (mongoose.models.AuditLog as Model<AuditLogDocument>) ??
  mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema);
