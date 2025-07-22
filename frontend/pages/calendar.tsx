"use client";
import { useXP } from "@/context/XPContext";
import CalendarPage from "../components/CalendarPage/Calendar/CalendarPage";
import XPBar from "@/components/XPBar";

export default function Calendar() {
  const { xp } = useXP();

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
        <XPBar xp={xp} />
      </div>
      <CalendarPage />
    </div>
  );
}