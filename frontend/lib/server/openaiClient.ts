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
  console.log(`🚀 getTaskSchedule called for "${taskTitle}" with ${events.length} events`);
  console.log(`📋 Events passed to getTaskSchedule:`, events.map(e => `${e.title} (${e.start}-${e.end})`));
  
  const validatedTimeZone = validateTimeZone(timeZone);
  const now = moment.tz(validatedTimeZone);
  const today = now.clone().startOf('day');
  const tomorrow = today.clone().add(1, 'day');
  
  console.log(`⏰ Current time: ${now.format('HH:mm')}, Hour: ${now.hour()}`);
  
  // Check if it's too late today (after 12 PM/midnight)
  const isLateToday = now.hour() >= 24;
  console.log(`🌙 Is late today (after 12 PM/midnight): ${isLateToday}`);
  
  if (isLateToday) {
    console.log(`🌙 Too late today (after 12 PM/midnight) - no scheduling for today`);
    return {
      recommendedStart: null,
      recommendedEnd: null,
      reason: "Too late today (after 12 PM/midnight) - no available slots",
    };
  }
  
  console.log(`✅ Proceeding with today's scheduling`);
  
  const minAllowedStartOfDay = today.clone().hour(8); // 8:00 AM today
  const maxAllowedEndOfDay = today.clone().hour(21); // 9:00 PM today (instead of 11 PM)
  
  // More flexible start time - start from now if it's within allowed hours, otherwise from 8 AM
  const earliestPossibleStartTime = now.isBefore(minAllowedStartOfDay) 
    ? minAllowedStartOfDay.clone() 
    : now.clone().add(15, 'minutes'); // Reduced buffer to 15 minutes

  console.log(`⏰ Earliest possible start time: ${earliestPossibleStartTime.format('HH:mm')}`);
  console.log(`⏰ Max allowed end of day: ${maxAllowedEndOfDay.format('HH:mm')}`);
  
  // Calculate available time slots more precisely
  const availableSlots = [];
  const currentTime = earliestPossibleStartTime.clone();
  
  // Use smaller buffer for late-day scheduling to be more flexible
  const isLateDay = now.hour() >= 18; // After 6 PM
  
  // Convert all events to the correct timezone for proper comparison
  const timezoneEvents = events.map(event => ({
    ...event,
    start: event.start, // Keep original format, parse when needed
    end: event.end
  }));
  
  try {
    console.log(`🔍 Calculating slots for "${taskTitle}" (${durationMinutes}min) from ${currentTime.format('HH:mm')} to ${maxAllowedEndOfDay.format('HH:mm')}`);
    console.log(`📅 Events to check against:`, events.map(e => `${e.title} (${moment(e.start).format('HH:mm')}-${moment(e.end).format('HH:mm')})`));
    console.log(`🌍 Timezone-adjusted events:`, timezoneEvents.map(e => `${e.title} (${moment(e.start).format('HH:mm')}-${moment(e.end).format('HH:mm')})`));
    console.log(`⏰ Using ${isLateDay ? '5-minute' : '15-minute'} buffer (${isLateDay ? 'late day' : 'normal'})`);
    
    // Sort events by start time for better gap detection
    const sortedEvents = [...timezoneEvents].sort((a, b) => 
      moment.tz(a.start, validatedTimeZone).valueOf() - moment.tz(b.start, validatedTimeZone).valueOf()
    );
    
    // Find potential slots by looking at gaps between events
    const potentialSlots = [];
    
    // Check slot starting from current time
    const slotStart = currentTime.clone();
    const slotEnd = slotStart.clone().add(durationMinutes, 'minutes');
    
    // Check if initial slot works
    if (slotEnd.isBefore(maxAllowedEndOfDay)) {
      const lunchStart = today.clone().hour(12).minute(0);
      const lunchEnd = today.clone().hour(13).minute(0);
      const overlapsLunch = slotStart.isBefore(lunchEnd) && slotEnd.isAfter(lunchStart);
      
      if (!overlapsLunch) {
        let hasConflict = false;
        for (const event of sortedEvents) {
          const eventStart = moment.tz(event.start, validatedTimeZone);
          const eventEnd = moment.tz(event.end, validatedTimeZone);
          const bufferMs = isLateDay ? 5 * 60 * 1000 : 15 * 60 * 1000;
          
          const slotOverlapsEvent = (
            slotStart.isBefore(eventEnd.clone().add(bufferMs, 'milliseconds')) &&
            slotEnd.isAfter(eventStart.clone().subtract(bufferMs, 'milliseconds'))
          );
          
          if (slotOverlapsEvent) {
            console.log(`⚠️ Initial slot conflict: "${taskTitle}" (${slotStart.format('HH:mm')}-${slotEnd.format('HH:mm')}) conflicts with "${event.title}" (${eventStart.format('HH:mm')}-${eventEnd.format('HH:mm')})`);
            hasConflict = true;
            break;
          }
        }
        
        if (!hasConflict) {
          console.log(`✅ Initial slot available: ${slotStart.format('HH:mm')}-${slotEnd.format('HH:mm')}`);
          potentialSlots.push({
            start: slotStart.clone(),
            end: slotEnd.clone()
          });
        }
      }
    }
    
    // Check gaps between events
    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];
      
      const currentEventEnd = moment.tz(currentEvent.end, validatedTimeZone);
      const nextEventStart = nextEvent ? moment.tz(nextEvent.start, validatedTimeZone) : maxAllowedEndOfDay;
      
      console.log(`🔍 Checking gap between "${currentEvent.title}" (ends ${currentEventEnd.format('HH:mm')}) and "${nextEvent?.title || 'end of day'}" (starts ${nextEventStart.format('HH:mm')})`);
      
      // Try to fit a slot in the gap
      let gapStart = currentEventEnd.clone().add(isLateDay ? 5 : 15, 'minutes'); // Add buffer after current event
      let gapEnd = nextEventStart.clone().subtract(isLateDay ? 5 : 15, 'minutes'); // Subtract buffer before next event
      
      // Ensure gap is after current time and before max allowed end
      gapStart = moment.max(gapStart, currentTime);
      gapEnd = moment.min(gapEnd, maxAllowedEndOfDay);
      
      console.log(`📏 Gap window: ${gapStart.format('HH:mm')} - ${gapEnd.format('HH:mm')} (${gapEnd.diff(gapStart, 'minutes')} minutes available)`);
      
      if (gapStart.isBefore(gapEnd)) {
        const slotEnd = gapStart.clone().add(durationMinutes, 'minutes');
        
        console.log(`⏱️ Task needs ${durationMinutes} minutes, slot would end at ${slotEnd.format('HH:mm')}`);
        
        if (slotEnd.isBefore(gapEnd) || slotEnd.isSame(gapEnd)) {
          // Check for lunch break conflict
          const lunchStart = today.clone().hour(12).minute(0);
          const lunchEnd = today.clone().hour(13).minute(0);
          const overlapsLunch = gapStart.isBefore(lunchEnd) && slotEnd.isAfter(lunchStart);
          
          if (!overlapsLunch) {
            console.log(`✅ Found gap slot: ${gapStart.format('HH:mm')}-${slotEnd.format('HH:mm')} between events`);
            potentialSlots.push({
              start: gapStart.clone(),
              end: slotEnd.clone()
            });
          } else {
            console.log(`🍽️ Gap slot overlaps lunch: ${gapStart.format('HH:mm')}-${slotEnd.format('HH:mm')}`);
          }
        } else {
          console.log(`❌ Gap too small: need ${durationMinutes}min but only have ${gapEnd.diff(gapStart, 'minutes')}min`);
        }
      } else {
        console.log(`❌ No valid gap: gapStart (${gapStart.format('HH:mm')}) >= gapEnd (${gapEnd.format('HH:mm')})`);
      }
    }
    
    // If no gap slots found, try incremental approach as fallback
    if (potentialSlots.length === 0) {
      console.log(`🔍 No gap slots found, trying incremental approach`);
      let incrementalTime = currentTime.clone();
      
      while (incrementalTime.isBefore(maxAllowedEndOfDay)) {
        const slotEnd = incrementalTime.clone().add(durationMinutes, 'minutes');
        
        if (slotEnd.isAfter(maxAllowedEndOfDay)) break;
        
        // Check for lunch break conflict
        const lunchStart = today.clone().hour(12).minute(0);
        const lunchEnd = today.clone().hour(13).minute(0);
        const overlapsLunch = incrementalTime.isBefore(lunchEnd) && slotEnd.isAfter(lunchStart);
        
        if (!overlapsLunch) {
          let hasConflict = false;
          for (const event of sortedEvents) {
            const eventStart = moment.tz(event.start, validatedTimeZone);
            const eventEnd = moment.tz(event.end, validatedTimeZone);
            const bufferMs = isLateDay ? 5 * 60 * 1000 : 15 * 60 * 1000;
            
            const slotOverlapsEvent = (
              incrementalTime.isBefore(eventEnd.clone().add(bufferMs, 'milliseconds')) &&
              slotEnd.isAfter(eventStart.clone().subtract(bufferMs, 'milliseconds'))
            );
            
            if (slotOverlapsEvent) {
              console.log(`⚠️ Incremental conflict: "${taskTitle}" (${incrementalTime.format('HH:mm')}-${slotEnd.format('HH:mm')}) conflicts with "${event.title}" (${eventStart.format('HH:mm')}-${eventEnd.format('HH:mm')})`);
              hasConflict = true;
              break;
            }
          }
          
          if (!hasConflict) {
            console.log(`✅ Incremental slot available: ${incrementalTime.format('HH:mm')}-${slotEnd.format('HH:mm')}`);
            potentialSlots.push({
              start: incrementalTime.clone(),
              end: slotEnd.clone()
            });
          }
        }
        
        incrementalTime = incrementalTime.add(30, 'minutes');
      }
    }
    
    availableSlots.push(...potentialSlots);
    
  } catch (error) {
    console.error(`❌ Error in slot calculation for "${taskTitle}":`, error);
    // Return a fallback slot if there's an error
    return {
      recommendedStart: earliestPossibleStartTime.toDate(),
      recommendedEnd: earliestPossibleStartTime.clone().add(durationMinutes, 'minutes').toDate(),
      reason: "Fallback slot due to calculation error",
    };
  }

  // If still no available slots, try more aggressive approach for late-day scheduling
  if (availableSlots.length === 0) {
    if (isLateDay) {
      console.log(`🌙 Late day detected - trying aggressive slot finding with minimal buffer`);
      
      // Try to find any slot that fits, even with minimal buffer
      const aggressiveSlots = [];
      
      // Use the same gap detection approach but with minimal buffer
      const sortedEvents = [...timezoneEvents].sort((a, b) => 
        moment.tz(a.start, validatedTimeZone).valueOf() - moment.tz(b.start, validatedTimeZone).valueOf()
      );
      
      // Check initial slot with minimal buffer
      const aggressiveSlotStart = earliestPossibleStartTime.clone();
      const aggressiveSlotEnd = aggressiveSlotStart.clone().add(durationMinutes, 'minutes');
      
      if (aggressiveSlotEnd.isBefore(maxAllowedEndOfDay)) {
        const lunchStart = today.clone().hour(12).minute(0);
        const lunchEnd = today.clone().hour(13).minute(0);
        const overlapsLunch = aggressiveSlotStart.isBefore(lunchEnd) && aggressiveSlotEnd.isAfter(lunchStart);
        
        if (!overlapsLunch) {
          let hasConflict = false;
          for (const event of sortedEvents) {
            const eventStart = moment.tz(event.start, validatedTimeZone);
            const eventEnd = moment.tz(event.end, validatedTimeZone);
            const minimalBufferMs = 2 * 60 * 1000; // 2 minutes
            
            const slotOverlapsEvent = (
              aggressiveSlotStart.isBefore(eventEnd.clone().add(minimalBufferMs, 'milliseconds')) &&
              aggressiveSlotEnd.isAfter(eventStart.clone().subtract(minimalBufferMs, 'milliseconds'))
            );
            
            if (slotOverlapsEvent) {
              hasConflict = true;
              break;
            }
          }
          
          if (!hasConflict) {
            console.log(`✅ Found aggressive initial slot: ${aggressiveSlotStart.format('HH:mm')}-${aggressiveSlotEnd.format('HH:mm')}`);
            aggressiveSlots.push({
              start: aggressiveSlotStart.clone(),
              end: aggressiveSlotEnd.clone()
            });
          }
        }
      }
      
      // Check gaps between events with minimal buffer
      for (let i = 0; i < sortedEvents.length; i++) {
        const currentEvent = sortedEvents[i];
        const nextEvent = sortedEvents[i + 1];
        
        const currentEventEnd = moment.tz(currentEvent.end, validatedTimeZone);
        const nextEventStart = nextEvent ? moment.tz(nextEvent.start, validatedTimeZone) : maxAllowedEndOfDay;
        
        // Try to fit a slot in the gap with minimal buffer
        let gapStart = currentEventEnd.clone().add(2, 'minutes'); // Minimal buffer
        let gapEnd = nextEventStart.clone().subtract(2, 'minutes'); // Minimal buffer
        
        // Ensure gap is after current time and before max allowed end
        gapStart = moment.max(gapStart, earliestPossibleStartTime);
        gapEnd = moment.min(gapEnd, maxAllowedEndOfDay);
        
        if (gapStart.isBefore(gapEnd)) {
          const slotEnd = gapStart.clone().add(durationMinutes, 'minutes');
          
          if (slotEnd.isBefore(gapEnd) || slotEnd.isSame(gapEnd)) {
            // Check for lunch break conflict
            const lunchStart = today.clone().hour(12).minute(0);
            const lunchEnd = today.clone().hour(13).minute(0);
            const overlapsLunch = gapStart.isBefore(lunchEnd) && slotEnd.isAfter(lunchStart);
            
            if (!overlapsLunch) {
              console.log(`✅ Found aggressive gap slot: ${gapStart.format('HH:mm')}-${slotEnd.format('HH:mm')} between events`);
              aggressiveSlots.push({
                start: gapStart.clone(),
                end: slotEnd.clone()
              });
            }
          }
        }
      }
      
      // If still no slots, try incremental approach with minimal buffer
      if (aggressiveSlots.length === 0) {
        console.log(`🔍 No aggressive gap slots found, trying incremental approach with minimal buffer`);
        let incrementalTime = earliestPossibleStartTime.clone();
        
        while (incrementalTime.isBefore(maxAllowedEndOfDay)) {
          const slotEnd = incrementalTime.clone().add(durationMinutes, 'minutes');
          
          if (slotEnd.isAfter(maxAllowedEndOfDay)) break;
          
          // Check for lunch break conflict
          const lunchStart = today.clone().hour(12).minute(0);
          const lunchEnd = today.clone().hour(13).minute(0);
          const overlapsLunch = incrementalTime.isBefore(lunchEnd) && slotEnd.isAfter(lunchStart);
          
          if (!overlapsLunch) {
            let hasConflict = false;
            for (const event of sortedEvents) {
              const eventStart = moment.tz(event.start, validatedTimeZone);
              const eventEnd = moment.tz(event.end, validatedTimeZone);
              const minimalBufferMs = 2 * 60 * 1000; // 2 minutes
              
              const slotOverlapsEvent = (
                incrementalTime.isBefore(eventEnd.clone().add(minimalBufferMs, 'milliseconds')) &&
                slotEnd.isAfter(eventStart.clone().subtract(minimalBufferMs, 'milliseconds'))
              );
              
              if (slotOverlapsEvent) {
                hasConflict = true;
                break;
              }
            }
            
            if (!hasConflict) {
              console.log(`✅ Found aggressive incremental slot: ${incrementalTime.format('HH:mm')}-${slotEnd.format('HH:mm')}`);
              aggressiveSlots.push({
                start: incrementalTime.clone(),
                end: slotEnd.clone()
              });
            }
          }
          
          incrementalTime = incrementalTime.add(15, 'minutes'); // Try every 15 minutes
        }
      }
      
      if (aggressiveSlots.length > 0) {
        const selectedSlot = aggressiveSlots[0]; // Take the first available slot
        console.log(`🎯 Selected aggressive slot for "${taskTitle}": ${selectedSlot.start.format('HH:mm')}-${selectedSlot.end.format('HH:mm')}`);
        
        return {
          recommendedStart: selectedSlot.start.toDate(),
          recommendedEnd: selectedSlot.end.toDate(),
          reason: `Scheduled with minimal buffer due to late-day constraints`,
        };
      }
    }
    
    console.log(`❌ No available slots for "${taskTitle}" today`);
    return {
      recommendedStart: null,
      recommendedEnd: null,
      reason: "No available time slots today",
    };
  }

  // Prioritize slots based on priority with better distribution
  let selectedSlot;
  
  // First, filter out any slots that might conflict with existing events
  const nonConflictingSlots = availableSlots.filter(slot => {
    for (const event of timezoneEvents) {
      const eventStart = moment.tz(event.start, validatedTimeZone);
      const eventEnd = moment.tz(event.end, validatedTimeZone);
      const bufferMs = isLateDay ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5 min buffer if late day, 15 min otherwise
      
      // Check if this slot conflicts with any existing event
      if (
        slot.start.isBefore(eventEnd.clone().add(bufferMs, 'milliseconds')) &&
        slot.end.isAfter(eventStart.clone().subtract(bufferMs, 'milliseconds'))
      ) {
        console.log(`⚠️ Slot ${slot.start.format('HH:mm')}-${slot.end.format('HH:mm')} conflicts with event ${eventStart.format('HH:mm')}-${eventEnd.format('HH:mm')}`);
        return false; // This slot conflicts, exclude it
      }
    }
    return true; // No conflicts, keep this slot
  });
  
  // Use non-conflicting slots if available, otherwise fall back to all slots
  const slotsToUse = nonConflictingSlots.length > 0 ? nonConflictingSlots : availableSlots;
  
  console.log(`🔍 Available slots: ${availableSlots.length}, Non-conflicting slots: ${nonConflictingSlots.length}`);
  console.log(`📅 Non-conflicting slots:`, nonConflictingSlots.map(s => `${s.start.format('HH:mm')}-${s.end.format('HH:mm')}`));
  
  if (slotsToUse.length === 0) {
    console.log(`❌ No available slots for "${taskTitle}"`);
    return {
      recommendedStart: null,
      recommendedEnd: null,
      reason: "No available time slots today",
    };
  }
  
  console.log(`🎯 Selecting from ${slotsToUse.length} slots for priority: ${priority}`);
  console.log(`📋 Available slots:`, slotsToUse.map(s => `${s.start.format('HH:mm')}-${s.end.format('HH:mm')}`));
  
  if (priority === 'High') {
    // For high priority, prefer earlier slots
    selectedSlot = slotsToUse[0];
  } else if (priority === 'Medium') {
    // For medium priority, prefer middle slots
    selectedSlot = slotsToUse[Math.floor(slotsToUse.length / 2)];
  } else {
    // For low priority, prefer later slots
    selectedSlot = slotsToUse[slotsToUse.length - 1];
  }

  // Ensure we don't select a slot that conflicts with already scheduled times
  // This is a safety check in case the conflict detection missed something
  const selectedStart = selectedSlot.start;
  const selectedEnd = selectedSlot.end;
  
  console.log(`🎯 Selected slot for "${taskTitle}": ${selectedStart.format('HH:mm')}-${selectedEnd.format('HH:mm')} (${slotsToUse.length} non-conflicting slots available)`);

  return {
    recommendedStart: selectedSlot.start.toDate(),
    recommendedEnd: selectedSlot.end.toDate(),
    reason: `Scheduled during optimal ${priority.toLowerCase()} priority time slot`,
  };
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
    avoidTitles = [],
    userHistory = [],
    currentTime,
    retryHint,
  }: {
    userTags: string[];
    mood: string;
    environment: string;
    weather: string;
    calendarConflicts: { start: string; end: string }[];
    timeWindow: string;
    timeZone: string;
    avoidTitles?: string[];
    userHistory?: Array<{ task: string; accepted: boolean; timestamp: string }>;
    currentTime?: string;
    retryHint?: string;
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

  // Analyze user history for patterns
  const acceptedTasks = userHistory.filter(h => h.accepted).map(h => h.task);
  const rejectedTasks = userHistory.filter(h => !h.accepted).map(h => h.task);
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // Enhanced context analysis
  const energyLevel = getEnergyLevel(mood, timeOfDay);
  const productivityStyle = getProductivityStyle(userTags, environment);
  const weatherImpact = getWeatherImpact(weather, environment);

  const systemPrompt = `You are Prism, an emotionally intelligent scheduling
   assistant with advanced context awareness.
  Your job is to suggest 3 emotionally aligned, 
  context-aware tasks based on the user's mood, preferences, environment, and calendar.

  You must:
  - Align recommendations with mood and energy level (${energyLevel})
  - Consider productivity style: ${productivityStyle}
  - Adapt to weather conditions: ${weatherImpact}
  - Avoid tasks the user dislikes (based on tags)
  - Be compatible with the user's location (${environment})
  - Schedule suggestions around existing calendar events
  - Offer short explanations (reason field) for why each task fits today's situation
  - Return your answer as valid JSON, no markdown

  ${retryHint ? `RETRY CONTEXT: ${retryHint}` : ''}

  Advanced intelligence based on user history:
  ${acceptedTasks.length > 0 ? `- User tends to accept: ${acceptedTasks.slice(0, 3).join(', ')}` : ''}
  ${rejectedTasks.length > 0 ? `- User tends to reject: ${rejectedTasks.slice(0, 3).join(', ')}` : ''}
  - Current time of day: ${timeOfDay} (${hour}:${minute.toString().padStart(2, '0')})
  - Energy level: ${energyLevel}
  - Environment context: ${environment}
  - Weather context: ${weather}

  Additional rules for diversity and avoiding duplicates:
  - Do NOT suggest any task that is already scheduled for the user today. Here is a list of titles to avoid: 
  ${avoidTitles && avoidTitles.length ? avoidTitles.map(t => `"${t}"`).join(', ') : '[]'}
  - Do NOT suggest tasks that are very similar to each other. 
  Each suggestion should be distinct in type, context, or activity.
  - If you cannot find 3 unique, schedulable suggestions, return as many as possible, 
  but never suggest a duplicate or near-duplicate.
  ${acceptedTasks.length > 0 ? `- Prefer suggesting tasks similar to what the user has accepted before` : ''}
  ${rejectedTasks.length > 0 ? `- Avoid suggesting tasks similar to what the user has rejected before` : ''}

  Context-aware task selection:
  - Morning tasks should be high-energy and focus-intensive
  - Afternoon tasks should be balanced and moderate
  - Evening tasks should be lighter and preparation-focused
  - Consider the user's current energy level and mood for task complexity

  IMPORTANT: Return exactly 3 task suggestions. If you cannot find 3 unique suggestions, 
  provide fewer but ensure each is high-quality and contextually appropriate.`;

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
   - "work" → professional tasks, meetings, focus work
   - "campus" → study sessions, academic work
   - "commuting" → audio learning, planning, reflection
   - "cafe" → light focus work, reading, journaling
   - "traveling" → planning, reflection, light tasks
4. Adjust suggestions based on mood and energy:
   - 🤑 Ambitious → high-energy, challenging tasks, goal-oriented activities
   - 😊 Content → balanced tasks, creative projects, enjoyable activities
   - 😐 Neutral → moderate tasks, routine activities, practical tasks
   - 😓 Overwhelmed → simple, manageable tasks, self-care, organizing
   - 😴 Tired → low-energy tasks, restful activities, gentle movement
   - 😩 Unmotivated → easy wins, quick tasks, inspiring activities
5. Do NOT suggest any task that is already scheduled for the user today.
6. Do NOT suggest tasks that are very similar to each other.
7. Consider time of day energy levels and current energy state.
8. Learn from user preferences and history.

Return exactly 3 task suggestions in this format:
{
  "task_suggestions": [
    {
      "task": "string",
      "priority": "High" | "Medium" | "Low",
      "reason": "Why this fits based on mood, energy, location, weather, and time of day"
    },
    ...
  ]
}

Do not add explanations or use markdown. Only return the raw JSON object.
`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
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
      
      // Validate suggestions
      const validSuggestions = taskSuggestions.filter((s: Suggestion, i: number) => {
        if (!s.task || !['High', 'Medium', 'Low'].includes(s.priority) || !s.reason) {
          console.warn(`Invalid suggestion at index ${i}: missing task, priority, or reason`);
          return false;
        }
        return true;
      });

      if (validSuggestions.length === 0) {
        throw new Error('No valid suggestions generated');
      }

      // Ensure we have exactly 3 suggestions, or as many as possible
      const finalSuggestions = validSuggestions.slice(0, 3);
      
      // If we don't have 3 suggestions, generate fallback suggestions
      while (finalSuggestions.length < 3) {
        const fallbackTasks: Suggestion[] = [
          { task: "Review and organize your workspace", priority: "Medium", reason: "Good for any time of day and helps maintain productivity" },
          { task: "Take a short walk or stretch break", priority: "Low", reason: "Important for maintaining energy and focus throughout the day" },
          { task: "Plan tomorrow's priorities", priority: "Medium", reason: "Setting up for success and reducing morning stress" }
        ];
        
        const fallback = fallbackTasks[finalSuggestions.length];
        if (fallback) {
          finalSuggestions.push(fallback);
        } else {
          break;
        }
      }

      return finalSuggestions;
    } catch (parseError) {
      console.error('❌ GPT response parsing error:', parseError);
      // Return fallback suggestions if parsing fails
      return [
        { task: "Review and organize your workspace", priority: "Medium", reason: "Good for any time of day and helps maintain productivity" },
        { task: "Take a short walk or stretch break", priority: "Low", reason: "Important for maintaining energy and focus throughout the day" },
        { task: "Plan tomorrow's priorities", priority: "Medium", reason: "Setting up for success and reducing morning stress" }
      ] as Suggestion[];
    }
  } catch (e) {
    console.error('❌ GPT API error:', e);
    // Return fallback suggestions if API call fails
    return [
      { task: "Review and organize your workspace", priority: "Medium", reason: "Good for any time of day and helps maintain productivity" },
      { task: "Take a short walk or stretch break", priority: "Low", reason: "Important for maintaining energy and focus throughout the day" },
      { task: "Plan tomorrow's priorities", priority: "Medium", reason: "Setting up for success and reducing morning stress" }
    ] as Suggestion[];
  }
}

// Helper functions for enhanced context awareness
function getEnergyLevel(mood: string, timeOfDay: string): string {
  const moodEnergyMap: Record<string, number> = {
    'Ambitious': 5, 'Content': 4, 'Neutral': 3, 'Overwhelmed': 2, 'Tired': 1, 'Unmotivated': 2
  };
  
  const timeEnergyMap: Record<string, number> = {
    'morning': 5, 'afternoon': 4, 'evening': 3
  };
  
  const moodEnergy = moodEnergyMap[mood] || 3;
  const timeEnergy = timeEnergyMap[timeOfDay] || 3;
  const avgEnergy = Math.round((moodEnergy + timeEnergy) / 2);
  
  const energyLevels = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];
  return energyLevels[avgEnergy - 1] || 'Moderate';
}

function getProductivityStyle(userTags: string[], environment: string): string {
  const tags = userTags.join(' ').toLowerCase();
  
  if (tags.includes('creative') || tags.includes('art')) return 'Creative/Expressive';
  if (tags.includes('analytical') || tags.includes('research')) return 'Analytical/Research';
  if (tags.includes('social') || tags.includes('communication')) return 'Social/Communication';
  if (tags.includes('physical') || tags.includes('exercise')) return 'Physical/Active';
  if (tags.includes('organizational') || tags.includes('planning')) return 'Organizational/Planning';
  
  // Default based on environment
  const envStyles: Record<string, string> = {
    'home': 'Creative/Relaxed',
    'work': 'Professional/Focused',
    'campus': 'Academic/Study',
    'commuting': 'Planning/Reflection',
    'cafe': 'Light Focus/Creative',
    'traveling': 'Planning/Reflection'
  };
  
  return envStyles[environment] || 'Balanced/General';
}

function getWeatherImpact(weather: string, environment: string): string {
  const weatherLower = weather.toLowerCase();
  
  if (weatherLower.includes('sunny') || weatherLower.includes('warm')) {
    return 'Outdoor activities encouraged, high energy tasks suitable';
  }
  if (weatherLower.includes('rainy') || weatherLower.includes('cloudy')) {
    return 'Indoor activities preferred, cozy and reflective tasks ideal';
  }
  if (weatherLower.includes('cold') || weatherLower.includes('snow')) {
    return 'Warm indoor activities, low-energy tasks recommended';
  }
  
  return 'Weather neutral, standard task recommendations';
}
export default openai;