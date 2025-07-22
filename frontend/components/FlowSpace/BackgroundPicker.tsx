const backgrounds = [
   'https://i.pinimg.com/originals/08/e5/97/08e597e1addb5f2aab9ae3ac4820b285.gif',
    'https://i.pinimg.com/originals/08/e5/97/08e597e1addb5f2aab9ae3ac4820b285.gif',
    'https://i.pinimg.com/originals/08/e5/97/08e597e1addb5f2aab9ae3ac4820b285.gif',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80'
];

export default function BackgroundPicker({current, onChange}) {
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