// pages/api/calendar/add.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma";
import { inferDuration } from '@/lib/utils/inferDuration';
import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';

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
    // Retrieve all existing calendar events for the user (local database)
    const localEvents = await prisma.calendarEvent.findMany({
      where: { userId: user.id },
      orderBy: { start: "asc" },
    });

    // Get Google Calendar events
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = token?.accessToken as string | undefined;
    const googleEvents = await fetchGoogleCalendarEvents(accessToken);

    // Combine all events for conflict detection, but filter out 0-minute events and all-day events
    const validGoogleEvents = googleEvents.filter(event => {
      const duration = event.end.getTime() - event.start.getTime();
      const isZeroMinute = duration === 0;
      const isAllDay = duration >= 24 * 60 * 60 * 1000; // 24 hours or more
      const isValid = !isZeroMinute && !isAllDay; // Only include events that have real duration
      
      if (!isValid) {
        if (isZeroMinute) {
          console.log(`🚫 Filtering out 0-minute event: ${event.title} (${event.start.toLocaleTimeString()}-${event.end.toLocaleTimeString()})`);
        } else if (isAllDay) {
          console.log(`🚫 Filtering out all-day event: ${event.title} (${event.start.toLocaleTimeString()}-${event.end.toLocaleTimeString()}) duration: ${duration}ms`);
        }
      } else {
        console.log(`✅ Keeping valid event: ${event.title} (${event.start.toLocaleTimeString()}-${event.end.toLocaleTimeString()}) duration: ${duration}ms`);
      }
      return isValid;
    });
    
    const existingEvents = [...localEvents, ...validGoogleEvents];

    console.log(`📊 Found ${localEvents.length} local events and ${validGoogleEvents.length} valid Google events for conflict detection (filtered out ${googleEvents.length - validGoogleEvents.length} 0-minute events)`);

    // This function will find the next available slot based on a set of existing events
    const getNextAvailableSlot = (
      currentOccupiedSlots: { start: Date; end: Date }[], // Pass in the current list of occupied slots
      durationMinutes: number,
      priority: "High" | "Medium" | "Low"
    ): { start: Date; end: Date } | null => {
      const bufferMs = 15 * 60 * 1000; // Reduced buffer to 15 minutes
      const now = new Date(); // Current time

      // Check if it's too late today (after 10 PM)
      const isLateToday = now.getHours() >= 22;
      
      if (isLateToday) {
        // Schedule for tomorrow with better time distribution
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let tomorrowStart;
        if (priority === "High") {
          tomorrowStart = new Date(tomorrow);
          tomorrowStart.setHours(8, 0, 0, 0); // 8:00 AM
        } else if (priority === "Medium") {
          tomorrowStart = new Date(tomorrow);
          tomorrowStart.setHours(13, 0, 0, 0); // 1:00 PM (after lunch)
        } else {
          tomorrowStart = new Date(tomorrow);
          tomorrowStart.setHours(16, 0, 0, 0); // 4:00 PM
        }
        
        const tomorrowEnd = new Date(tomorrowStart.getTime() + durationMinutes * 60 * 1000);
        return { start: tomorrowStart, end: tomorrowEnd };
      }

      const dayStart = new Date();
      dayStart.setHours(8, 0, 0, 0); // 8:00 AM today

      const dayEnd = new Date();
      dayEnd.setHours(22, 0, 0, 0); // 10:00 PM today

      // Adjust initial candidate start time based on priority and current time
      let candidate = new Date(Math.max(dayStart.getTime(), now.getTime() + bufferMs)); // Start no earlier than 8 AM or 15 mins from now

      // For high priority tasks, try to push them earlier in the day if possible,
      // but not before the current time + buffer.
      if (priority === "High") {
        const earliestHighPriStart = new Date();
        earliestHighPriStart.setHours(8, 0, 0, 0);
        candidate = new Date(Math.max(candidate.getTime(), earliestHighPriStart.getTime()));
      }

      const latestStart = new Date(dayEnd.getTime() - durationMinutes * 60 * 1000); // latest possible start time to end by 10 PM

      const sortedEvents = [...currentOccupiedSlots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      while (candidate.getTime() + durationMinutes * 60 * 1000 <= dayEnd.getTime()) { // Ensure candidate + duration doesn't exceed 10 PM
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
          candidate = new Date(candidate.getTime() + 30 * 60 * 1000); // Move to next 30-min slot for better spacing
        }
      }

      // If no slots found today, try to find any available time, even if it's tight
      console.log(`⚠️ No ideal slots found for ${durationMinutes}min task, trying to find any available time`);
      
      // Try to squeeze it in between existing events, but only before 10 PM
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const currentEvent = sortedEvents[i];
        const nextEvent = sortedEvents[i + 1];
        
        const gapStart = new Date(currentEvent.end.getTime() + bufferMs);
        const gapEnd = new Date(nextEvent.start.getTime() - bufferMs);
        const gapDuration = gapEnd.getTime() - gapStart.getTime();
        
        // Only schedule if the slot ends before 10 PM
        const slotEnd = new Date(gapStart.getTime() + durationMinutes * 60 * 1000);
        if (gapDuration >= durationMinutes * 60 * 1000 && slotEnd.getTime() <= dayEnd.getTime()) {
          console.log(`✅ Found tight slot: ${gapStart.toLocaleTimeString()}-${slotEnd.toLocaleTimeString()}`);
          return {
            start: gapStart,
            end: slotEnd,
          };
        }
      }
      
      // If still no slots, return null
      console.log(`❌ No available slots found for ${durationMinutes}min task (must end before 10 PM)`);
      return null;
    };

    const getPriorityValue = (priority: "High" | "Medium" | "Low"): number => {
      const priorityOrder: { [key: string]: number } = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[priority] || 1;
    };

    // Helper to capitalize priority
    function capitalizePriority(priority: string): "High" | "Medium" | "Low" {
      if (priority.toLowerCase() === 'high') return 'High';
      if (priority.toLowerCase() === 'medium') return 'Medium';
      return 'Low';
    }

    // Prepare arrays for scheduling - sort by priority (High first, then Medium, then Low)
    const tasksToSchedule = [...tasks].sort((a: any, b: any) => {
      const priorityA = getPriorityValue(capitalizePriority(a.priority));
      const priorityB = getPriorityValue(capitalizePriority(b.priority));
      console.log(`🔍 Sorting: ${a.title} (${a.priority} = ${priorityA}) vs ${b.title} (${b.priority} = ${priorityB})`);
      return priorityB - priorityA; // High priority first
    });
    
    console.log(`📋 Task bank tasks sorted by priority:`, tasksToSchedule.map(t => `${t.title} (${t.priority})`));

    // All events that are already on the calendar (Google events, etc.)
    const occupiedSlots: { start: Date; end: Date }[] = existingEvents.map(event => ({
      start: event.start,
      end: event.end,
    }));
    
    console.log(`📅 Occupied slots after filtering:`, occupiedSlots.map(s => `${s.start.toLocaleTimeString()}-${s.end.toLocaleTimeString()}`));
    console.log(`🔍 Debug: existingEvents count: ${existingEvents.length}, validGoogleEvents count: ${validGoogleEvents.length}, localEvents count: ${localEvents.length}`);

    const newScheduledEntries: any[] = []; // To store newly scheduled tasks and suggestions

    // STEP 1: Schedule Task Bank Items (prioritized)
    console.log(`📋 Scheduling ${tasksToSchedule.length} task bank tasks:`, tasksToSchedule.map(t => `${t.title} (${t.priority})`));
    const unscheduledTasks = [];
    for (const task of tasksToSchedule) {
      console.log(`🔍 Processing task: ${task.title} (${task.priority})`);
      
      // Check if task is already scheduled
      const existingTask = await prisma.task.findFirst({
        where: {
          userId: user.id,
          title: task.title,
          scheduled: true
        }
      });
      
      if (existingTask) {
        console.warn(`Task "${task.title}" is already scheduled, skipping.`);
        continue;
      }

      const duration = inferDuration(task.title, capitalizePriority(task.priority));
      console.log(`⏱️ Task duration: ${duration} minutes`);
      console.log(`📅 Current occupied slots: ${occupiedSlots.length}`, occupiedSlots.map(s => `${s.start.toLocaleTimeString()}-${s.end.toLocaleTimeString()}`));
      
      const slot = getNextAvailableSlot(occupiedSlots, duration, capitalizePriority(task.priority));

      if (slot) {
        console.log(`✅ Scheduled task "${task.title}" at ${slot.start.toLocaleTimeString()}-${slot.end.toLocaleTimeString()}`);
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
        console.log(`📈 Updated occupied slots: ${occupiedSlots.length}`, occupiedSlots.map(s => `${s.start.toLocaleTimeString()}-${s.end.toLocaleTimeString()}`));
      } else {
        console.warn(`❌ Could not schedule Task Bank item: ${task.title} - no available slots today`);
        unscheduledTasks.push(task.title);
      }
    }

    // STEP 2: Integrate GPT Suggestions (already have specific times from GPT)
    // We need to validate GPT suggestions against all occupied slots (existing + new tasks)
    for (const suggestion of suggestions) {
      const suggestionStart = new Date(suggestion.start);
      const suggestionEnd = new Date(suggestion.end);
      const bufferMs = 20 * 60 * 1000;

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

    // Determine response message based on scheduling results
    let message = "Calendar updated successfully";
    if (unscheduledTasks.length > 0) {
      message = `Your day is already optimized! ${unscheduledTasks.length} task(s) couldn't be scheduled due to no available slots: ${unscheduledTasks.join(', ')}`;
    } else if (newScheduledEntries.length === 0) {
      message = "Your day is already optimized - no new tasks could be scheduled";
    }

    res.status(200).json({ 
      message,
      scheduledTasks: newScheduledEntries.map(entry => entry.title),
      failedTasks: unscheduledTasks,
      totalScheduled: newScheduledEntries.length,
      totalFailed: unscheduledTasks.length
    });
  } catch (error) {
    console.error("Failed to add calendar entries:", error);
    res.status(500).json({ message: "Failed to update calendar" });
  }
    
}

// Helper function to fetch Google Calendar events
async function fetchGoogleCalendarEvents(accessToken?: string) {
  if (!accessToken) {
    console.warn("⚠️ No Google access token available");
    return [];
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    console.log('🔑 Using access token for task bank conflict detection:', accessToken);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    return (response.data.items || []).map((event) => ({
      id: event.id,
      title: event.summary || "Untitled",
      start: new Date(event.start?.dateTime || event.start?.date || ""),
      end: new Date(event.end?.dateTime || event.end?.date || ""),
      source: "google",
    }));
  } catch (err) {
    console.error("❌ Error fetching Google events for task bank conflict detection:", err);
    return []; // Don't crash everything — fallback to DB events only
  }
}