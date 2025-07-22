//frontend/lib/server/openaiClient.ts
/*
import { OpenAI } from 'openai';
import moment, { max } from 'moment-timezone';
import { parse } from 'path';

// Removed unused 'start' import from 'repl' to avoid conflicts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("🔑 Loaded OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

interface CalendarEvent {
  start: string;
  end: string;
}

interface TaskScheduleInput {
  taskTitle: string;
  priority: 'High' | 'Medium' | 'Low';
  durationMinutes: number;
  mood?: string;
  events: CalendarEvent[];
}

// Interface for suggestion objects
interface Suggestion {
  task: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
}

// Helper function to validate time zone
function validateTimeZone(timeZone: string): string {
  const validTimeZones = moment.tz.names();
  if (validTimeZones.includes(timeZone)) {
    return timeZone;
  }
  console.warn(`⚠️ Invalid time zone: ${timeZone}. Falling back to UTC.`);
  return 'UTC';
}

// Schedules a single task around calendar conflicts
export async function getTaskSchedule({
  taskTitle,
  priority,
  durationMinutes,
  mood,
  events,
  timeZone,
}: TaskScheduleInput & { timeZone: string }) {
  // Validate time zone
  const validatedTimeZone = validateTimeZone(timeZone);

  const now = moment.tz(validatedTimeZone);
  const today = now.clone().startOf('day');
  const minStart = today.clone().hour(8);
  const maxStart = today.clone().hour(21);




  // Get current time in the validated time zone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: validatedTimeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  const prompt = `
  You are an intelligent scheduling assistant. Based on the user's current calendar and emotional state, find a time slot **today** to schedule the following task:

  Task: ${taskTitle}
  Duration: ${durationMinutes} minutes
  Priority: ${priority}

  User’s calendar:
  ${events.map((e, i) => `Event ${i + 1}: ${e.start} to ${e.end}`).join('\n')}

  Rules:
  - Do NOT suggest a time earlier than ${now.add(15, 'minutes').format("h:mm A")} (user needs time to prepare)
  - Do NOT schedule before 8:00AM or after 9:00PM
  - Do NOT schedule anything from 12:00PM to 1:00PM
  - Avoid overlapping existing events
  - Prioritize earlier hours for high-priority tasks
  - Only schedule today (${now.format('YYYY-MM-DD')})
  - Use timezone: ${validatedTimeZone}

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
    if (
      !parsed.recommendedStart ||
      !parsed.recommendedEnd ||
      isNaN(Date.parse(parsed.recommendedStart)) ||
      isNaN(Date.parse(parsed.recommendedEnd))
    ) {
      console.warn("⚠️ GPT could not schedule the task:", parsed.reason || "No time slot available");
      return{
        recommendedStart: null,
        recommendedEnd: null,
        reason: parsed.reason || "No time slot available today",
      };
    }

    const startTime = moment(parsed.recommendedStart);
    const endTime = moment(parsed.recommendedEnd);
    console.log(`🕓 Now: ${now.format()}`);
    console.log(`🟢 MinStart: ${minStart.format()}`);
    console.log(`🔴 MaxStart: ${maxStart.format()}`);
    console.log(`🧠 GPT Suggested Start: ${startTime.format()}`);
    console.log(`🧠 GPT Suggested End: ${endTime.format()}`);
    
    
    const prepBuffer = now.clone().add(15, 'minutes');
    const maxStartTime = maxStart.clone().subtract(durationMinutes, 'minutes');

    if (
      startTime.isBefore(prepBuffer) ||
      startTime.isBefore(minStart) ||
      startTime.isAfter(maxStartTime) ||
      startTime.format('YYYY-MM-DD') !== now.format('YYYY-MM-DD') || // must be today
      endTime.format('YYYY-MM-DD') !== now.format('YYYY-MM-DD')     // must end today
    ) {
      console.warn(`⚠️ GPT suggestion time is invalid: ${startTime.format()} → ${endTime.format()}`);
      return {
        recommendedStart: null,
        recommendedEnd: null,
        reason: "Time slot is outside of today or allowed window",
      };
    }

    if (endTime.isAfter(maxStart.clone().add(durationMinutes, 'minutes'))) {
      console.warn(`⚠️ End time for "${taskTitle}" goes beyond allowed range: ${endTime.format()}`);
      return {
        recommendedStart: null,
        recommendedEnd: null,
        reason: "End time too late",
      };
    }

      
    parsed.recommendedStart = startTime.toISOString();
    parsed.recommendedEnd = endTime.toISOString();
    return parsed;

  } catch (e) {
    console.error('❌ AI response could not be parsed:', e);
    throw new Error('Unable to schedule task. Please try again.');
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
*/
// frontend/lib/server/openaiClient.ts
import { OpenAI } from 'openai';
import moment from 'moment-timezone';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CalendarEvent {
  start: string;
  end: string;
}

