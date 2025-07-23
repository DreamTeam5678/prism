import NavBar from "@/components/NavBar/NavBar";
import Avatars from "../components/FlowSpace/Avatars";
import BackgroundPicker from "../components/FlowSpace/BackgroundPicker";
import { useState } from "react";
import YoutubePlayer from "../components/FlowSpace/YoutubePlayer";
import PomodoroTimer from "../components/FlowSpace/PomodoroTimer";

const backgrounds = [
  'https://i.pinimg.com/originals/9c/d1/a0/9cd1a09bb5c3d5a6774128147c96b18b.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWF1cjl1cHlud2JrYm5kcjE5Y2ZkYjZkMWwzOGZqZnM1dDhzNGR4ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d3PcEfjRsLUqgTGZSE/giphy.gif',
  'https://wallpaperaccess.com/full/2641074.gif',
  'https://cdna.artstation.com/p/assets/images/images/059/104/894/original/ryan-haight-delridge-large-gif.gif?1675666673',
  'https://i.pinimg.com/originals/a4/04/a4/a404a481f48045b1a24cdbba5cc8d350.gif',
  'https://i.pinimg.com/originals/bb/d8/5f/bbd85fa86d8dc8e3fc64d086f6641a5c.gif',
  'https://wallpapers-clan.com/wp-content/uploads/2024/03/starfall-night-sky-mountains-aesthetic-gif-preview-desktop-wallpaper.gif'

];

export default function FlowSpace() {
  const [selected, setSelected] = useState<number>(0);
  const [navOn, setNavOn] = useState<boolean>(true);

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.3)), url(${backgrounds[selected]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "110vh",
        paddingBottom: "5vh",
        transition: "background-image 1s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      <button
        onClick={() => setNavOn((prev) => !prev)}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 100000,
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.2)",
          padding: "6px 14px",
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: "1.2rem",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          backdropFilter: "blur(6px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
        }}
      >
        {navOn ? "∧" : "∨"}
      </button>

      {navOn && <NavBar />}
      <Avatars />
      <BackgroundPicker current={selected} onChange={setSelected} />

      <div className="page-wrapper">
        <div className="flowspace-container">
          <h1 className="page-title">Flow Space</h1>
          <p className="page-subtitle">Your productivity sanctuary</p>

          <div className="productivity-grid">
            <div className="youtube-section">
              <h2>🎵 Flow Beats </h2>
              <YoutubePlayer />
            </div>

            <div className="pomodoro-section">
              <h2>⏰ Flow Timer</h2>
              <PomodoroTimer />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          padding: 1.5rem 2rem 2rem;
          margin-bottom: 0.1rem;
        }

        .flowspace-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-title {
          text-align: center;
          color: white;
          font-size: 3rem;
          font-weight: bold;
          margin-top: 1.2rem;
          margin-bottom: 0.3rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        }

        .page-subtitle {
          text-align: center;
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
          font-weight: 300;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.6);
        }

        .productivity-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .youtube-section,
        .pomodoro-section {
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 2rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          transition: transform 0.3s ease;
          min-height: 400px;
        }

        .youtube-section:hover,
        .pomodoro-section:hover {
          transform: scale(1.02);
        }

        .youtube-section h2,
        .pomodoro-section h2 {
          color: white;
          text-align: center;
          margin-bottom: 1rem;
          font-size: 1.6rem;
          font-weight: 500;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        }
        
        .youtube-section h2,
        .pomodoro-section h2 {
          color: #bd6044c8
          text-align: center;
          margin-bottom: 1rem;
          font-size: 1.75rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          letter-spacing: 1px;
          position: relative;
        }

        .youtube-section h2::after,
        .pomodoro-section h2::after {
          content: "";
          display: block;
          width: 60px;
          height: 3px;
          margin: 8px auto 0;
          background-color: #EAD8AC; /* Beige underline */
          border-radius: 2px;
          opacity: 0.8;
        }


        @media (max-width: 768px) {
          .page-title {
            font-size: 2.2rem;
          }

          .page-subtitle {
            font-size: 1rem;
          }

          .productivity-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            max-width: 100%;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 350px;
          }
        }
      `}</style>
    </div>
  );
}
