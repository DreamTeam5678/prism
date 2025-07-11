import "./Welcome.css";

export default function Welcome() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold">Welcome to Prism</h1>
            <p className="text-xl">
                Prism is a task management app that helps you stay organized and
                focused. With Prism, you can create tasks, set due dates, and
                assign them to specific users. You can also set reminders and
                notifications to ensure that you never miss a deadline.
            </p>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Get Started
            </button>
        </div>
    );
}


