export default function SpotifyPlayer() {
    return (
        <div className="spotify-player">
            <iframe
                src="https://open.spotify.com/embed/playlist/37i9dQZF1DX1d3o2f3l8hD?utm_source=generator"
                width="100%"
                height="152"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
            ></iframe>
        </div>
    );
}