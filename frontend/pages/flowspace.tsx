import NavBar from "@/components/NavBar/NavBar";
import Avatars from "../components/FlowSpace/Avatars";
import BackgroundPicker from "../components/FlowSpace/BackgroundPicker";
import { useState } from "react";
import styles from "../components/FlowSpace/FlowSpace.module.css";
import YoutubePlayer from '../components/FlowSpace/YoutubePlayer';
import PomodoroTimer from '../components/FlowSpace/PomodoroTimer';

const backgrounds = [
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWF1cjl1cHlud2JrYm5kcjE5Y2ZkYjZkMWwzOGZqZnM1dDhzNGR4ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d3PcEfjRsLUqgTGZSE/giphy.gif',
   'https://i.pinimg.com/originals/9c/d1/a0/9cd1a09bb5c3d5a6774128147c96b18b.gif',
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
    <div style={{
      backgroundImage: `url(${backgrounds[selected]})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "105vh",
      transition: "background-image 0.5s ease-in-out",
      borderRadius: "20px",
    }}>
      <button onClick={() => setNavOn((prev)=> !prev)} 
        style={{
        position: "absolute",
        top: "-5px",
        left: "13px",
        zIndex: 100000,
        backgroundColor: "transparent",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "50px",
        cursor: "pointer",
        fontSize: "1.5rem",
        transition: "background-color 0.2s ease",
        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
       }}>
        {navOn ? "∧" : "∨"}
       
      </button>
      {navOn &&
      <NavBar />
      }

      <Avatars />
      <BackgroundPicker
        current= {selected}
        onChange={setSelected}
       />

      <div className="page-wrapper">
        <div className="flowspace-container">
          <h1 className="page-title">FlowSpace</h1>
          <p className="page-subtitle">Your productivity sanctuary</p>

          <div className="productivity-grid">
            <div className="youtube-section">
              <h2>🎥 Focus Music</h2>
              <YoutubePlayer />
            </div>
            
            <div className="pomodoro-section">
              <h2>⏰ Pomodoro Timer</h2>
              <PomodoroTimer />
            </div>
          </div>
        </div>

        <style jsx>{`
          .page-wrapper {
            min-height: 100vh;
            padding: 2rem;
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
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          }

          .page-subtitle {
            text-align: center;
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.2rem;
            margin-bottom: 2rem;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          }

          .productivity-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
          }

          .youtube-section,
          .pomodoro-section {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .youtube-section h2,
          .pomodoro-section h2 {
            color: white;
            text-align: center;
            margin-bottom: 1rem;
            font-size: 1.5rem;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          }

          @media (max-width: 768px) {
            .productivity-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .page-title {
              font-size: 2rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}