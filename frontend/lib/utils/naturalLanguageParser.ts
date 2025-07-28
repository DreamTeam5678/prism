export interface ParsedTask {
  title: string;
  priority: 'low' | 'medium' | 'high';
  scheduled: boolean;
  timestamp?: Date;
  category?: string;
  description?: string;
  originalText: string;
  duration?: number; // in minutes
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
  };
  tags?: string[];
  location?: string;
  attendees?: string[];
}

interface TimeExpression {
  type: 'relative' | 'absolute' | 'day' | 'time';
  value: string;
  date?: Date;
}

export class NaturalLanguageParser {
  private priorityKeywords = {
    high: ['urgent', 'asap', 'important', 'critical', 'emergency', 'now', 'today', 'immediately', 'priority', 'top priority', 'rush', 'deadline'],
    medium: ['soon', 'this week', 'moderate', 'normal', 'standard'],
    low: ['sometime', 'when possible', 'low priority', 'eventually', 'when convenient', 'no rush', 'flexible']
  };

  private timeKeywords = {
    today: 0,
    tomorrow: 1,
    'next week': 7,
    'this week': 0,
    'next month': 30,
    'in an hour': 1,
    'in 2 hours': 2,
    'in 3 hours': 3,
    'in 4 hours': 4,
    'in 5 hours': 5,
    'in 6 hours': 6,
    'in 7 hours': 7,
    'in 8 hours': 8,
    'in 9 hours': 9,
    'in 10 hours': 10,
    'in 11 hours': 11,
    'in 12 hours': 12,
    'in a day': 1,
    'in 2 days': 2,
    'in 3 days': 3,
    'in 4 days': 4,
    'in 5 days': 5,
    'in 6 days': 6,
    'in a week': 7,
    'in 2 weeks': 14,
    'in 3 weeks': 21,
    'in a month': 30,
    'tonight': 0,
    'this evening': 0,
    'this afternoon': 0,
    'this morning': 0,
    'next weekend': 7,
    'this weekend': 0,
    'next year': 365
  };

