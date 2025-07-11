import "./Welcome.css";
import { useSession } from "next-auth/react";


export default function Welcome() {
    return (
        <div className="welcome-container">
            <h1 className="welcome-title">Welcome to <img className="logo" src="./logo.png" alt="Prism Logo"/></h1>
            <button className="log-in-button" onClick={() => window.location.href = "/home"}>
                Log In
            </button>
        </div>
    );
}


