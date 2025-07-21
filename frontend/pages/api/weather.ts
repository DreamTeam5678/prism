// pages/api/weather.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon } = req.query;

  if (!lat || !lon) return res.status(400).json({ message: "Missing lat/lon" });

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Missing WEATHER_API_KEY in env");
    return res.status(500).json({ message: "Missing weather API key" });
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;
  console.log("📍 Requesting weather for:", lat, lon);
  console.log("🔐 API key present:", !!apiKey);

  try {
    const response = await fetch(url);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("❌ Failed to parse WeatherAPI response:", text);
      return res.status(500).json({ message: "WeatherAPI returned non-JSON" });
    }

    if (!response.ok) {
      console.error("🌩️ WeatherAPI error:", data);
      return res.status(response.status).json({ message: "Weather fetch failed", error: data });
    }

    if (!data.current || !data.current.condition) {
      console.warn("⚠️ Weather data missing condition:", data);
      return res.status(200).json({ condition: "Unknown", location: "Unknown" });
    }

    return res.status(200).json({ 
      location: data.location.name,
      region: data.location.region,
      country: data.location.country,
      condition: data.current.condition.text 
    });
  } catch (err) {
    console.error("❌ Weather fetch error:", err);
    return res.status(500).json({ message: "Failed to fetch weather", error: String(err) });
  }
}
