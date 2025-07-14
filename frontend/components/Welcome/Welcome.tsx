import "./Welcome.css";
import { useSession } from "next-auth/react";


export default function Welcome() {
    return (
        <body>
            <div className="welcome-container">
                <h1 className="welcome-title">welcome to </h1>
                <div className ="check-container">
                <img className="logo" src="./logo.png" alt="Prism Logo"/>
                <div className="checkbox-wrapper">
                    <svg className="checkbox" viewBox="0 0 52 52">
                        <circle className="checkbox-circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="checkbox-check" fill="none" d="M14 27l7 7 16-16" />
                    </svg>
            
                </div>

                
                </div>
                
                <div><h3 className="slogan">feel first, plan better.</h3></div>
                <button className="log-in-button" onClick={() => window.location.href = "/home"}>
                    Log In
                </button>
            </div>
        </body>
    );
}


