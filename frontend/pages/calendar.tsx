"use client";
import { useXP } from "@/context/XPContext";
import { useState } from "react";
import CalendarPage from "../components/CalendarPage/Calendar/CalendarPage";
import XPBar from "@/components/XPBar";
import GamesModal from "@/components/Games/GamesModal";

export default function Calendar() {
  const { xp, streak } = useXP();
  const [showGames, setShowGames] = useState(false);
  const level = Math.floor(xp / 100); // Changed from 1000 to 100 to match XPBar

  return (
    <div>
      <XPBar xp={xp} streak={streak} onShowGames={() => setShowGames(true)} />
      <CalendarPage />
      
      {/* Games Modal - rendered at page level */}
      {showGames && (
        <GamesModal
          isVisible={showGames}
          onClose={() => setShowGames(false)}
          userLevel={level}
          userXP={xp}
        />
      )}
    </div>
  );
}