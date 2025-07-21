// pages/profile.tsx
"use client";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import NavBar from "../components/NavBar/NavBar";
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [email] = useState(session?.user?.email || "");

  if (status === "loading") return <p>Loading...</p>;
  if (!session) return <p>You must be signed in to view this page.</p>;

  const handleSave = () => {
    setEditing(false);
  };

  return (
    <div>
        <NavBar />
    <div className="profile-page">
      <h1>👤 Your Profile</h1>

      <div className="profile-card">
        <img src={session.user?.image || "/default-avatar.png"} alt="Profile" className="profile-img" />

        <div className="profile-info">
          {editing ? (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="profile-input"
              />
              <button onClick={handleSave} className="profile-btn">Save</button>
            </>
          ) : (
            <>
              <h2>{name}</h2>
              <p>{email}</p>
              <button onClick={() => setEditing(true)} className="profile-btn">Edit</button>
            </>
          )}
        </div>
      </div>

      <button onClick={() => signOut({ callbackUrl: "/" })} className="signout-btn">
        Sign Out
      </button>
    </div>

      <style jsx>{`
        .profile-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem;
          font-family: 'Segoe UI', sans-serif;
        }

        .profile-card {
          display: flex;
          gap: 2rem;
          background: rgba(255,255,255,0.6);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
          align-items: center;
          margin-bottom: 2rem;
        }

        .profile-img {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #bbb;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .profile-input {
          padding: 0.5rem;
          font-size: 1rem;
          border-radius: 6px;
          border: 1px solid #ccc;
        }

        .profile-btn {
          background-color: #75906b;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .signout-btn {
          background-color: #82729c;
          color: white;
          padding: 0.5rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
