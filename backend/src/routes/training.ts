import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Threat from "../models/Threat";

const router = Router();

router.get("/pending", async (_req: Request, res: Response) => {
  try {
    const threats = await Threat.find({ reviewStatus: "PENDING" })
      .sort({ createdAt: -1 })
      .lean();

    const grouped: Record<string, any[]> = { LOG: [], CODE: [], EMAIL: [], CHAT: [] };
    for (const t of threats) {
      const key = t.source as string;
      if (grouped[key]) {
        grouped[key].push(t);
      }
    }

    res.json({ threats: grouped });
  } catch (err: any) {
    console.error("[Training Pending Error]", err.message);
    res.status(500).json({ error: "Failed to fetch pending threats." });
  }
});

router.post("/review", async (req: Request, res: Response): Promise<void> => {
  try {
    const { threatId, newStatus } = req.body;

    if (!threatId || typeof threatId !== "string" || !mongoose.Types.ObjectId.isValid(threatId)) {
      res.status(400).json({ error: "Invalid threat ID format." });
      return;
    }

    if (!newStatus || !["CONFIRMED", "FALSE_POSITIVE"].includes(newStatus)) {
      res.status(400).json({ error: "newStatus must be 'CONFIRMED' or 'FALSE_POSITIVE'." });
      return;
    }

    const updated = await Threat.findByIdAndUpdate(
      new mongoose.Types.ObjectId(threatId),
      { 
        reviewStatus: newStatus,
        reviewedBy: "public-user",
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ error: "Threat not found." });
      return;
    }

    res.json({
      message: newStatus === "CONFIRMED"
        ? `Threat confirmed. Model training data updated.`
        : `Marked as false positive. Model will learn to ignore similar patterns.`,
      threat: updated,
    });
  } catch (err: any) {
    console.error("[Training Review Error]", err.message);
    res.status(500).json({ error: "Failed to update threat status." });
  }
});

export default router;
