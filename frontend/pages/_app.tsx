// pages/_app.tsx

import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
// pages/_app.tsx
import "../components/Welcome/Welcome.css"

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}