import React, { useState } from "react";
import { useSession } from "next-auth/react";
import MoodModal from "../../MoodModal/MoodModal"; 

type Mood = {
  emoji: string;
  label: string;
};

export default function Optimize() {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);

  const handleSelectMood = (mood: Mood) => {
    console.log("Selected mood:", mood);
    setShowModal(false);


  };


     
  return (
    <div className="optimize-container">
      <button className="optimize-button" onClick={() => setShowModal(true)}>
        <div className="optimize-button-text">
          Optimize!
          </div>
      </button>

      {showModal && (
        <MoodModal
          onClose={() => setShowModal(false)}
          onSelectMood={handleSelectMood}
        />
      )}
    </div>
  );
}