import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const MEMBERSHIP_ROLES = [
  "owner",
  "admin",
  "developer",
  "viewer",
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

const membershipSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    platformUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: MEMBERSHIP_ROLES,
      required: true,
    },
  },
  { timestamps: true }
);

membershipSchema.index(
  { workspaceId: 1, platformUserId: 1 },
  { unique: true }
);

export type MembershipDocument = InferSchemaType<typeof membershipSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type MembershipModel = Model<MembershipDocument>;

export const Membership: MembershipModel =
  (mongoose.models.Membership as MembershipModel) ??
  mongoose.model<MembershipDocument>("Membership", membershipSchema);
