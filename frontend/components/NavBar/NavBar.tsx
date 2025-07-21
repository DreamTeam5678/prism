import { useSession } from "next-auth/react";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <div>
      <a href="/">
        <div className="nav-bar-logo">
          <img src="/logo.png" alt="Prism Logo" />
        </div>
        </a>
    
    <div className="nav-bar">
      <div className="nav-bar-container">
        {session && (
          <div className="nav-bar-profile">
            <a href = "/settings">
              <img src={session.user.image} alt="Profile Picture" />
            </a>
          </div>
        )}
        <div className="nav-bar-links">
          <a href="/" className="nav-bar-link">
            ⌂
            <div className ="nav-bar-link-text">
                Home
            </div>
          </a>
          <a href="/calendar" className="nav-bar-link">
            ⊞
            <div className ="nav-bar-link-text">
                Calendar
            </div>
          </a>
          <a href="/tasks" className="nav-bar-link">
            ☑
            <div className ="nav-bar-link-text">
                Tasks
            </div>
          </a>
          <a href="/flowspace" className="nav-bar-link">
            ༄
            <div className ="nav-bar-link-text">
                Flow Space
            </div>
          </a>
          <a href="/settings" className="nav-bar-link">
            ⚙
            <div className ="nav-bar-link-text">
                Settings
            </div>
          </a>
          
        </div>

      </div>
    </div>
    </div>
  );
} 




