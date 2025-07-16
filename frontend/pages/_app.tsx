// pages/_app.tsx
import "../components/CalendarPage/Calendar/CalendarPage.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
// pages/_app.tsx
import "../components/Welcome/Welcome.css"
import "../components/CalendarPage/Upcoming/Upcoming.css";
import "../styles/globals.css";
import "../components/CalendarPage/Calendar/CalendarPage.css";
import "../components/CalendarPage/Upcoming/Upcoming.css";
import '../styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}