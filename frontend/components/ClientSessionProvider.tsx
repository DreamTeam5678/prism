"use client";

import { SessionProvider } from "next-auth/react";

export function ClientSessionProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SessionProvider>{children}</SessionProvider>;
}

export default ClientSessionProvider;