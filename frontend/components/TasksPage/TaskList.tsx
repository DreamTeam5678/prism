
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
   



    useEffect(() => {
        fetch("http://localhost:3000/api/tasks", { credentials: "include" })
            .then((response) => response.json())
            .then((data) => {
                setTasks(data);
            })
            .catch((error) => {
                console.error("Error fetching tasks:", error);
            });
    }, []);

    const addTask = (): void => {
        if (!newTaskText.trim()) return;
        const res = fetch("http://localhost:3000/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: newTaskText, completed: false }),
        });

        res.then(response => response.json())
            .then(data => {
                setTasks([...tasks, data]);
                setNewTaskText("");
            })
            .catch(error => {
                console.error("Error adding task:", error);
            });
    };

    const toggleTaskCompletion = async(id: number) => {
        const task = tasks.find(task => task.id === id);
        if (!task) return;
        
        const res = await fetch(`http://localhost:3000/api/tasks/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: task.text, completed: !task.completed }),
        });

        const updatedTask = await res.json();
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, completed: updatedTask.completed } : task
        ));

        console.log("Task completion toggled:", id);
        console.log("Updated task:", updatedTask);
        setNewTaskText("");
        setEditTaskId(null);
        setEditTaskText("");
    };

    const deleteTask = async (id: number) => {
        await fetch(`http://localhost:3000/api/tasks/${id}`, {
            method: "DELETE",
        });

        setTasks(tasks.filter(task => task.id !== id));
        
        console.log("Task deleted:", id);
    };

    const startEditTask = (task: Task): void => {
        setEditTaskId(task.id);
        setEditTaskText(task.text);
    };

    const saveEditedTask = (): void => {
        const res = fetch(`http://localhost:3000/api/tasks/${editTaskId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: editTaskText, completed: false }),
        });

        res.then(response => response.json())
            .then(data => {
                setTasks(tasks.map(task => 
                    task.id === editTaskId ? { ...task, text: data.text } : task
                ));
                setEditTaskId(null);
                setEditTaskText("");
            })
            .catch(error => {
                console.error("Error updating task:", error);
            });
       
        console.log("Task updated:", editTaskId);
        
        
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