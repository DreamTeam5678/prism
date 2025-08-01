"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import OptimizeModal from "../Optimize/OptimizeModal";
import styles from "./Optimize.module.css";

export default function Optimize() {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const fillRef = useRef<HTMLDivElement>(null);

  // Fill animation triggered by custom event
  useEffect(() => {
    const handleComplete = () => {
      setLoading(true);
      if (fillRef.current) {
        fillRef.current.style.width = "0"; // reset
        void fillRef.current.offsetWidth; // force reflow
        fillRef.current.style.width = "100%"; // trigger transition
      }

      setTimeout(() => {
        setLoading(false);
        if (fillRef.current) {
          fillRef.current.style.width = "0"; // reset again if desired
        }
      }, 3000); // match the CSS transition duration
    };

    document.addEventListener("optimizeComplete", handleComplete);
    return () => document.removeEventListener("optimizeComplete", handleComplete);
  }, []);

  // Listen for NavBar toggle events
  useEffect(() => {
    const handleNavToggle = (event: CustomEvent) => {
      console.log('🔄 NavBar toggle event received:', event.detail.isCollapsed);
      setIsNavCollapsed(event.detail.isCollapsed);
    };

    document.addEventListener("navbarToggle", handleNavToggle as EventListener);
    return () => document.removeEventListener("navbarToggle", handleNavToggle as EventListener);
  }, []);

  return (
    <div 
      className={`${styles.optimizeContainer} ${isNavCollapsed ? styles.navCollapsed : ""}`}
    >
      <button
        className={`${styles.optimizeButton} ${loading ? styles.loading : ""}`}
        onClick={() => setShowModal(true)}
        disabled={loading}
      >
        <div className={styles.fillBar} ref={fillRef} />
        <div className={styles.optimizeButtonText}>Optimize!</div>
      </button>

      {showModal && (
        <OptimizeModal
          onClose={() => setShowModal(false)}
          setLoading={() => {}} // this does nothing now
        />
      )}
    </div>
  );
}

