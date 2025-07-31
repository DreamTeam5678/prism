import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { HousePlus, ListTodo, AudioWaveform } from "lucide-react";

export default function NavBar() {
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Emit custom event for other components to listen to
    const event = new CustomEvent('navbarToggle', { 
      detail: { isCollapsed: newCollapsedState } 
    });
    document.dispatchEvent(event);
  };

  return (
    <div>
      {/* Collapse/Expand Button */}
      <button 
        className="nav-toggle-button"
        onClick={handleToggle}
        title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
      >
        {isCollapsed ? "→" : "←"}
      </button>
      
      <div className={`nav-bar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="nav-bar-container">
        {session && (
          <div className="nav-bar-profile">
            <Link href = "/settings">
              <img src={session.user.image ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png"} alt="Profile Picture" />
            </Link>
          </div>
        )}
        <div className="nav-bar-links">
          <Link href="/calendar" className="nav-bar-link">
            <HousePlus />
            <div className ="nav-bar-link-text">
                Home
            </div>
          </Link>
  
          <Link href="/tasks" className="nav-bar-link">
            <ListTodo />
            <div className ="nav-bar-link-text">
                Tasks
            </div>
          </Link>
          <Link href="/flowspace" className="nav-bar-link">
            <AudioWaveform />
            <div className ="nav-bar-link-text">
                Flow Space
            </div>
          </Link>
          
          
        </div>

      </div>
    </div>
    </div>
  );
} 




