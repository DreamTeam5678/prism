//optimize button component 
import React from "react";
import { useSession } from "next-auth/react";


export default function Optimize() {
    return (
        <div className="optimize-container">
            <button className="optimize-button">Optimize!</button>
        </div>
    );
}

