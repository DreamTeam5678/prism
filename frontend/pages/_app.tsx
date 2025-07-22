import "../components/CalendarPage/Upcoming/Upcoming.css";
import "../styles/globals.css";
import "../components/CalendarPage/Calendar/CalendarPage.css";
import "../components/NavBar/NavBar.css";
import "../components/CalendarPage/Optimize/Optimize.module.css";
import "../components/TasksPage/TaskList.css";
import "../components/FlowSpace/YoutubePlayer.css";
import "../components/MoodSelector/MoodModal.css";
import "../components/FlowSpace/BackgroundPicker.css";

import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { XPProvider } from "@/context/XPContext"; // ✅ Import your shared XP context

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <XPProvider> {/* ✅ Provide XP and task state to all pages */}
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </XPProvider>
  );
}