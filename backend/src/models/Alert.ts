import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  severity: "critical" | "high" | "medium" | "low";
  attackType: string;
  sourceIp: string;
  targetUrl: string;
  userAgent: string;
  statusCode?: number;
  rawLog?: string;
  timestamp: Date;
}

const AlertSchema: Schema = new Schema(
  {
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      required: true,
    },
    attackType: {
      type: String,
      required: true,
    },
    sourceIp: {
      type: String,
      required: true,
    },
    targetUrl: {
      type: String,
      default: "Unknown",
    },
    userAgent: {
      type: String,
      default: "",
    },
    statusCode: {
      type: Number,
    },
    rawLog: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, 
  }
);

export default mongoose.model<IAlert>("Alert", AlertSchema);
