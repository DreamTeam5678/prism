const backgrounds = [
  //aesthetic animations:
  "https://images.unsplash.com/photo-1587228768877-d1d5f2a2b4e8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
  "https://images.unsplash.com/photo-1587228768877-d1d5f2a2b4e8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",

//nature:
  "https://images.unsplash.com/photo-1620255884029-d1b1e4c2b3b8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
  "https://images.unsplash.com/photo-1620255884029-d1b1e4c2b3b8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
];

export default function BackgroundPicker({current, onChange})) {
    return (
        <div className="background-picker">
            {backgrounds.map((url, index) => (
                <div
                    key={index}
                    className={`background-picker-item ${current === index ? "selected" : ""}`}
                    onClick={() => onChange(index)}
                >                    
                    <img src={url} alt="Background" />
                </div>
            ))}
        </div>
    );
}