import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "path";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const taskId = parseInt(req.query.id as string);
    if (req.method === "PUT") {
        const { text, completed, priority } = req.body;
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: { text, completed, priority },
        });
        res.status(200).json(updatedTask);
    } else if (req.method === "DELETE") {
        await prisma.task.delete({ where: { id: taskId } });
        res.status(204).end();
    } else if (req.method ===  "GET") {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.status(200).json(task);
    } else {
        res.setHeader("Allow", ["PUT", "DELETE", "GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
export const config = {
    api: {
        bodyParser: {
            sizeLimit: "1mb", // Adjust as needed
        },
    },
};