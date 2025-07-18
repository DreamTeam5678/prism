// backend/routes/calendar.js
import express from "express";
const router = express.Router();

router.get("/list", async (req, res) => {
  try {
    console.log("✅ /api/calendar/list route hit"); // Add this log

    const dummyEvents = [
      {
        id: 1,
        summary: "Sample Event",
        start: { dateTime: new Date().toISOString() },
        end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
        description: "This is a test event"
      },
    ];

    res.json(dummyEvents);
  } catch (error) {
    console.error("❌ Calendar error:", error); // Log the actual error
    res.status(500).json({ message: "Server error" });
  }
});

export default router;