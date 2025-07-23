//import { NextApiRequest, NextApiResponse } from "next";
import { useState, useEffect } from "react";
import Link from "next/link";


interface Video {
    id: {
        videoId: string;

    };
    snippet: {
        title: string;
        description: string;
        thumbnails: {
            default: {
                url: string;
            };
        };
    };
}

const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
if (!apiKey) {
    console.warn("⚠️ Missing NEXT_PUBLIC_YOUTUBE_API_KEY in env");
}

export default function YoutubePlayer() {
    const [query, setQuery] = useState<string>("");
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [results, setResults] = useState<any>([]);
    

    const handleSearch = async (query: string) => {
        const res = await fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${apiKey}&type=video`);
        const data = await res.json();
        if (Array.isArray(data.items)) {
            setResults(data.items);
        }
    };

    const handlePlay = (videoId: string) : void =>
    { setSelectedVideo(videoId); 
        setResults([]);
    };
    return (
        <div className="youtube-player-container">
      {!selectedVideo && (
        <div className="youtube-player-search">
          <input
            type="text"
            placeholder="Search relaxing ambient sounds..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="youtube-player-search-input"
          />
          <button onClick={() => handleSearch(query)} className="youtube-player-search-button">
            Search
          </button>
        </div>
      )}

      {!selectedVideo && results.length > 0 && (
        <div className="youtube-player-results">
          {results.map((result) => (
            <div
              key={result.id.videoId}
              className="youtube-player-result-card"
              onClick={() => handlePlay(result.id.videoId)}
            >
              <img src={result.snippet.thumbnails.default.url} alt={result.snippet.title} />
              <div className="youtube-player-result-info">
                <h3 className="youtube-player-result-title">{result.snippet.title}</h3>
                <p className="youtube-player-result-description">{result.snippet.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

       {selectedVideo && (
        <div className="youtube-monitor-scene">
          <img
            src="https://cdn.creazilla.com/cliparts/3152058/monitor-clipart-md.png"
            alt="Monitor"
            className="youtube-monitor-image"
          />
          <Link href = "/flowspace">
          <img
            src="https://png.pngtree.com/png-vector/20220608/ourmid/pngtree-reload-icon-retry-restart-recover-png-image_4891515.png"
            alt="Reload"
            className="retry-button"
          />
          </Link>
          <div className="youtube-player-on-monitor">
            <iframe
              className="youtube-player-video"
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )} 
    </div>
        
    );
}