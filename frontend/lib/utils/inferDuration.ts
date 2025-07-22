//frontend/lib/utils/inferDuration.ts
export function inferDuration(taskTitle: string, priority: string): number {
  const title = (taskTitle || "").toLowerCase();

  if (title.includes("walk") || title.includes("call") || title.includes("email")) return 30;
  if (title.includes("meditate") || title.includes("journal")) return 15;
  if (title.includes("brainstorm") || title.includes("read") || title.includes("design")) return 45;
  if (priority === "High") return 60;
  if (priority === "Medium") return 45;
  return 30;
}
