"use client";
import { signIn, signOut,useSession } from "next-auth/react";


export default function Home() {
  const { data: session } = useSession();

  return (
    <div> 
      <h1>Prism Calendar</h1>
      {!session ? (
        <button onClick={() => signIn("google")}>Sign in with Google</button>
      ) : (
        <>  
          <p>Welcome, {session.user?.name}!</p>
          <button onClick={() => signOut()}>Sign out</button>
         
        </>
        )}
    </div>
  );
}