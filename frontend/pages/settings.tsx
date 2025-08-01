"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "../components/NavBar/NavBar";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [surveyData, setSurveyData] = useState<{
    currentMode: string[];
    idealSelf: string[];
    blockers: string[];
    dislikes: string[];
    behaviorTags: string[]; 
  }>({
      currentMode: [],
      idealSelf: [],
      blockers: [],
      dislikes: [],
      behaviorTags: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        if (data.hasProfile && data.userProfile) {
          setSurveyData(data.userProfile);
        }
      } catch (err) {
        setError("Failed to load profile data. Please try again.");
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setEditing(false);
      } else {
        setError("Failed to save profile name.");
      }
    } catch (err) {
      setError("Error saving profile name.");
      console.error("Error saving profile:", err);
    }
  };

  const tagGroups = {
    currentMode: ["student", "professional", "personal"],
    idealSelf: [
      "structured_planner",
      "calm_builder",
      "balance_seeker",
      "creative_achiever",
      "intentional_living",
      "flexible_living",
      "inspired_achiever",
      "health_conscious",
    ],
    blockers: [
      "burnout_prone",
      "overwhelm_prone",
      "motivation_challenged",
      "followthrough_risk",
      "distractible",
      "guilt_prone",
      "needs_structure",
      "routine_struggler",
      "easily_distracted",
      "forgetful",
    ],
    dislikes: [
      "dislike_journaling",
      "not_morning_person",
      "dislike_routines",
      "prefers_short_sessions",
      "low_social_battery",
      "dislike_meditation",
      "dislike_intense_workouts",
      "dislike_screen_time",
      "dislike_over_scheduling",
      "dislike_cooking",
      "indoor_preferrer",
    ],
  };

  const categorizeTag = (tag: string) => {
    if (tagGroups.currentMode.includes(tag)) return "currentMode";
    if (tagGroups.idealSelf.includes(tag)) return "idealSelf";
    if (tagGroups.blockers.includes(tag)) return "blocker";
    if (tagGroups.dislikes.includes(tag)) return "dislike";
    return "other";
  };

  const groupedTags = {
    currentMode: surveyData.behaviorTags.filter(tag => categorizeTag(tag) === "currentMode"),
    idealSelf: surveyData.behaviorTags.filter(tag => categorizeTag(tag) === "idealSelf"),
    blocker: surveyData.behaviorTags.filter(tag => categorizeTag(tag) === "blocker"),
    dislike: surveyData.behaviorTags.filter(tag => categorizeTag(tag) === "dislike"),
  };

  if (status === "loading" || loading) {
    return (
      <div className="profile-wrapper">
        <NavBar />
        <div className="profile-page">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="profile-wrapper">
        <NavBar />
        <div className="profile-page">
          <p>You must be signed in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <NavBar />
      <div className="profile-page">
        <h1>👤 Your Profile</h1>
        {error && <p className="error-message">{error}</p>}
        <div className="content-wrapper">
          <div className="profile-card">
            <img
              src={session.user?.image || "/default-avatar.png"}
              alt={`${name}'s profile picture`}
              className="profile-img"
            />
            <div className="profile-info">
              {editing ? (
                <>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="profile-input"
                    aria-label="Edit name"
                  />
                  <button onClick={handleSave} className="profile-btn" aria-label="Save profile">
                    Save
                  </button>
                </>
              ) : (
                <>
                  <h2>{name}</h2>
                  <button onClick={() => setEditing(true)} className="profile-btn" aria-label="Edit profile">
                    Edit
                  </button>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="signout-btn" aria-label="Sign out">
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>

          {surveyData.behaviorTags.length > 0 && (
            <div className="dashboard-box">
              <p className="tag-group-label">Your Current Mode:</p>
              <div className="tag-row">
                {groupedTags.currentMode.map((tag) => (
                  <span className="tag currentMode" key={tag}>{tag.replace(/_/g, ' ')}</span>
                ))}
              </div>
              <p className="tag-group-label">Your Ideal Self:</p>
              <div className="tag-row">
                {groupedTags.idealSelf.map((tag) => (
                  <span className="tag idealSelf" key={tag}>{tag.replace(/_/g, ' ')}</span>
                ))}
              </div>
              <p className="tag-group-label">Your Blockers:</p>
              <div className="tag-row">
                {groupedTags.blocker.map((tag) => (
                  <span className="tag blocker" key={tag}>{tag.replace(/_/g, ' ')}</span>
                ))}
              </div>
              <p className="tag-group-label">Your Dislikes:</p>
              <div className="tag-row">
                {groupedTags.dislike.map((tag) => (
                  <span className="tag dislike" key={tag}>{tag.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        :global(body) {
          color: #333;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow-x: hidden;
          background-color: #f8faff;
          
        }

        :global(.profile-wrapper) {
          font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif; 
          display: flex;
          flex-direction: column;
          animation: backgroundPan 20s linear infinite alternate;
        }

        @keyframes backgroundPan {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }

        .profile-page {
          max-width: 200vw;
          margin: 0 auto;
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          height: 98vh;
        }

        .content-wrapper {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          gap: 4rem;
          width: 100%;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInBounce {
          0% { transform: translateY(-80px); }
          60% { transform: translateY(15px); }
          100% { transform: translateY(0); }
        }

        @keyframes popInOvershoot {
          0% { transform: scale(0.6); }
          80% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }

        @keyframes slideInLeft {
          from { transform: translateX(-40px); }
          to { transform: translateX(0); }
        }

        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
          50% { transform: scale(1.02); box-shadow: 0 12px 25px rgba(209, 107, 66, 0.4); }
          100% { transform: scale(1); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        }

        h1 {
          font-size: 3.4rem;
          color: #333;
          text-align: center;
          margin: -1.2rem;
          margin-top: 0.5rem;
          padding-top: 30px;
          font-weight: 700;
          letter-spacing: -0.05em;
          text-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
          background: -webkit-linear-gradient(45deg, #9F89AC, #9AAB87);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: slideInBounce 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s forwards;

        }

        .error-message {
          background-color: rgba(209, 107, 66, 0.15);
          color: #D16B42;
          text-align: center;
          font-size: 1rem;
          padding: 1rem 1.4rem;
          border-radius: 12px;
          border: 1px solid #D16B42;
          box-shadow: 0 4px 10px rgba(209, 107, 66, 0.25);
          margin: 0 auto;
          font-weight: 500;
          animation: fadeIn 0.6s ease-out;
          width: fit-content;
        }

        .profile-card {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          flex: 0 0 22%;
          max-width: 400px;
          height: auto;
          align-self: flex-start;
          margin-left: 0rem;
          margin-top: 5.5rem;
          background: #ffffff;
          background-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
          padding: 2rem 2rem;
          border-radius: 22px;
          border: 2px ridge rgba(234, 254, 255, 0.6);
          overflow: hidden;
          animation: popInOvershoot 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s forwards;
        }

        .profile-card::before {
          content: '';
          position: absolute;
          top: -30px;
          left: -30px;
          right: -30px;
          bottom: -30px;
          background: radial-gradient(circle at top left, rgba(205, 228, 237, 0.5) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          transition: transform 0.8s ease, opacity 0.8s ease-out;
          opacity: 0.7;
        }

        .profile-card:hover::before {
          transform: scale(1.15) translate(10px, 10px);
          opacity: 1;
        }

        .profile-card:hover {
          transform: translateY(-12px);
          box-shadow: 0 30px 65px rgba(0, 0, 0, 0.3);
        }

        .profile-img {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          object-fit: cover;
          border: 5px solid #CDE4ED;
          box-shadow: 0 0 0 8px rgba(205, 228, 237, 0.5), 0 6px 18px rgba(0, 0, 0, 0.2);
          transition: border-color 0.5s ease, box-shadow 0.5s ease, transform 0.5s ease;
          flex-shrink: 0;
          z-index: 1;
        }

        .profile-img:hover {
          border-color: #9F89AC;
          transform: scale(1.1) rotate(7deg);
          box-shadow: 0 0 0 10px rgba(159, 137, 172, 0.6), 0 8px 20px rgba(0, 0, 0, 0.35);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          justify-content: center;
          flex-grow: 1;
          z-index: 1;
        }

        .profile-info h2 {
          display: flex;
          flex-direction: row;
          font-size: 2.1rem;
          background: -webkit-linear-gradient(45deg, #9F89AC, #9AAB87);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          font-weight: 600;
          letter-spacing: -0.04em;
          align-self: center;
          text-align: center;
          margin-top: 1rem;
        }

        .profile-input {
          padding: 0.75rem 1.2rem;
          font-size: 1rem;
          border: 1px solid #CDE4ED;
          border-radius: 12px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          width: 100%;
          box-sizing: border-box;
          background-color: #fcfdfe;
        }

        .profile-input:focus {
          outline: none;
          border-color: #9F89AC;
          box-shadow: 0 0 0 4px rgba(159, 137, 172, 0.4);
        }

        .profile-btn {
          background-color:rgb(214, 162, 146);
          color: white;
          padding: 0.8rem 1.6rem;
          border: 2px ridge rgba(255, 246, 244, 0.78);
          border-radius: 12px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 600;
          letter-spacing: 0.5px;
          align-self: flex-start;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.38);
          transition: background-color 0.3s ease, transform 0.4s ease, box-shadow 0.3s ease;
          align-self: center;
          
        }

        .profile-btn:hover {
          background-color: #839775;
          transform: translateY(-6px);
          box-shadow: 0 8px 20px rgba(154, 170, 135, 0.5);
        }

        .signout-btn {
          background-color: #bd6044c8;
          color: white;
          padding: 0.8rem 1.6rem;
          border: 2px ridge rgba(255, 246, 244, 0.78);
          border-radius: 12px;
          font-size: 1rem;
          cursor: pointer;
          align-self: flex-start;
          font-weight: 600;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.74);
          animation: pulse 2s infinite ease-in-out;
          transition: background-color 0.3s ease, transform 0.4s ease, box-shadow 0.3s ease;
          align-self: center;
          font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;

        }

        .signout-btn:hover {
          background-color: #b85e3c;
          transform: translateY(-6px);
          box-shadow: 0 12px 25px rgba(209, 107, 66, 0.6);
          animation: none;
        }

        .dashboard-box {
          flex: 1 1 100%;
          max-width: 100%;
          min-height: 150px;
          margin-top: 1rem;
          background: #ffffff;
          background: rgba(255, 255, 255, 0.15);
          padding: 3rem 2.5rem 0.2rem 2.5rem;
          border-radius: 22px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
          text-align: center;
          border: 2px ridge rgba(234, 254, 255, 0.6);
          position: relative;
          overflow: hidden;
          animation: popInOvershoot 1s ease 0.3s forwards;
          overflow-wrap: break-word;
        }



        .dashboard-box::before {
          content: '';
          position: absolute;
          top: -30px;
          left: -30px;
          right: -30px;
          bottom: -30px;
          background: radial-gradient(circle at bottom right, rgba(154, 170, 135, 0.5) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          transition: transform 0.8s ease, opacity 0.8s ease-out;
          opacity: 0.7;
        }

        .dashboard-box:hover::before {
          transform: scale(1.15) translate(-10px, -10px);
          opacity: 1;
        }

        .dashboard-box:hover {
          transform: translateY(-12px);
          box-shadow: 0 30px 65px rgba(0, 0, 0, 0.3);
        }

        .dashboard-box h2 {
          font-size: 2.4rem;
          color: #333;
          margin: 0 0 1.8rem;
          font-weight: 700;
          letter-spacing: -0.05em;
          background: -webkit-linear-gradient(45deg, #9AAB87, #9F89AC);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          z-index: 1;
          position: relative;
        }

        .tag-group-label {
          font-size: 1.65rem;
          font-weight: 800;
          background: -webkit-linear-gradient(45deg, #9F89AC, #9AAB87);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: -0.1rem 0 1rem;
          border-bottom: 2px solid #9F89AC;
          padding-bottom: 0.6rem;
          display: inline-block;
          animation: slideInLeft 0.8s ease-out backwards 0.4s;
        }

        .tag-row {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
        }

        .tag {
          padding: 0.55rem 1.2rem;
          border-radius: 30px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          transition: transform 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 6px 15px rgba(0,0,0,0.08);
          border: 1px solid transparent;
          white-space: nowrap;
          animation: popInOvershoot 0.9s ease backwards 0.5s;
        }

        .tag:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .tag.currentMode {
          background: #F1E2C2;
          color: #8b6e3f;
          border-color: #F1E2C2;
          border: 2px double rgb(255, 255, 255);
          box-shadow: inset 0 0px 20px rgba(255, 246, 244, 0.78);
        }

        .tag.currentMode:hover {
          background-color: #e6d3af;
        }

        .tag.idealSelf {
          background: #9F89AC;
          color: white;
          border-color: #9F89AC;
          border: 2px double rgb(255, 255, 255);
          box-shadow: inset 0 0px 20px rgba(255, 246, 244, 0.78);
        }

        .tag.idealSelf:hover {
          background-color: #8b799a;
        }

        .tag.blocker {
          background: #9AAB87;
          color: white;
          border-color: #9AAB87;
          border: 2px double rgb(255, 255, 255);
          box-shadow: inset 0 0px 20px rgba(255, 246, 244, 0.78);
        }

        .tag.blocker:hover {
          background-color: #8b9a7c;
        }

        .tag.dislike {
          background: #CDE4ED;
          color: #3b6d80;
          border-color: #CDE4ED;
          border: 2px double rgb(255, 255, 255);
          box-shadow: inset 0 0px 20px rgba(255, 246, 244, 0.78);
        }

        .tag.dislike:hover {
          background-color: #badbeb;
        }

        @media (max-width: 1024px) {
          .profile-page {
            max-width: 90vw;
            padding: 2.5rem 2rem;
            gap: 1.5rem;
          }

          .content-wrapper {
            flex-direction: column;
            gap: 1.5rem;
          }

          .profile-card, .dashboard-box {
            flex: 0 0 100%;
            width: 100%;
          }

          h1 {
            font-size: 2.8rem;
          }

          .profile-card {
            padding: 2rem 2.5rem;
            gap: 2rem;
          }

          .profile-img {
            width: 120px;
            height: 120px;
            border-width: 4px;
          }

          .profile-info h2 {
            font-size: 1.8rem;
          }

          .profile-input {
            font-size: 0.95rem;
            padding: 0.6rem 1rem;
          }

          .profile-btn {
            padding: 0.7rem 1.4rem;
            font-size: 0.95rem;
          }

          .dashboard-box {
            padding: 2rem 1.5rem;
          }

          .dashboard-box h2 {
            font-size: 2rem;
          }

          .tag-group-label {
            font-size: 1.15rem;
          }

          .tag {
            font-size: 0.9rem;
            padding: 0.5rem 1rem;
          }

          .signout-btn {
            padding: 1rem 2.5rem;
            font-size: 1.1rem;
          }
        }

        @media (max-width: 768px) {
          .profile-page {
            padding: 2rem 1.5rem;
            gap: 1.5rem;
          }

          h1 {
            font-size: 2.5rem;
          }

          .profile-card {
            flex-direction: column;
            text-align: center;
            padding: 1.8rem 1.5rem;
            gap: 1.5rem;
          }

          .profile-img {
            width: 100px;
            height: 100px;
            border-width: 4px;
          }

          .profile-info {
            align-items: center;
          }

          .profile-info h2 {
            font-size: 1.6rem;
          }

          .profile-input {
            width: 100%;
            font-size: 0.9rem;
          }

          .profile-btn {
            width: auto;
            align-self: center;
            padding: 0.6rem 1.2rem;
            font-size: 0.9rem;
          }

          .dashboard-box {
            padding: 1.8rem 1.5rem;
          }

          .dashboard-box h2 {
            font-size: 1.8rem;
          }

          .tag-group-label {
            font-size: 1.1rem;
            margin: 1.5rem 0 1rem;
          }

          .tag {
            font-size: 0.85rem;
            padding: 0.45rem 0.9rem;
          }

          .signout-btn {
            width: 80%;
            padding: 0.9rem 2rem;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .profile-page {
            padding: 1.5rem 1rem;
            gap: 1rem;
          }

          h1 {
            font-size: 2rem;
          }

          .profile-card {
            padding: 1.5rem 1rem;
          }

          .profile-img {
            width: 80px;
            height: 80px;
            border-width: 3px;
          }

          .profile-info h2 {
            font-size: 1.4rem;
          }

          .profile-input {
            font-size: 0.85rem;
            padding: 0.5rem 0.8rem;
          }

          .profile-btn {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
          }

          .dashboard-box {
            padding: 1.5rem 1rem;
          }

          .dashboard-box h2 {
            font-size: 1.6rem;
          }

          .tag-group-label {
            font-size: 1rem;
            margin: 1.2rem 0 0.8rem;
          }

          .tag {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
            border-radius: 25px;
          }

          .signout-btn {
            width: 90%;
            font-size: 0.95rem;
            padding: 0.8rem 1.8rem;
          }
        }

        /* Prism Logo Styles - Now handled by global CSS */
      `}</style>

      {/* Prism Logo - Bottom Right */}
      <div className="prism-logo">
        <Link href="/privacy">
          <img src="/logo.png" alt="Prism" />
        </Link>
      </div>
    </div>
  );
}