import { Router, Request, Response } from "express";
import Threat from "../models/Threat";

const router = Router();

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const totalThreats = await Threat.countDocuments();

    // Group by reviewStatus
    const statusAggregation = await Threat.aggregate([
      { $group: { _id: "$reviewStatus", count: { $sum: 1 } } }
    ]);
    
    const statusCounts = {
      PENDING: 0,
      CONFIRMED: 0,
      FALSE_POSITIVE: 0,
    };
    
    for (const stat of statusAggregation) {
      if (stat._id in statusCounts) {
        statusCounts[stat._id as keyof typeof statusCounts] = stat.count;
      }
    }

    // Group by source
    const sourceAggregation = await Threat.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]);

    const sourceDistribution = {
      LOG: 0,
      CODE: 0,
      EMAIL: 0,
      CHAT: 0,
    };

    for (const stat of sourceAggregation) {
      if (stat._id in sourceDistribution) {
        sourceDistribution[stat._id as keyof typeof sourceDistribution] = stat.count;
      }
    }

    // Recent activity (last 5 threats)
    const recentActivity = await Threat.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("sourceTitle source severity reviewStatus createdAt")
      .lean();

    res.json({
      totalThreats,
      statusCounts,
      sourceDistribution,
      recentActivity,
    });
  } catch (error: any) {
    console.error("[Overview Stats Error]", error.message);
    res.status(500).json({ error: "Failed to fetch overview stats." });
  }
});

export default router;
