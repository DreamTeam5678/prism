import { useSession } from "next-auth/react";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <div className="nav-bar">
      <div className="nav-bar-container">
        <div className="nav-bar-logo">
          <img src="/logo.png" alt="Prism Logo" />
        </div>
        {session && (
          <div className="nav-bar-profile">
            <img src={session.user.image} alt="Profile Picture" />

          </div>
        )}
        <div className="nav-bar-links">
          <a href="/" className="nav-bar-link">
            𖠿
          </a>
          <a href="/calendar" className="nav-bar-link">
            ⊞
          </a>
          <a href="/tasks" className="nav-bar-link">
            ☑
          </a>
        </div>

      </div>
    </div>
  );
}   