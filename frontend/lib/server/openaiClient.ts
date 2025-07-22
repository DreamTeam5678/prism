// frontend/lib/server/openaiClient.ts
import { OpenAI } from 'openai';
import moment from 'moment-timezone';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CalendarEvent {
  start: string;
  end: string;
  title?: string;
}

interface TaskScheduleInput {
  taskTitle: string;
  priority: 'High' | 'Medium' | 'Low';
  durationMinutes: number;
  mood?: string;
  events: CalendarEvent[];
  retryHint?: string;
}

interface Suggestion {
  task: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
}

function validateTimeZone(timeZone: string): string {
  const validTimeZones = moment.tz.names();
  if (validTimeZones.includes(timeZone)) {
    return timeZone;
  }
  console.warn(`⚠️ Invalid time zone: ${timeZone}. Falling back to UTC.`);
  return 'UTC';
}

export async function getTaskSchedule({
  taskTitle,
  priority,
  durationMinutes,
  mood,
  events,
  timeZone,
  retryHint,
}: TaskScheduleInput & { timeZone: string }) {
  const validatedTimeZone = validateTimeZone(timeZone);
  const now = moment.tz(validatedTimeZone);
  const today = now.clone().startOf('day');
  const minAllowedStartOfDay = today.clone().hour(8); // 8:00 AM today
  const maxAllowedEndOfDay = today.clone().hour(21); // 9:00 PM today
  const earliestPossibleStartTime = now.clone().add(30, 'minutes');

  const prompt = `
    You are an intelligent scheduling assistant. Based on the user's current calendar and emotional state, find a time slot **today** to schedule the following task:

    Task: ${taskTitle}
    Duration: ${durationMinutes} minutes
    Priority: ${priority}

    User’s calendar:
    ${events.map((e, i) => `Event ${i + 1}: ${e.start} to ${e.end}`).join('\n')}

    Rules:
    - Do NOT suggest a time earlier than ${earliestPossibleStartTime.format("h:mm A")} (30-minute prep buffer from now)
    - Do NOT schedule before 8:00 AM or after 9:00 PM
    - Do NOT schedule anything from 12:00 PM to 1:00 PM
    - There must be a **strict 30-minute gap** before any new task and after any existing event.
    - There must be a **strict 30-minute gap** after any new task and before any existing event.
    - Example 1: If an existing event ends at 3:00 PM, a new task cannot start before 3:30 PM.
    - Example 2: If an existing event starts at 4:00 PM, a new task cannot end after 3:30 PM.
    - A new task must NOT overlap at all with any existing event or these 30-minute buffer zones.
    - Prioritize earlier hours for high-priority tasks
    - Only schedule today (${now.format('YYYY-MM-DD')})
    - Use timezone: ${validatedTimeZone}
    ${retryHint ? `\n\n⚠️ Note: A previous suggestion was invalid. ${retryHint}` : ''}
    Respond in JSON like:
    {"recommendedStart": "2025-07-21T13:00:00-07:00", "recommendedEnd": "...", "reason": "..."}
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful scheduling assistant that returns JSON responses only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    const cleaned = raw.trim().replace(/^```json\s*|\s*```$/g, '');
    const parsed = JSON.parse(cleaned);

    const parsedStart = parsed.recommendedStart;
    const parsedEnd = parsed.recommendedEnd;

    if (
      !parsedStart ||
      !parsedEnd ||
      isNaN(Date.parse(parsedStart)) ||
      isNaN(Date.parse(parsedEnd))
    ) {
      console.warn("⚠️ GPT could not schedule the task:", parsed.reason || "No time slot available");
      return {
        recommendedStart: null,
        recommendedEnd: null,
        reason: parsed.reason || "No time slot available today",
      };
    }
    

    const startTime = moment(parsedStart);
    const endTime = moment(parsedEnd);

    const maxPossibleStartTime = maxAllowedEndOfDay.clone().subtract(durationMinutes, 'minutes');

    if (
      startTime.isBefore(earliestPossibleStartTime, 'minute') || // FIX 1: Compare by minute
      startTime.isBefore(minAllowedStartOfDay) || 
      startTime.isAfter(maxPossibleStartTime) ||
      startTime.format('YYYY-MM-DD') !== now.format('YYYY-MM-DD') || 
      endTime.format('YYYY-MM-DD') !== now.format('YYYY-MM-DD')   
    
    ) {
      console.warn(`⚠️ GPT suggestion time is invalid: ${startTime.format()} → ${endTime.format()}`);
      return {
        recommendedStart: null,
        recommendedEnd: null,
        reason: "Time slot is outside of today or allowed window",
      };
    }

    const lunchStartToday = today.clone().hour(12);
    const lunchEndToday = today.clone().hour(13);

    if (
      (startTime.isBetween(lunchStartToday, lunchEndToday, null, '[]')) ||
      (endTime.isBetween(lunchStartToday, lunchEndToday, null, '[]')) ||
      (startTime.isBefore(lunchStartToday) && endTime.isAfter(lunchEndToday))
    ){
      console.warn(`⚠️ GPT suggestion time overlaps with lunch break (12-1PM): ${startTime.format()} → ${endTime.format()}`);
      return {
        recommendedStart: null,
        recommendedEnd: null,
        reason: "Time slot overlaps with lunch break(12-1PM)",
      };
    }


    if (!Array.isArray(events)) {
      console.error("`events` is not an array:", events);
    } else {
      const bufferMs = 30 * 60 * 1000;
      for (const event of events) {
        const eventStart = moment(event.start);
        const eventEnd = moment(event.end);
        console.log(`--- Checking against existing event: ${event.title || 'Untitled'} ---`);
        console.log(`    Existing Event Start: ${eventStart.format()}`);
        console.log(`    Existing Event End: ${eventEnd.format()}`);
        console.log(`    Existing Event Buffer Start: ${eventStart.clone().subtract(bufferMs, 'milliseconds').format()}`);
        console.log(`    Existing Event Buffer End: ${eventEnd.clone().add(bufferMs, 'milliseconds').format()}`);
        console.log(`    Suggested Start: ${startTime.format()}`);
        console.log(`    Suggested End: ${endTime.format()}`);
        console.log(`    Condition 1 (New Start < Existing End+Buffer): ${startTime.isBefore(eventEnd.clone().add(bufferMs, 'milliseconds'))}`);
        console.log(`    Condition 2 (New End > Existing Start-Buffer): ${endTime.isAfter(eventStart.clone().subtract(bufferMs, 'milliseconds'))}`);
        if (
          startTime.isBefore(eventEnd.clone().add(bufferMs, 'milliseconds')) &&
          endTime.isAfter(eventStart.clone().subtract(bufferMs, 'milliseconds'))
        ) {
          console.warn(`⚠️ GPT suggestion violates 30-minute buffer with existing event "${event.title || 'Untitled'}": ${startTime.format()} → ${endTime.format()}`);
          return {
            recommendedStart: null,
            recommendedEnd: null,
            reason: "Time slot violates 30-minute buffer",
          };
        }
      }
    }
    return{
      recommendedStart: startTime.toDate(),
      recommendedEnd: endTime.toDate(),
      reason: "Success",
    }
  } catch (err) {
    console.error('❌ AI response could not be parsed or an error occurred:', err);
    return {
      recommendedStart: null,
      recommendedEnd: null,
      reason: "Error",
    };
  }
}

export async function getGPTSuggestion(
  {
    userTags,
    mood,
    environment,
    weather,
    calendarConflicts,
    timeWindow,
    timeZone,
  }: {
    userTags: string[];
    mood: string;
    environment: string;
    weather: string;
    calendarConflicts: { start: string; end: string }[];
    timeWindow: string;
    timeZone: string;
  },
  model = 'gpt-4o'
) {
  // Validate time zone
  const validatedTimeZone = validateTimeZone(timeZone);

  // Compute "now" in validated time zone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: validatedTimeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
  const now = new Date();
  now.setHours(hour, minute, 0, 0);


  const systemPrompt = `You are Prism, an emotionally intelligent scheduling assistant.
  Your job is to suggest 3 emotionally aligned, context-aware tasks based on the user’s mood, preferences, environment, and calendar.

  You must:
  - Align recommendations with mood and energy level
  - Avoid tasks the user dislikes (based on tags)
  - Be compatible with the user’s location (e.g., home, cafe, in transit)
  - Adjust based on weather (e.g., cozy tasks for rain, outdoor tasks for sun)
  - Schedule suggestions around existing calendar events
  - Offer short explanations (reason field) for why each task fits today’s situation
  - Return your answer as valid JSON, no markdown`;

  const userPrompt = `
  User Context:
  - Tags: ${userTags.join(', ')}
  - Mood: ${mood}
  - Location Type: ${environment}
  - Weather: ${weather}
  - Time Window: ${timeWindow}
  - Time Zone: ${validatedTimeZone}
  - Current local time: ${now.toLocaleTimeString('en-US', { timeZone: validatedTimeZone })}

  Avoid the following time blocks:
  ${calendarConflicts.map(e => `• ${e.start} to ${e.end}`).join('\n')}

  Instructions:
  1. Avoid overlapping scheduled time blocks.
  2. Use weather to influence task type:
     - ☀️ sunny/warm → suggest outdoor tasks, walks, errands
     - 🌧️ rainy/cloudy → cozy, indoor, self-care, reflective tasks
     - ❄️ cold/snowy → warm, calm, minimal effort tasks
  3. Use location to limit possibilities:
     - "home" → chores, creative projects, relaxing activities
     - "cafe" → light focus work, journaling, reading
     - "on the move" → short tasks, audio learning, stretch goals

  Return exactly 3 task suggestions in this format:
  {
    "task_suggestions": [
      {
        "task": "string",
        "priority": "High" | "Medium" | "Low",
        "reason": "Why this fits based on mood, tags, location, and weather"
      },
      ...
    ]
  }

  Do not add explanations or use markdown. Only return the raw JSON object.
  `;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  const raw = completion.choices?.[0]?.message?.content || '';
  const cleaned = raw.trim().replace(/^```json\s*|\s*```$/g, '');

  try {
    const parsed = JSON.parse(cleaned);
    const taskSuggestions: Suggestion[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.task_suggestions)
      ? parsed.task_suggestions
      : [];
    if (!taskSuggestions.length || taskSuggestions.length !== 3) {
      throw new Error('Expected exactly 3 task suggestions');
    }
    taskSuggestions.forEach((s: Suggestion, i: number) => {
      if (!s.task || !['High', 'Medium', 'Low'].includes(s.priority) || !s.reason) {
        throw new Error(`Invalid suggestion at index ${i}: missing task, priority, or reason`);
      }
    });
    return taskSuggestions;
  } catch (e) {
    console.error('❌ GPT parsing error:', e);
    throw new Error('AI response could not be parsed');
  }
}
export default openai;