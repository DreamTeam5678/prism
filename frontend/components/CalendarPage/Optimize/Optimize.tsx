import React, { useState } from "react";
import { useSession } from "next-auth/react";
import MoodModal from "../../MoodModal/MoodModal"; // adjust if path is different

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

    // Later: POST to backend using mood + session.user.id
  };

  return (
    <div className="optimize-container">
      <button className="optimize-button" onClick={() => setShowModal(true)}>
        Optimize!
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