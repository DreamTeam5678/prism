'use client';

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Welcome() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (status === "authenticated") {
        try {
          const res = await fetch('/api/profile');
          const data = await res.json();

          if (data.hasProfile) {
            router.push("/calendar");
          } else {
            router.push("/survey");
          }
        } catch (error) {
          console.error("Profile check failed:", error);
          router.push("/survey");
        }
      }
    };

    if (status === "authenticated") {
      checkProfileAndRedirect();
    }
  }, [status, router]);

  return (
    <div className="welcome-container">
      <h1 className="welcome-title">welcome to</h1>
      <div className="check-container">
        <img className="logo" src="./logo.png" alt="Prism Logo" />
        <div className="checkbox-wrapper">
          <svg className="checkbox" viewBox="0 0 52 52">
            <circle className="checkbox-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkbox-check" fill="none" d="M14 27l7 7 16-16" />
          </svg>
        </div>
      </div>

      <div><h3 className="slogan">feel first, plan better.</h3></div>

      <button className="log-in-button" onClick={() => signIn("google")}>
        Log In
      </button>
    </div>
  );
}
