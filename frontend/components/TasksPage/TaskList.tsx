
"use client";


import { useState, useEffect, KeyboardEvent } from "react";

interface Task {
    id: number;
    text: string;
    completed: boolean;
}

export default function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskText, setNewTaskText] = useState<string>("");
    const [editTaskId, setEditTaskId] = useState<number | null>(null);
    const [editTaskText, setEditTaskText] = useState<string>("");
    const [isMounted, setIsMounted] = useState<boolean>(false);

    useEffect(() => {
        setIsMounted(true);
        const savedTasks = localStorage.getItem("tasks");
        if (savedTasks) {
            setTasks(JSON.parse(savedTasks));
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem("tasks", JSON.stringify(tasks));
        }
    }, [tasks, isMounted]);

    const addTask = (): void => {
        if (newTaskText.trim() !== "") {
            setTasks([...tasks, { id: Date.now(), text: newTaskText, completed: false }]);
            setNewTaskText("");
        }
    };

    const toggleTaskCompletion = (id: number): void => {
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const deleteTask = (id: number): void => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const startEditTask = (task: Task): void => {
        setEditTaskId(task.id);
        setEditTaskText(task.text);
    };

    const saveEditedTask = (): void => {
        if (editTaskText.trim() === "") return;
        setTasks(tasks.map(task => 
            task.id === editTaskId ? { ...task, text: editTaskText } : task
        ));
        setEditTaskId(null);
        setEditTaskText("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "Enter") {
            addTask();
        }
    };

    const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "Enter") {
            saveEditedTask();
        }
    };

    return (
        <div className="task-list-container">
            <h1 className="task-list-title">Your Tasks</h1>
            <div className="task-list">
                {tasks.map((task) => (
                    <div key={task.id} className="task-item">
                        <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(task.id)}
                        />
                        <div className="task-item-title">
                            {task.text}
                        </div>
                        <div className="task-item-time">
                            {task.completed ? "Completed" : "Not Completed"}
                        </div>
                        <div className="task-item-desc">
                            <button className="task-item-edit" onClick={() => startEditTask(task)}>Edit</button>
                            <button className="task-item-delete" onClick={() => deleteTask(task.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="task-input-container">
                <input
                    type="text"
                    placeholder="Add a new task..."
                    className="task-input"
                    value={newTaskText}
                    onChange={(event) => setNewTaskText(event.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button className="add-task-button" onClick={addTask}>Add Task</button>
            </div>

            {editTaskId !== null && (
                <div className="task-edit-container">
                    <input
                        type="text"
                        placeholder="Edit task..."
                        className="task-input"
                        value={editTaskText}
                        onChange={(event) => setEditTaskText(event.target.value)}
                        onKeyDown={handleEditKeyDown}
                    />
                    <button className="add-task-button" onClick={saveEditedTask}>Save</button>
                </div>
            )}
        </div>
    );
}
