import { Router, Request, Response } from "express";
import Alert from "../models/Alert";
import { requireRole } from "../middlewares/auth";

const router = Router();

router.get("/", requireRole("admin", "analyst"), async (_req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
    
    
    const mappedAlerts = alerts.map((alert) => ({
      id: alert._id.toString(),
      severity: alert.severity,
      type: alert.attackType,
      sourceIp: alert.sourceIp,
      targetUrl: alert.targetUrl,
      timestamp: alert.timestamp.toISOString().replace("T", " ").substring(0, 19),
    }));

    res.status(200).json(mappedAlerts);
  } catch (error: any) {
    console.error("[Get Alerts Error]", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

export default router;
