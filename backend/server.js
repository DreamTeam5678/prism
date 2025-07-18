import calendarRoutes from "./routes/calendar.js";
import express from "express";
const cors = (await import("cors")).default;
import moodRoutes from "./routes/mood.js";

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

app.use("/api/mood", moodRoutes);
app.use("/api/calendar", calendarRoutes);

app.get("/", (req, res) => {
  res.send("Prism Backend is Running");
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});