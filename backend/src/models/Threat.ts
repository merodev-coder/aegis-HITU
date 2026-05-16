import mongoose, { Schema, Document } from "mongoose";

export type ThreatSource = "LOG" | "CODE" | "EMAIL" | "CHAT";
export type ReviewStatus = "PENDING" | "CONFIRMED" | "FALSE_POSITIVE";

export interface IThreat extends Document {
  source: ThreatSource;
  sourceTitle: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  reviewStatus: ReviewStatus;
  rawSnippet?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ThreatSchema: Schema = new Schema(
  {
    source: {
      type: String,
      enum: ["LOG", "CODE", "EMAIL", "CHAT"],
      required: true,
    },
    sourceTitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      required: true,
    },
    reviewStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "FALSE_POSITIVE"],
      default: "PENDING",
    },
    rawSnippet: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast pending queries
ThreatSchema.index({ reviewStatus: 1, source: 1 });

export default mongoose.model<IThreat>("Threat", ThreatSchema);
