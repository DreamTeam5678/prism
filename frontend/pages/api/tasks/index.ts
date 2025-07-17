import type { NextApiRequest, NextApiResponse } from "next";

let tasks: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    res.status(200).json(tasks);
  } else if (req.method === "POST") {
    const { text, completed, priority } = req.body;
    const newTask = {
      id: Date.now(),
      text,
      completed,
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}