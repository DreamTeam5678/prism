// pages/api/calendar/add.ts
/*
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma";
import { inferDuration } from '@/lib/utils/inferDuration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  const { suggestions, tasks } = req.body;

  if (!Array.isArray(suggestions) || !Array.isArray(tasks)) {
    return res.status(400).json({ message: "Suggestions and tasks must be arrays" });
  }

  try {
    const allEntries: {
      userId: string;
      title: string;
      start: Date;
      end: Date;
      source: string;
      color: string | null;
      createdAt: Date;
    }[] = [];

    const existingEvents = await prisma.calendarEvent.findMany({
      where: { userId: user.id },
      orderBy: { start: "asc" },
    });

    const getNextAvailableSlot = (
      existingEvents: { start: Date; end: Date }[],
      durationMinutes: number,
      priority: "High" | "Medium" | "Low"
    ): { start: Date; end: Date } | null => {
      const bufferMs = 5 * 60 * 1000;
      const now = new Date();

      const dayStart = new Date();
      dayStart.setHours(8, 0, 0, 0);

      const dayEnd = new Date();
      dayEnd.setHours(21, 0, 0, 0);

      // Clamp earliest candidate start time based on priority
      let candidate = new Date(Math.max(dayStart.getTime(), now.getTime() + 15 * 60 * 1000)); // 15-min prep buffer

      // Prioritize high priority tasks earlier in the day
      if (priority === "High") {
        candidate.setHours(8, 0, 0, 0);
      } else if (priority === "Medium") {
        candidate.setHours(10, 0, 0, 0);
      } else {
        candidate.setHours(13, 0, 0, 0); // Low priority: start looking mid-day
      }

      const latestStart = new Date(dayEnd.getTime() - durationMinutes * 60 * 1000);

      // Sort events by start time
      const sortedEvents = [...existingEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      while (candidate <= latestStart) {
        let hasConflict = false;

        for (const event of sortedEvents) {
          const eventStart = new Date(event.start).getTime();
          const eventEnd = new Date(event.end).getTime();
          const candidateStart = candidate.getTime();
          const candidateEnd = candidateStart + durationMinutes * 60 * 1000;

          if (candidateEnd + bufferMs > eventStart && candidateStart < eventEnd + bufferMs) {
            candidate = new Date(Math.max(candidateEnd + bufferMs, eventEnd + bufferMs));
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict && candidate <= latestStart) {
          return {
            start: new Date(candidate),
            end: new Date(candidate.getTime() + durationMinutes * 60 * 1000),
          };
        }
      }

      return null; // No slot found
    };

  const getPriority = (suggestion: any): "High" | "Medium" | "Low" => {
    if (suggestion.priority === "High") return "High";
    if (suggestion.priority === "Medium") return "Medium";
    return "Low";
  };

    // Get all today's calendar event titles for this user
    const calendarTitlesToday = existingEvents
      .filter(e => {
        const eventDate = new Date(e.start).toDateString();
        return eventDate === new Date().toDateString();
      })
      .map(e => e.title?.toLowerCase());


    for (const t of tasks) {
      const normalizedTitle = (t.title || "").toLowerCase();
      if (calendarTitlesToday.includes(normalizedTitle)) continue;
      const priority = t.priority || "Medium";
      const duration = inferDuration(t.title, priority);
      const slot = getNextAvailableSlot(existingEvents, duration, priority as "High" | "Medium" | "Low");

      if (!slot) continue;

      existingEvents.push({ start: slot.start, end: slot.end } as any);
      allEntries.push({
        userId: user.id,
        title: t.title || "Task",
        start: slot.start,
        end: slot.end,
        source: "task",
        color: "#ebdbb4",
        createdAt: new Date(),
      });
    }


    const created = await prisma.calendarEvent.createMany({
      data: allEntries,
      skipDuplicates: true, 
    });

    return res.status(200).json({ message: "Calendar entries added", count: created.count });
  } catch (e) {
    console.error("❌ Failed to add to calendar:", e);
    return res.status(500).json({ message: "Server error" });
  }
}
*/
// pages/api/calendar/add.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma";
import { inferDuration } from '@/lib/utils/inferDuration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  const { suggestions, tasks } = req.body;

  if (!Array.isArray(suggestions) || !Array.isArray(tasks)) {
    return res.status(400).json({ message: "Suggestions and tasks must be arrays" });
  }

  // pages/api/calendar/add.ts