interface TaskScheduleInput {
  taskTitle: string;
  priority: 'High' | 'Medium' | 'Low';
  durationMinutes: number;
  mood?: string;
  events: CalendarEvent[];
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
}: TaskScheduleInput & { timeZone: string }) {
  const validatedTimeZone = validateTimeZone(timeZone);
  const now = moment.tz(validatedTimeZone);
  const today = now.clone().startOf('day');
  const minStart = today.clone().hour(8);
  const maxStart = today.clone().hour(21);

  const prompt = `
    You are an intelligent scheduling assistant. Based on the user's current calendar and emotional state, find a time slot **today** to schedule the following task:

    Task: ${taskTitle}
    Duration: ${durationMinutes} minutes
    Priority: ${priority}

    User’s calendar:
    ${events.map((e, i) => `Event ${i + 1}: ${e.start} to ${e.end}`).join('\n')}

    Rules:
    - Do NOT suggest a time earlier than ${now.add(30, 'minutes').format("h:mm A")} (30-minute prep buffer)
    - Do NOT schedule before 8:00 AM or after 9:00 PM
    - Do NOT schedule anything from 12:00 PM to 1:00 PM
    - Ensure a 30-minute buffer between tasks and existing events
    - Prioritize earlier hours for high-priority tasks
    - Only schedule today (${now.format('YYYY-MM-DD')})
    - Use timezone: ${validatedTimeZone}

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

    if (
      !parsed.recommendedStart ||
      !parsed.recommendedEnd ||
      isNaN(Date.parse(parsed.recommendedStart)) ||
      isNaN(Date.parse(parsed.recommendedEnd))
    ) {
      console.warn("⚠️ GPT could not schedule the task:", parsed.reason || "No time slot available");
      return {
        recommendedStart: null,
        recommendedEnd: null,
        reason: parsed.reason || "No time slot available today",
      };
    }

    const startTime = moment(parsed.recommendedStart);
    const endTime = moment(parsed.recommendedEnd);
    const prepBuffer = now.clone().add(30, 'minutes');
    const maxStartTime = maxStart.clone().subtract(durationMinutes, 'minutes');

    // Validate time slot
    if (
      startTime.isBefore(prepBuffer) ||
      startTime.isBefore(minStart) ||
      startTime.isAfter(maxStartTime) ||
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

    if (endTime.isAfter(maxStart.clone().add(durationMinutes, 'minutes'))) {
      console.warn(`⚠️ End time for "${taskTitle}" goes beyond allowed range: ${endTime.format()}`);
      return {
        recommendedStart: null,
        recommendedEnd: null,
        reason: "End time too late",
      };
    }

    // Check for 30-minute buffer against existing events
    const bufferMs = 30 * 60 * 1000;
    for (const event of events) {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      if (
        endTime.clone().add(bufferMs, 'milliseconds').isAfter(eventStart) &&
        startTime.isBefore(eventEnd.clone().add(bufferMs, 'milliseconds'))
      ) {
        console.warn(`⚠️ GPT suggestion violates 30-minute buffer: ${startTime.format()} → ${endTime.format()}`);
        return {
          recommendedStart: null,
          recommendedEnd: null,
          reason: "Time slot violates 30-minute buffer",
        };
      }
    }

    parsed.recommendedStart = startTime.toISOString();
    parsed.recommendedEnd = endTime.toISOString();
    return parsed;
  } catch (e) {
    console.error('❌ AI response could not be parsed:', e);
    throw new Error('Unable to schedule task. Please try again.');
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

// ... (rest of the file remains unchanged)