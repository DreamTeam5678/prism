

import { OpenAI } from 'openai';

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

export async function getTaskSchedule(input: TaskScheduleInput) {
  const { taskTitle, priority, durationMinutes, mood, events } = input;

  const prompt = `
You are an intelligent scheduling assistant. Based on the user's current calendar and emotional state, find a time slot today to schedule the following task:

Task: ${taskTitle}
Duration: ${durationMinutes} minutes
Priority: ${priority}
Mood: ${mood || 'unknown'}

User’s calendar:
${events.map((e, i) => `Event ${i + 1}: ${e.start} to ${e.end}`).join('\n')}

Suggest the earliest time slot where this task can fit, considering:
- Avoid overlapping with existing events
- If user is tired or unmotivated, avoid late evenings
- Prioritize morning or early afternoon for high-priority tasks
- Respond in JSON with: recommendedStart, recommendedEnd, and reason

Today is ${new Date().toISOString().split('T')[0]}.
`;

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

  const raw = completion.choices?.[0]?.message?.content;
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed;
  } catch (e) {
    throw new Error('AI response could not be parsed: ' + raw);
  }
}

export async function getGPTSuggestion(
  {
    userTags,
    mood,
    goals,
    habits,
    environment,
    calendarConflicts,
    timeWindow,
  }: {
    userTags: string[];
    mood: string;
    goals: string[];
    habits: string[];
    environment: string;
    calendarConflicts: { start: string; end: string }[];
    timeWindow: string;
  },
  model = 'gpt-4o'
) {
  const systemPrompt = `You are Prism, a mood-aware productivity assistant. Your job is to help the user plan emotionally compatible and fulfilling tasks. You must:

- Account for mood, habits, and energy levels.
- Avoid tasks they dislike or that are environment-incompatible.
- Prioritize tasks based on current goals.
- Suggest ideas that fill calendar gaps and offer emotional support.
- Return responses in structured JSON.`;

  const prompt = `User profile:
- Tags: ${userTags.join(", ")}
- Current mood: ${mood}
- Goals: ${goals.join(", ")}
- Habits: ${habits.join(", ")}
- Environment: ${environment}

They have gaps in their calendar during ${timeWindow}.
Avoid these time blocks: ${calendarConflicts.map(e => `from ${e.start} to ${e.end}`).join("; ")}.

Give 3 smart task suggestions they could schedule now. Explain why each task is emotionally compatible and what priority it maps to.`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  });

  return completion.choices?.[0]?.message?.content || '';
}

export default openai;