  private dayKeywords = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 0
  };

  private categoryKeywords = {
    work: ['work', 'job', 'office', 'meeting', 'call', 'email', 'report', 'project', 'presentation', 'deadline', 'client', 'business', 'professional', 'conference', 'interview'],
    personal: ['personal', 'family', 'home', 'house', 'chore', 'cleaning', 'cooking', 'shopping', 'errand', 'appointment', 'visit', 'family time'],
    health: ['exercise', 'workout', 'gym', 'run', 'walk', 'doctor', 'appointment', 'health', 'fitness', 'medical', 'therapy', 'dental', 'checkup', 'yoga', 'meditation'],
    social: ['party', 'dinner', 'lunch', 'coffee', 'meet', 'friend', 'family', 'social', 'date', 'hangout', 'celebration', 'birthday', 'anniversary'],
    creative: ['design', 'write', 'draw', 'paint', 'create', 'art', 'music', 'creative', 'photography', 'craft', 'blog', 'content'],
    learning: ['study', 'read', 'learn', 'course', 'class', 'training', 'education', 'workshop', 'seminar', 'lecture', 'tutorial', 'research'],
    finance: ['bill', 'payment', 'budget', 'tax', 'investment', 'bank', 'financial', 'expense', 'income', 'savings'],
    travel: ['trip', 'vacation', 'flight', 'hotel', 'booking', 'travel', 'journey', 'destination', 'reservation']
  };

  private recurringPatterns = {
    daily: /(every day|daily|each day|every morning|every evening|every night)/i,
    weekly: /(every week|weekly|every monday|every tuesday|every wednesday|every thursday|every friday|every saturday|every sunday)/i,
    monthly: /(every month|monthly|every \d+th|every \d+st|every \d+nd|every \d+rd)/i,
    yearly: /(every year|yearly|annually|every birthday|every anniversary)/i
  };

  private durationPatterns = [
    /(\d+)\s*(hour|hr|h)\s*(?:and\s*(\d+)\s*(minute|min|m))?/i,
    /(\d+)\s*(minute|min|m)\s*(?:and\s*(\d+)\s*(hour|hr|h))?/i,
    /for\s*(\d+)\s*(hour|hr|h)/i,
    /for\s*(\d+)\s*(minute|min|m)/i,
    /(\d+)\s*(hour|hr|h)\s*long/i,
    /(\d+)\s*(minute|min|m)\s*long/i
  ];

  private locationPatterns = [
    /at\s+([^,]+?)(?:\s+on\s+|\s+for\s+|\s+with\s+|$)/i,
    /in\s+([^,]+?)(?:\s+on\s+|\s+for\s+|\s+with\s+|$)/i,
    /location:\s*([^,]+)/i
  ];

  private attendeePatterns = [
    /with\s+([^,]+?)(?:\s+on\s+|\s+for\s+|\s+at\s+|$)/i,
    /meeting\s+with\s+([^,]+)/i,
    /call\s+([^,]+)/i
  ];

  parse(text: string): ParsedTask {
    const lowerText = text.toLowerCase();
    
    // Extract priority
    const priority = this.extractPriority(lowerText);
    
    // Extract time/date
    const timeInfo = this.extractTime(lowerText);
    
    // Extract category
    const category = this.extractCategory(lowerText);
    
    // Extract duration
    const duration = this.extractDuration(text);
    
    // Extract recurring pattern
    const recurring = this.extractRecurring(text);
    
    // Extract location
    const location = this.extractLocation(text);
    
    // Extract attendees
    const attendees = this.extractAttendees(text);
    
    // Extract tags
    const tags = this.extractTags(text);
    
    // Clean up title (remove time/date words)
    const title = this.cleanTitle(text, lowerText);
    
    return {
      title,
      priority,
      scheduled: !!timeInfo.date,
      timestamp: timeInfo.date,
      category,
      duration,
      recurring,
      location,
      attendees,
      tags,
      originalText: text
    };
  }

  private extractPriority(text: string): 'low' | 'medium' | 'high' {
    for (const [level, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return level as 'low' | 'medium' | 'high';
      }
    }
    return 'medium'; // default
  }

  private extractTime(text: string): { date?: Date; timeExpressions: TimeExpression[] } {
    const timeExpressions: TimeExpression[] = [];
    let targetDate: Date | undefined;

    // Check for specific time patterns (e.g., "at 3pm", "at 3:30pm")
    const timePattern = /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
    const timeMatch = text.match(timePattern);
    let targetTime: { hour: number; minute: number } | undefined;

    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();

      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;

      targetTime = { hour, minute };
    }

    // Check for relative time expressions
    for (const [keyword, days] of Object.entries(this.timeKeywords)) {
      if (text.includes(keyword)) {
        const date = new Date();
        
        if (keyword === 'tonight' || keyword === 'this evening') {
          date.setHours(18, 0, 0, 0); // 6 PM
        } else if (keyword === 'this afternoon') {
          date.setHours(14, 0, 0, 0); // 2 PM
        } else if (keyword === 'this morning') {
          date.setHours(9, 0, 0, 0); // 9 AM
        } else if (keyword === 'next weekend') {
          const daysUntilWeekend = (6 - date.getDay() + 7) % 7;
          date.setDate(date.getDate() + daysUntilWeekend);
        } else if (keyword === 'this weekend') {
          const daysUntilWeekend = (6 - date.getDay() + 7) % 7;
          if (daysUntilWeekend === 0) {
            date.setDate(date.getDate() + 7); // Next Saturday
          } else {
            date.setDate(date.getDate() + daysUntilWeekend);
          }
        } else {
          date.setDate(date.getDate() + days);
        }
        
        if (targetTime) {
          date.setHours(targetTime.hour, targetTime.minute, 0, 0);
        }
        
        targetDate = date;
        timeExpressions.push({
          type: 'relative',
          value: keyword,
          date
        });
        break;
      }
    }

    // Check for specific days
    for (const [day, dayNumber] of Object.entries(this.dayKeywords)) {
      if (text.includes(day)) {
        const today = new Date();
        const currentDay = today.getDay();
        const daysUntilTarget = (dayNumber - currentDay + 7) % 7;
        
        const date = new Date();
        date.setDate(date.getDate() + daysUntilTarget);
        
        if (targetTime) {
          date.setHours(targetTime.hour, targetTime.minute, 0, 0);
        }
        
        targetDate = date;
        timeExpressions.push({
          type: 'day',
          value: day,
          date
        });
        break;
      }
    }

    // Check for specific dates (e.g., "on March 15th", "on the 15th")
    const datePatterns = [
      /on\s+(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
      /on\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\s+of\s+(\w+)/i,
      /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i,
      /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && !targetDate) {
        const date = new Date();
        if (match[1] && match[2]) {
          // Try to parse month name
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                             'july', 'august', 'september', 'october', 'november', 'december'];
          const monthIndex = monthNames.findIndex(m => m.startsWith(match[1].toLowerCase()));
          
          if (monthIndex !== -1) {
            date.setMonth(monthIndex);
            date.setDate(parseInt(match[2]));
          } else {
            // Assume it's month/day format
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            date.setMonth(month);
            date.setDate(day);
          }
          
          if (targetTime) {
            date.setHours(targetTime.hour, targetTime.minute, 0, 0);
          }
          
          targetDate = date;
          timeExpressions.push({
            type: 'absolute',
            value: match[0],
            date
          });
        }
      }
    }

    return { date: targetDate, timeExpressions };
  }

  private extractCategory(text: string): string | undefined {
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    return undefined;
  }

  private extractDuration(text: string): number | undefined {
    for (const pattern of this.durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        let hours = 0;
        let minutes = 0;
        
        if (match[1] && match[2]) {
          if (['hour', 'hr', 'h'].includes(match[2].toLowerCase())) {
            hours = parseInt(match[1]);
            if (match[3] && match[4]) {
              minutes = parseInt(match[3]);
            }
          } else if (['minute', 'min', 'm'].includes(match[2].toLowerCase())) {
            minutes = parseInt(match[1]);
            if (match[3] && match[4]) {
              hours = parseInt(match[3]);
            }
          }
        }
        
        return hours * 60 + minutes;
      }
    }
    return undefined;
  }

  private extractRecurring(text: string): { type: 'daily' | 'weekly' | 'monthly' | 'yearly'; interval: number } | undefined {
    for (const [type, pattern] of Object.entries(this.recurringPatterns)) {
      if (pattern.test(text)) {
        return {
          type: type as 'daily' | 'weekly' | 'monthly' | 'yearly',
          interval: 1
        };
      }
    }
    return undefined;
  }

  private extractLocation(text: string): string | undefined {
    for (const pattern of this.locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private extractAttendees(text: string): string[] | undefined {
    const attendees: string[] = [];
    
    for (const pattern of this.attendeePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const names = match[1].split(/\s+and\s+|\s*,\s*/);
        attendees.push(...names.map(name => name.trim()));
      }
    }
    
    return attendees.length > 0 ? attendees : undefined;
  }

  private extractTags(text: string): string[] | undefined {
    const tags: string[] = [];
    const tagPattern = /#(\w+)/g;
    let match;
    
    while ((match = tagPattern.exec(text)) !== null) {
      tags.push(match[1]);
    }
    
    return tags.length > 0 ? tags : undefined;
  }

  private cleanTitle(originalText: string, lowerText: string): string {
    let title = originalText;

    // Remove time-related words
    const timeWords = [
      'today', 'tomorrow', 'next week', 'this week', 'next month',
      'in an hour', 'in 2 hours', 'in 3 hours', 'in 4 hours', 'in 5 hours',
      'in 6 hours', 'in 7 hours', 'in 8 hours', 'in 9 hours', 'in 10 hours',
      'in 11 hours', 'in 12 hours', 'in a day', 'in 2 days', 'in 3 days',
      'in 4 days', 'in 5 days', 'in 6 days', 'in a week', 'in 2 weeks',
      'in 3 weeks', 'in a month', 'urgent', 'asap', 'important', 'critical',
      'emergency', 'now', 'soon', 'sometime', 'when possible', 'low priority',
      'eventually', 'remind me to', 'remind me', 'schedule', 'set up',
      'tonight', 'this evening', 'this afternoon', 'this morning',
      'next weekend', 'this weekend', 'next year'
    ];

    for (const word of timeWords) {
      title = title.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    }

    // Remove time patterns
    title = title.replace(/at\s+\d{1,2}(?::\d{2})?\s*(am|pm)?/gi, '');
    title = title.replace(/on\s+\w+\s+\d{1,2}(?:st|nd|rd|th)?/gi, '');
    title = title.replace(/on\s+the\s+\d{1,2}(?:st|nd|rd|th)?\s+of\s+\w+/gi, '');
    title = title.replace(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g, '');

    // Remove duration patterns
    title = title.replace(/\d+\s*(hour|hr|h)\s*(?:and\s*\d+\s*(minute|min|m))?/gi, '');
    title = title.replace(/\d+\s*(minute|min|m)\s*(?:and\s*\d+\s*(hour|hr|h))?/gi, '');
    title = title.replace(/for\s*\d+\s*(hour|hr|h)/gi, '');
    title = title.replace(/for\s*\d+\s*(minute|min|m)/gi, '');
    title = title.replace(/\d+\s*(hour|hr|h)\s*long/gi, '');
    title = title.replace(/\d+\s*(minute|min|m)\s*long/gi, '');

    // Remove recurring patterns
    title = title.replace(/(every day|daily|each day|every morning|every evening|every night)/gi, '');
    title = title.replace(/(every week|weekly|every monday|every tuesday|every wednesday|every thursday|every friday|every saturday|every sunday)/gi, '');
    title = title.replace(/(every month|monthly|every \d+th|every \d+st|every \d+nd|every \d+rd)/gi, '');
    title = title.replace(/(every year|yearly|annually|every birthday|every anniversary)/gi, '');

    // Remove location patterns
    title = title.replace(/at\s+[^,]+?(?:\s+on\s+|\s+for\s+|\s+with\s+|$)/gi, '');
    title = title.replace(/in\s+[^,]+?(?:\s+on\s+|\s+for\s+|\s+with\s+|$)/gi, '');
    title = title.replace(/location:\s*[^,]+/gi, '');

    // Remove attendee patterns
    title = title.replace(/with\s+[^,]+?(?:\s+on\s+|\s+for\s+|\s+at\s+|$)/gi, '');
    title = title.replace(/meeting\s+with\s+[^,]+/gi, '');
    title = title.replace(/call\s+[^,]+/gi, '');

    // Remove hashtags
    title = title.replace(/#\w+/g, '');

    // Clean up extra spaces and punctuation
    title = title.replace(/\s+/g, ' ').trim();
    title = title.replace(/^[,.\s]+|[,.\s]+$/g, '');

    return title || 'Untitled Task';
  }

  // Helper method to format the parsed task for display
  formatParsedTask(task: ParsedTask): string {
    let formatted = `✅ Parsed: "${task.title}"`;
    
    if (task.timestamp) {
      formatted += `\n📅 Scheduled for: ${task.timestamp.toLocaleString()}`;
    }
    
    if (task.duration) {
      const hours = Math.floor(task.duration / 60);
      const minutes = task.duration % 60;
      formatted += `\n⏱️ Duration: ${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`;
    }
    
    if (task.recurring) {
      formatted += `\n🔄 Recurring: ${task.recurring.type}`;
    }
    
    if (task.priority !== 'medium') {
      formatted += `\n🎯 Priority: ${task.priority}`;
    }
    
    if (task.category) {
      formatted += `\n📂 Category: ${task.category}`;
    }
    
    if (task.location) {
      formatted += `\n📍 Location: ${task.location}`;
    }
    
    if (task.attendees && task.attendees.length > 0) {
      formatted += `\n👥 Attendees: ${task.attendees.join(', ')}`;
    }
    
    if (task.tags && task.tags.length > 0) {
      formatted += `\n🏷️ Tags: ${task.tags.map(tag => `#${tag}`).join(' ')}`;
    }
    
    return formatted;
  }
}

export const naturalLanguageParser = new NaturalLanguageParser(); 