import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <div>
      <Link href="/">
        <div className="nav-bar-logo">
          <img src="/logo.png" alt="Prism Logo" />
        </div>
        </Link>
    
    <div className="nav-bar">
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
            ⌂
            <div className ="nav-bar-link-text">
                Home
            </div>
          </Link>
  
          <Link href="/tasks" className="nav-bar-link">
            ☑
            <div className ="nav-bar-link-text">
                Tasks
            </div>
          </Link>
          <Link href="/flowspace" className="nav-bar-link">
            ༄
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




