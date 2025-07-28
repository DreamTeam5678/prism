import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  date: string;
  completedCount: number;
}

export default function WeeklySummaryChart() {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    fetch("/api/weekly-summary")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to fetch weekly summary:", err));
  }, []);

  // ✅ Prevent rendering if data isn't a valid array
  if (!Array.isArray(data)) {
    return (
      <div style={{ marginTop: "2rem", padding: "1rem", background: "#f8f8f8", borderRadius: "12px" }}>
        <p>Loading chart...</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "2rem", padding: "1rem", background: "#f8f8f8", borderRadius: "12px" }}>
      <h3 style={{ marginBottom: "1rem" }}>📊 Weekly Task Completion</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="completedCount" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}