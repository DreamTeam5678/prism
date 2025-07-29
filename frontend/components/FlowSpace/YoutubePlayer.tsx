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

interface CuratedPlaylist {
    name: string;
    query: string;
    emoji: string;
    description: string;
}

interface YoutubePlayerProps {
    onVideoStateChange?: (isPlaying: boolean) => void;
}

const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
if (!apiKey) {
    console.warn("⚠️ Missing NEXT_PUBLIC_YOUTUBE_API_KEY in env");
}

// Curated playlists for focus and productivity
const curatedPlaylists: CuratedPlaylist[] = [
    {
        name: "Deep Focus",
        query: "lofi hip hop radio beats to study relax",
        emoji: "🎧",
        description: "Lo-fi beats for deep concentration"
    },
    {
        name: "Nature Sounds",
        query: "rain sounds white noise 10 hours",
        emoji: "🌧️",
        description: "Soothing nature ambience"
    },
    {
        name: "Classical Focus",
        query: "classical music for studying concentration",
        emoji: "🎼",
        description: "Classical pieces for productivity"
    },
    {
        name: "Cafe Ambience",
        query: "coffee shop background noise study",
        emoji: "☕",
        description: "Cafe atmosphere for work"
    },
    {
        name: "Ocean Waves",
        query: "ocean waves sounds meditation",
        emoji: "🌊",
        description: "Calming ocean waves"
    }
];

export default function YoutubePlayer({ onVideoStateChange }: YoutubePlayerProps) {
    const [query, setQuery] = useState<string>("");
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [results, setResults] = useState<any>([]);
    const [volume, setVolume] = useState<number>(50);
    const [videoOpacity, setVideoOpacity] = useState<number>(100);
    const [showCurated, setShowCurated] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);

    // Notify parent when video state changes
    useEffect(() => {
        onVideoStateChange?.(!!selectedVideo);
    }, [selectedVideo, onVideoStateChange]);

    const handleSearch = async (searchQuery: string) => {
        setLoading(true);
        try {
            const res = await fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&key=${apiKey}&type=video&maxResults=10`);
            const data = await res.json();
            if (Array.isArray(data.items)) {
                setResults(data.items);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = (videoId: string) : void => {
        setSelectedVideo(videoId); 
        setResults([]);
        setShowCurated(false);
        setVideoOpacity(100); // Reset opacity when new video starts
    };

    const handleCuratedPlaylist = async (playlist: CuratedPlaylist) => {
        setLoading(true);
        await handleSearch(playlist.query);
        setShowCurated(false);
    };

    const fadeVideo = (targetOpacity: number) => {
        const steps = 10;
        const opacityStep = (targetOpacity - videoOpacity) / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            setVideoOpacity(prev => Math.max(0, Math.min(100, prev + opacityStep)));
            
            if (currentStep >= steps) {
                setVideoOpacity(targetOpacity);
                clearInterval(fadeInterval);
            }
        }, 100);
    };

    return (
        <div className="youtube-player-container">
            {!selectedVideo && (
                <>
                    {showCurated && (
                        <div className="curated-playlists">
                            <div className="search-toggle">
                                <button 
                                    onClick={() => setShowCurated(false)}
                                    className="custom-search-btn"
                                >
                                    🔍 Custom Search
                                </button>
                            </div>
                            <div className="playlist-grid">
                                {curatedPlaylists.map((playlist, index) => (
                                    <div
                                        key={index}
                                        className="playlist-card"
                                        onClick={() => handleCuratedPlaylist(playlist)}
                                    >
                                        <div className="playlist-emoji">{playlist.emoji}</div>
                                        <div className="playlist-info">
                                            <h4>{playlist.name}</h4>
                                            <p>{playlist.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!showCurated && (
                        <div className="youtube-player-search">
                            <input
                                type="text"
                                placeholder="Search relaxing ambient sounds..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="youtube-player-search-input"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
                            />
                            <button 
                                onClick={() => handleSearch(query)} 
                                className="youtube-player-search-button"
                                disabled={loading}
                            >
                                {loading ? "🔍" : "Search"}
                            </button>
                            <button 
                                onClick={() => setShowCurated(true)}
                                className="back-to-curated-btn"
                            >
                                📚 Back to Playlists
                            </button>
                        </div>
                    )}
                </>
            )}

      {!selectedVideo && results.length > 0 && (
        <div className="youtube-player-results">
          {results.map((result: any) => (
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
                        src="https://pngimg.com/d/monitor_PNG101663.png"
                        alt="Monitor"
                        className="youtube-monitor-image"
                    />
                    

                    {/* Video Visibility Controls */}
                    <div className="fade-controls">
                        <button 
                            onClick={() => fadeVideo(20)}
                            className="fade-btn"
                        >
                            👁️ Fade Out
                        </button>
                        <button 
                            onClick={() => fadeVideo(100)}
                            className="fade-btn"
                        >
                            👁️ Fade In
                        </button>
                    </div>

                    <button 
                        onClick={() => {
                            setSelectedVideo(null);
                            setResults([]);
                            setShowCurated(true);
                            setVideoOpacity(100);
                        }}
                        className="retry-button"
                    >
                        <img
                        src="https://png.pngtree.com/png-vector/20220608/ourmid/pngtree-reload-icon-retry-restart-recover-png-image_4891515.png"
                        alt="Retry"
                        />
                    </button>
                    
                    <div className="youtube-player-on-monitor">
                        <iframe
                            className="youtube-player-video"
                            src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                                opacity: videoOpacity / 100,
                                transition: 'opacity 0.1s ease'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}