// ... in the default export handler function ...
   try {
     // Retrieve all existing calendar events for the user (Google, previous suggestions/tasks)
     const existingEvents = await prisma.calendarEvent.findMany({
       where: { userId: user.id },
       orderBy: { start: "asc" },
     });

     // This function will find the next available slot based on a set of existing events
     const getNextAvailableSlot = (
       currentOccupiedSlots: { start: Date; end: Date }[], // Pass in the current list of occupied slots
       durationMinutes: number,
       priority: "High" | "Medium" | "Low"
     ): { start: Date; end: Date } | null => {
       const bufferMs = 30 * 60 * 1000; // 30-minute buffer
       const now = new Date(); // Current time

       const dayStart = new Date();
       dayStart.setHours(8, 0, 0, 0); // 8:00 AM today

       const dayEnd = new Date();
       dayEnd.setHours(21, 0, 0, 0); // 9:00 PM today

       // Adjust initial candidate start time based on priority and current time
       let candidate = new Date(Math.max(dayStart.getTime(), now.getTime() + bufferMs)); // Start no earlier than 8 AM or 30 mins from now

       // For high priority tasks, try to push them earlier in the day if possible,
       // but not before the current time + buffer.
       if (priority === "High") {
         const earliestHighPriStart = new Date();
         earliestHighPriStart.setHours(8, 0, 0, 0);
         candidate = new Date(Math.max(candidate.getTime(), earliestHighPriStart.getTime()));
       }

       const latestStart = new Date(dayEnd.getTime() - durationMinutes * 60 * 1000); // latest possible start time to end by 9 PM

       const sortedEvents = [...currentOccupiedSlots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

       while (candidate.getTime() + durationMinutes * 60 * 1000 <= dayEnd.getTime()) { // Ensure candidate + duration doesn't exceed 9 PM
         let hasConflict = false;
         const candidateEnd = new Date(candidate.getTime() + durationMinutes * 60 * 1000);

         // Check for lunch break
         const lunchStart = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate(), 12, 0, 0);
         const lunchEnd = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate(), 13, 0, 0);

         if (
           (candidateEnd.getTime() > lunchStart.getTime() && candidate.getTime() < lunchEnd.getTime())
         ) {
           candidate = new Date(lunchEnd.getTime() + bufferMs); // Jump past lunch break + buffer
           hasConflict = true;
           continue; // Restart loop with new candidate time
         }

         // Check for conflicts with existing events (including new ones added)
         for (const event of sortedEvents) {
           const eventStart = new Date(event.start).getTime();
           const eventEnd = new Date(event.end).getTime();

           // Conflict if candidate overlaps existing event AND buffer
           if (
             candidateEnd.getTime() + bufferMs > eventStart &&
             candidate.getTime() < eventEnd + bufferMs
           ) {
             candidate = new Date(eventEnd + bufferMs); // Jump past conflicting event + buffer
             hasConflict = true;
             break; // Found a conflict, break inner loop and re-evaluate outer while loop
           }
         }

         if (!hasConflict && candidateEnd.getTime() <= dayEnd.getTime()) { // Ensure slot doesn't go past dayEnd
           return {
             start: candidate,
             end: candidateEnd,
           };
         }

         if (!hasConflict) { // If no conflict, increment to check next small slot
           candidate = new Date(candidate.getTime() + 15 * 60 * 1000); // Move to next 15-min slot
         }
       }

       return null; // No available slot found
     };

     const getPriorityValue = (priority: "High" | "Medium" | "Low"): number => {
       const priorityOrder: { [key: string]: number } = { High: 3, Medium: 2, Low: 1 };
       return priorityOrder[priority] || 1;
     };

     // Prepare arrays for scheduling
     const tasksToSchedule = [...tasks].sort((a: any, b: any) =>
       getPriorityValue(b.priority) - getPriorityValue(a.priority)
     );

     const suggestionsToSchedule = [...suggestions].sort((a: any, b: any) =>
       getPriorityValue(b.priority) - getPriorityValue(a.priority)
     );

     // All events that are already on the calendar (Google events, etc.)
     const occupiedSlots: { start: Date; end: Date }[] = existingEvents.map(event => ({
       start: event.start,
       end: event.end,
     }));

     const newScheduledEntries: any[] = []; // To store newly scheduled tasks and suggestions

     // STEP 1: Schedule Task Bank Items (prioritized)
     for (const task of tasksToSchedule) {
       const duration = inferDuration(task.title, task.priority);
       const slot = getNextAvailableSlot(occupiedSlots, duration, task.priority);

       if (slot) {
         newScheduledEntries.push({
           userId: user.id,
           title: task.title,
           start: slot.start,
           end: slot.end,
           source: "task_bank",
           color: "#ebdbb4",
           createdAt: new Date(),
         });
         occupiedSlots.push(slot);
         await prisma.task.updateMany({
           where:{
            userId: user.id,
            title: task.title,
            scheduled: false
           },
           data: {
             scheduled: true,
             timestamp: slot.start
           }
         });
         occupiedSlots.sort((a, b) => a.start.getTime() - b.start.getTime()); // Keep sorted
       } else {
         console.warn(`Could not schedule Task Bank item: ${task.title}`);
       }
     }

     // STEP 2: Integrate GPT Suggestions (already have specific times from GPT)
     // We need to validate GPT suggestions against all occupied slots (existing + new tasks)
     for (const suggestion of suggestionsToSchedule) {
       const suggestionStart = new Date(suggestion.start);
       const suggestionEnd = new Date(suggestion.end);
       const bufferMs = 30 * 60 * 1000;

       let isValidSuggestion = true;
       for (const occupied of occupiedSlots) {
         const occupiedStart = occupied.start;
         const occupiedEnd = occupied.end;

         // Check for overlap with buffer
         if (
           suggestionEnd.getTime() + bufferMs > occupiedStart.getTime() &&
           suggestionStart.getTime() < occupiedEnd.getTime() + bufferMs
         ) {
           console.warn(`GPT suggestion conflict: "${suggestion.suggestionText}" overlaps with an existing event or scheduled task.`);
           isValidSuggestion = false;
           break;
         }

            // Also check for the 12-1 PM lunch break explicitely for GPT suggestions
            const lunchStart = new Date(suggestionStart.getFullYear(), suggestionStart.getMonth(), suggestionStart.getDate(), 12, 0, 0);
            const lunchEnd = new Date(suggestionStart.getFullYear(), suggestionStart.getMonth(), suggestionStart.getDate(), 13, 0, 0);

            if (
                (suggestionEnd.getTime() > lunchStart.getTime() && suggestionStart.getTime() < lunchEnd.getTime())
            ) {
                console.warn(`GPT suggestion conflict: "${suggestion.suggestionText}" overlaps with the lunch break.`);
                isValidSuggestion = false;
                break;
            }
       }

       if (isValidSuggestion) {
         newScheduledEntries.push({
           userId: user.id,
           title: suggestion.suggestionText,
           start: suggestionStart,
           end: suggestionEnd,
           source: "gpt",
           color: "#9b87a6",
           createdAt: new Date(),
         });
         occupiedSlots.push({ start: suggestionStart, end: suggestionEnd }); // Add to occupied slots
         occupiedSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
       } else {
         // Optionally, you might want to send a different message to the client
         // if a suggestion couldn't be scheduled.
       }
     }

     // Finally, save all newly scheduled entries to the database
     if (newScheduledEntries.length > 0) {
       await prisma.calendarEvent.createMany({
         data: newScheduledEntries,
         skipDuplicates: true, // In case of rapid submissions
       });
     }

     res.status(200).json({ message: "Calendar updated successfully" });
   } catch (error) {
     console.error("Failed to add calendar entries:", error);
     res.status(500).json({ message: "Failed to update calendar" });
   }
    
}