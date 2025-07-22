import NavBar from "@/components/NavBar/NavBar";
import Avatars from "../components/FlowSpace/Avatars";
import BackgroundPicker from "../components/FlowSpace/BackgroundPicker";
import YoutubePlayer from "../components/FlowSpace/YoutubePlayer";
import { useState } from "react";

const backgrounds = [
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWF1cjl1cHlud2JrYm5kcjE5Y2ZkYjZkMWwzOGZqZnM1dDhzNGR4ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d3PcEfjRsLUqgTGZSE/giphy.gif',
   'https://i.pinimg.com/originals/9c/d1/a0/9cd1a09bb5c3d5a6774128147c96b18b.gif',
    'https://wallpaperaccess.com/full/2641074.gif',
    'https://cdna.artstation.com/p/assets/images/images/059/104/894/original/ryan-haight-delridge-large-gif.gif?1675666673',
    'https://i.pinimg.com/originals/a4/04/a4/a404a481f48045b1a24cdbba5cc8d350.gif',
    'https://i.pinimg.com/originals/bb/d8/5f/bbd85fa86d8dc8e3fc64d086f6641a5c.gif',
    'https://wallpapers-clan.com/wp-content/uploads/2024/03/starfall-night-sky-mountains-aesthetic-gif-preview-desktop-wallpaper.gif'

];

export default function FlowSpacePage() {
  const [selected, setSelected] = useState<number>(0);
  const [navOn, setNavOn] = useState<boolean>(true);
  
  return (
    <div style={{
      backgroundImage: `url(${backgrounds[selected]})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "105vh",
      transition: "background-image 0.5s ease-in-out",
      opacity: 0.8,
      borderRadius: "20px",
      
    }}>
      <button onClick={() => setNavOn((prev)=> !prev)} 
        style={{
        position: "absolute",
        top: "-5px",
        left: "13px",
        zIndex: 100000,
        backgroundColor: "transparent",
        color: "black",
        border: "none",
        padding: "10px 20px",
        borderRadius: "50px",
        cursor: "pointer",
        fontSize: "1.5rem",
        transition: "background-color 0.2s ease",
    
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

       <YoutubePlayer />
     
      </div>
    
    
  );

}