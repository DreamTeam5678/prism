/*
import NavBar from "@/components/NavBar/NavBar";
//import Avatars from "../components/FlowSpace/Avatars";
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
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

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
          top: "3px",
          left: "25px",
          zIndex: 100000,
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "rgba(198, 194, 194, 0.98)",
          border: "1px solid rgba(255,255,255,0.2)",
          padding: "2px 8px",
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
     
      <BackgroundPicker current={selected} onChange={setSelected} />

      <div className="page-wrapper">
        <div className="flowspace-container">
          <h1 className="page-title">Flow Space</h1>
          <p className="page-subtitle">Your productivity sanctuary</p>

          <div className="productivity-grid">
            <div className="youtube-section">
              <h2>🎵 Flow Beats </h2>
              <YoutubePlayer onVideoStateChange={setIsVideoPlaying} />
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
          margin-top: ${isVideoPlaying ? '-80px' : '1.2rem'};
          margin-bottom: 0.3rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
          transition: margin-top 0.3s ease;
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
          color: #bd6044c8;
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
          background-color: #EAD8AC; 
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

        @media (min-width: 769px) and (max-width: 1024px) {
          .page-title {
            font-size: 2.8rem;
          }

          .productivity-grid {
            grid-template-columns: 1fr 1fr;
            gap: 1.8rem;
            max-width: 1000px;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 380px;
          }
        }

        @media (min-width: 1025px) and (max-width: 1440px) {
          .productivity-grid {
            max-width: 1200px;
            gap: 2.5rem;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 450px;
          }
        }

        @media (min-width: 1441px) {
          .productivity-grid {
            max-width: 1400px;
            gap: 3rem;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 500px;
          }

          .page-title {
            font-size: 3.5rem;
          }
        }

        @media (max-width: 480px) {
          .page-wrapper {
            padding: 1rem 1rem 1.5rem;
          }

          .page-title {
            font-size: 1.8rem;
            margin-top: ${isVideoPlaying ? '-60px' : '0.8rem'};
          }

          .page-subtitle {
            font-size: 0.9rem;
          }

          .productivity-grid {
            gap: 1rem;
          }

          .youtube-section,
          .pomodoro-section {
            padding: 1.5rem 1rem;
            min-height: 300px;
          }
        }
        @media (max-width: 360px) {
          .page-title {
            font-size: 1.5rem;
            margin-top: ${isVideoPlaying ? '-50px' : '0.6rem'};
          }

          .page-subtitle {
            font-size: 0.8rem;
          }

          .youtube-section,
          .pomodoro-section {
            padding: 1rem 0.8rem;
            min-height: 280px;
          }

          .youtube-section h2,
          .pomodoro-section h2 {
            font-size: 1.4rem;
          }
        }

        @media (max-width: 768px) and (orientation: landscape) {
          .page-wrapper {
            padding: 0.8rem 1.5rem 1rem;
          }

          .page-title {
            font-size: 1.8rem;
            margin-top: ${isVideoPlaying ? '-40px' : '0.5rem'};
          }

          .page-subtitle {
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }

          .productivity-grid {
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 280px;
            padding: 1.2rem 1rem;
          }
        }

        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .page-title {
            text-shadow: 0 1px 5px rgba(0, 0, 0, 0.8);
          }

          .page-subtitle {
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .page-title,
          .page-subtitle,
          .youtube-section,
          .pomodoro-section {
            transition: none;
          }
        }

        @media (prefers-color-scheme: dark) {
          .youtube-section,
          .pomodoro-section {
            background: rgba(255, 255, 255, 0.05);
          }
        }

        @media print {
          .page-wrapper {
            padding: 0;
          }

          .page-title {
            color: black;
            text-shadow: none;
          }

          .page-subtitle {
            color: #333;
            text-shadow: none;
          }

          .youtube-section,
          .pomodoro-section {
            background: white;
            color: black;
            box-shadow: none;
            border: 1px solid #ccc;
          }
        }

        @media (min-width: 2000px) {
          .flowspace-container {
            max-width: 1800px;
          }

          .productivity-grid {
            max-width: 1600px;
            gap: 4rem;
          }

          .page-title {
            font-size: 4rem;
          }

          .page-subtitle {
            font-size: 1.5rem;
          }
        }

        @media (min-width: 2500px) {
          .flowspace-container {
            max-width: 2000px;
          }

          .productivity-grid {
            max-width: 1800px;
            gap: 5rem;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 600px;
          }
        }

        @media (prefers-contrast: high) {
          .page-title {
            color: white;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
          }

          .youtube-section,
          .pomodoro-section {
            border: 2px solid rgba(255, 255, 255, 0.3);
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .youtube-section:hover,
          .pomodoro-section:hover {
            transform: none;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 400px;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .productivity-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 400px;
          }
        }

        @media (max-height: 600px) {
          .page-wrapper {
            padding: 0.5rem 2rem 1rem;
          }

          .page-title {
            font-size: 2rem;
            margin-top: ${isVideoPlaying ? '-30px' : '0.3rem'};
          }

          .page-subtitle {
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 250px;
            padding: 1.5rem 1rem;
          }
        }

        @media (max-height: 400px) {
          .page-title {
            font-size: 1.5rem;
            margin-top: ${isVideoPlaying ? '-20px' : '0.2rem'};
          }

          .page-subtitle {
            font-size: 0.8rem;
            margin-bottom: 0.5rem;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 200px;
            padding: 1rem 0.8rem;
          }
        }

        @media (min-width: 1024px) and (max-width: 1440px) {
          .page-wrapper {
            padding: 1.5rem 2rem 2rem;
            margin-top: 1rem;
          }

          .page-title {
            font-size: 3.5rem;
            margin-top: ${isVideoPlaying ? '-50px' : '1.5rem'};
            margin-bottom: 0.8rem;
          }

          .page-subtitle {
            font-size: 1.8rem;
            margin-bottom: 2rem;
          }

          .productivity-grid {
            max-width: 1200px;
            gap: 2.5rem;
            margin-top: 1rem;
          }

          .youtube-section,
          .pomodoro-section {
            min-height: 450px;
          }
        }



        @media (min-width: 1024px) and (max-width: 1440px) and (min-resolution: 144dpi) {
          .page-wrapper {
            padding: 3rem 2rem 2rem;
            margin-top: 4rem;
          }

          .page-title {
            font-size: 2.5rem;
            margin-top: ${isVideoPlaying ? '-30px' : '4rem'};
            margin-bottom: 1rem;
          }

          .page-subtitle {
            font-size: 1.2rem;
            margin-bottom: 3rem;
          }

          .productivity-grid {
            margin-top: 2rem;
          }
        }

        @media (min-width: 1024px) and (max-width: 1440px) and (min-resolution: 168dpi) {
          .page-wrapper {
            padding: 3.5rem 2rem 2rem;
            margin-top: 5rem;
          }

          .page-title {
            font-size: 1.8rem;
            margin-top: ${isVideoPlaying ? '-80px' : '5rem'};
            margin-bottom: 1.2rem;
          }

          .page-subtitle {
            font-size: 0.9rem;
            margin-bottom: 3.5rem;
          }

          .productivity-grid {
            margin-top: 2.5rem;
          }
        }


        @media (min-width: 1024px) and (max-width: 1440px) and (min-resolution: 192dpi) {
          .page-wrapper {
            padding: 4rem 2rem 2rem;
            margin-top: 6rem;
          }

          .page-title {
            font-size: 1.5rem;
            margin-top: ${isVideoPlaying ? '-80px' : '6rem'};
            margin-bottom: 1.5rem;
          }

          .page-subtitle {
            font-size: 0.8rem;
            margin-bottom: 4rem;
          }

          .productivity-grid {
            margin-top: 3rem;
          }
        }

        @media (min-width: 1024px) and (max-width: 1440px) {
          .page-wrapper {
            position: relative;
            z-index: 1;
          }

          .background-picker {
            position: relative;
            z-index: 10;
          }
        }
      `}</style>
    </div>
  );
}
*/
import NavBar from "@/components/NavBar/NavBar";
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
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

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
      <BackgroundPicker current={selected} onChange={setSelected} />

      <div
        className="page-wrapper"
        style={{
          paddingTop: isVideoPlaying ? "1rem" : "0.5rem",
          paddingBottom: "2rem"
        }}
      >
        <div className="flowspace-container">
          <h1
            className="page-title"
            style={{
              marginTop: isVideoPlaying ? "-100px" : "0.2rem"
            }}
          >
            Flow Space
          </h1>
          <p className="page-subtitle">Your productivity sanctuary</p>

          <div className="productivity-grid">
            <div className="youtube-section">
              <h2>🎵 Flow Beats </h2>
              <YoutubePlayer onVideoStateChange={setIsVideoPlaying} />
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
          padding-left: 2rem;
          padding-right: 2rem;
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
          color: #bd6044c8;
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
          background-color: #EAD8AC;
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

        @media (max-height: 750px) {
          .page-wrapper {
            padding-top: 0.5rem !important;
          }

          .page-title {
            margin-top: 0.3rem !important;
            font-size: 2.2rem;
          }

          .page-subtitle {
            font-size: 1rem;
          }

          .youtube-section,
          .pomodoro-section {
            padding: 1.2rem 1rem;
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}

