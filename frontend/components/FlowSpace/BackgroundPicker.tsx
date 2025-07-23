
//import { useState, useRef, useEffect } from "react";

const backgrounds = [
  'https://i.pinimg.com/originals/9c/d1/a0/9cd1a09bb5c3d5a6774128147c96b18b.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWF1cjl1cHlud2JrYm5kcjE5Y2ZkYjZkMWwzOGZqZnM1dDhzNGR4ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d3PcEfjRsLUqgTGZSE/giphy.gif',
    'https://wallpaperaccess.com/full/2641074.gif',
    'https://cdna.artstation.com/p/assets/images/images/059/104/894/original/ryan-haight-delridge-large-gif.gif?1675666673',
    'https://i.pinimg.com/originals/a4/04/a4/a404a481f48045b1a24cdbba5cc8d350.gif',
    'https://i.pinimg.com/originals/bb/d8/5f/bbd85fa86d8dc8e3fc64d086f6641a5c.gif',
    'https://wallpapers-clan.com/wp-content/uploads/2024/03/starfall-night-sky-mountains-aesthetic-gif-preview-desktop-wallpaper.gif'

];

export default function BackgroundPicker({current, onChange}) {
    return (
        <div className="background-picker">
            {backgrounds.map((url, index) => (
                <div
                    key={index}
                    className={`background-picker-item ${current === index ? "selected" : ""}`}
                    onClick={() => onChange(index)}
                >                    
                    <img src={url} alt={`Background ${index + 1}`} />
                </div>
            ))}
        </div>
    );
}