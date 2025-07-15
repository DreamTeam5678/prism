/*
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ClipboardList, MapPin, Cloud, Sun } from 'lucide-react';
import './Survey.css';

const steps = [
  'role', 'planningStyle', 'idealSelf', 'blockers', 'dislikes', 'locationType', 'climate', 'energyAccess', 'supportStyle'
] as const;

type StepKey = typeof steps[number];

const colorPalette = {
  orange: '#dd6d42',
  tan: '#ebdbb4',
  blue: '#d0e4ec',
  lightGray: '#ededed',
  lavender: '#9b87a6',
  sage: '#9ba885',
};

const icons = [
  <User key="role" size={32} />,
  <ClipboardList key="planning" size={32} />,
  <User key="ideal" size={32} />,
  <ClipboardList key="blockers" size={32} />,
  <ClipboardList key="dislikes" size={32} />,
  <MapPin key="location" size={32} />,
  <Sun key="climate" size={32} />,
  <Cloud key="energy" size={32} />,
  <User key="support" size={32} />
];



const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-gradient-to-r from-orange-400 to-purple-500 h-2 rounded-full transition-all duration-500"
      style={{ width: `${value}%` }}
    />
  </div>
);

export default function SurveyStepper() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<StepKey, string>>({
    role: '', planningStyle: '', idealSelf: '', blockers: '', dislikes: '',
    locationType: '', climate: '', energyAccess: '', supportStyle: ''
  });

  const handleChange = (key: StepKey, value: string) => {
    if (value.length <= 200) {
      setForm({ ...form, [key]: value });
    } else {
      alert('Input is too long. Maximum 200 characters.');
    }
  };

  const handleSubmit = async () => {
    try {
      const surveyData = {
        ...form,
        idealSelf: form.idealSelf.split(',').map(item => item.trim()),
        blockers: form.blockers.split(',').map(item => item.trim()),
        dislikes: form.dislikes.split(',').map(item => item.trim()),
        environment: {
          locationType: form.locationType,
          climate: form.climate,
          energyAccess: form.energyAccess
        },
        createdAt: new Date().toISOString()
      };

      console.log('Survey data:', surveyData);
      alert('Survey submitted successfully!');
      router.push('/dashboard');
    } catch (error) {
      alert('Failed to submit');
    }
  };

  const labels: Record<StepKey, string> = {
    role: "What's your current role?",
    planningStyle: 'How do you currently plan?',
    idealSelf: 'Describe your ideal self (comma separated)',
    blockers: 'What blocks your progress? (comma separated)',
    dislikes: 'What planning methods do you dislike?',
    locationType: 'Preferred environment: urban, nature, hybrid?',
    climate: 'Preferred climate?',
    energyAccess: 'How consistent is your energy?',
    supportStyle: 'What type of support do you respond to best?'
  };

  const isMultilineField = ['idealSelf', 'blockers', 'dislikes'].includes(steps[step]);

  return (
    <div className="survey-body">
      <div className="survey-container">
        <Progress value={((step + 1) / steps.length) * 100} className="mb-6" />
        <div className="text-4xl text-gray-800 mb-4 flex justify-center" style={{ color: colorPalette.lavender }}>
          {icons[step]}
        </div>
        <h1 className="text-3xl font-[Sofia] text-[#444] mb-6">
          {labels[steps[step]]}
        </h1>

        {isMultilineField ? (
          <textarea
            className="input-field"
            value={form[steps[step]] || ''}
            onChange={(e) => handleChange(steps[step], e.target.value)}
            rows={4}
            maxLength={200}
          />
        ) : (
          <input
            type="text"
            className="input-field"
            value={form[steps[step]] || ''}
            onChange={(e) => handleChange(steps[step], e.target.value)}
            maxLength={200}
          />
        )}

        <div className="flex justify-between mt-8">
          {step > 0 && (
            <button className="nav-button back" onClick={() => setStep(step - 1)}>Back</button>
          )}
          {step < steps.length - 1 ? (
            <button className="nav-button next" onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="nav-button submit" onClick={handleSubmit}>Let’s Get Started!</button>
          )}
        </div>
      </div>
    </div>
  );
}
*/

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ClipboardList, MapPin, Cloud, Sun, Target, AlertCircle, ThumbsDown, Home, Thermometer } from 'lucide-react';
import './Survey.css';

const steps = [
  'currentMode', 'planningStyle', 'idealSelf', 'blockers', 'environment', 'climate', 'dislikes'
] as const;

type StepKey = typeof steps[number];

const iconsMap: Record<StepKey, JSX.Element> = {
  currentMode: <User size={32} />, 
  planningStyle: <ClipboardList size={32} />, 
  idealSelf: <Target size={32} />, 
  blockers: <AlertCircle size={32} />, 
  environment: <Home size={32} />, 
  climate: <Thermometer size={32} />, 
  dislikes: <ThumbsDown size={32} />
};

const Progress = ({ value }: { value: number }) => (
  <div className="progress-bar">
    <div className="progress-bar-filled" style={{ width: `${value}%` }} />
  </div>
);

const OptionCard = ({ option, isSelected, onClick, emoji, description }: { option: string; isSelected: boolean; onClick: () => void; emoji?: string; description?: string }) => (
  <div className={`option-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
    <span>{emoji}</span>
    <div>
      <div>{option}</div>
      {description && <p>{description}</p>}
    </div>
  </div>
);

export default function SurveyStepper() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<StepKey, string[]>>({
    currentMode: [], planningStyle: [], idealSelf: [], blockers: [], environment: [], climate: [], dislikes: []
  });

  const handleOptionToggle = (key: StepKey, value: string, isMultiSelect = true) => {
    const currentValues = form[key] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : isMultiSelect ? [...currentValues, value] : [value];
    setForm({ ...form, [key]: newValues });
  };

  const handleSubmit = async () => {
    try {
      const surveyData = { ...form, createdAt: new Date().toISOString() };
      console.log('Survey data:', surveyData);
      alert('Survey submitted successfully!');
      router.push('/dashboard');
    } catch {
      alert('Failed to submit');
    }
  };

  const stepData = {
    currentMode: {
      title: "Your Current Mode",
      subtitle: "This grounds us in where you are now.",
      isMultiSelect: false,
      options: [
        { value: 'student', label: 'Student', emoji: '🎓' },
        { value: 'professional', label: 'Professional', emoji: '💼' },
        { value: 'everyday', label: 'Everyday', emoji: '🌟' }
      ]
    },
    planningStyle: {
      title: "How do you currently plan?",
      subtitle: "Tell us about your planning approach.",
      isMultiSelect: false,
      options: [
        { value: 'frontloader', label: 'Frontloader', emoji: '📋', description: 'Plan everything in advance' },
        { value: 'just_tasks', label: 'Just Tasks', emoji: '✅', description: 'Simple task lists' },
        { value: 'reactive', label: 'Reactive', emoji: '⚡', description: 'Handle things as they come' },
        { value: 'not_at_all', label: 'Not at All', emoji: '🤷‍♀️', description: 'Wing it completely' }
      ]
    },
    idealSelf: {
      title: "What version of you are we helping you grow into?",
      subtitle: "Pick up to 2 that resonate most with you.",
      isMultiSelect: true,
      maxSelections: 2,
      options: [
        { value: 'disciplined_structured', label: 'Disciplined & structured', emoji: '🎯' },
        { value: 'calm_balanced', label: 'Calm & balanced', emoji: '🧘‍♀️' },
        { value: 'focused_driven', label: 'Focused & driven', emoji: '💡' },
        { value: 'flexible_consistent', label: 'Flexible but consistent', emoji: '🦋' },
        { value: 'energetic_inspired', label: 'Energetic & inspired', emoji: '🌟' },
        { value: 'productive_no_burnout', label: 'Productive without burnout', emoji: '💻' },
        { value: 'mentally_clear', label: 'Mentally clear & intentional', emoji: '🧠' },
        { value: 'creative_fulfilled', label: 'Creative & fulfilled', emoji: '✨' }
      ]
    },
    blockers: {
      title: "What usually gets in your way?",
      subtitle: "Choose all that apply - self-awareness is key to growth.",
      isMultiSelect: true,
      options: [
        { value: 'overwhelmed', label: 'I get overwhelmed easily', emoji: '😵' },
        { value: 'start_strong_fall_off', label: 'I start strong but fall off', emoji: '🌀' },
        { value: 'forget_important', label: 'I forget what\'s important', emoji: '🧠' },
        { value: 'burnt_out', label: 'I get burnt out from over-scheduling', emoji: '😩' },
        { value: 'lose_motivation', label: 'I lose motivation quickly', emoji: '💤' },
        { value: 'get_distracted', label: 'I get distracted too much', emoji: '📱' },
        { value: 'productivity_guilt', label: 'I feel guilty when I\'m unproductive', emoji: '📉' },
        { value: 'dont_know_start', label: 'I don\'t know where to start', emoji: '🤷‍♀️' },
        { value: 'hate_routines', label: 'I hate rigid routines', emoji: '🗓️' }
      ]
    },
    environment: {
      title: "Where do you live most of the time?",
      subtitle: "Your surroundings shape your energy and what's realistic.",
      isMultiSelect: false,
      options: [
        { value: 'urban_city', label: 'Urban city', emoji: '🏙️' },
        { value: 'suburban', label: 'Suburban neighborhood', emoji: '🏡' },
        { value: 'college_campus', label: 'College campus', emoji: '🎓' },
        { value: 'small_town_rural', label: 'Small town or rural', emoji: '🌾' },
        { value: 'nomadic', label: 'Nomadic / travel a lot', emoji: '✈️' }
      ]
    },
    climate: {
      title: "What's your climate like?",
      subtitle: "This helps us suggest the right activities for your weather.",
      isMultiSelect: false,
      options: [
        { value: 'very_cold', label: 'Very cold', emoji: '❄️' },
        { value: 'moderate', label: 'Moderate', emoji: '🌤️' },
        { value: 'very_hot', label: 'Very hot', emoji: '☀️' },
        { value: 'changes_lot', label: 'Changes a lot', emoji: '🌪️' }
      ]
    },
    dislikes: {
      title: "What do you not vibe with?",
      subtitle: "We'll avoid suggesting anything that makes you groan.",
      isMultiSelect: true,
      options: [
        { value: 'waking_early', label: 'Waking up early', emoji: '🌅' },
        { value: 'intense_workouts', label: 'Intense workouts', emoji: '🏋️‍♀️' },
        { value: 'strict_routines', label: 'Strict routines', emoji: '📋' },
        { value: 'long_focus', label: 'Long focus blocks', emoji: '🔍' },
        { value: 'journaling', label: 'Journaling or writing', emoji: '📝' },
        { value: 'screen_time', label: 'Too much screen time', emoji: '📱' },
        { value: 'meditation', label: 'Meditation or mindfulness', emoji: '🧘‍♀️' },
        { value: 'talking_people', label: 'Talking to people', emoji: '👥' },
        { value: 'overly_scheduled', label: 'Being overly scheduled', emoji: '📅' },
        { value: 'cooking_prep', label: 'Cooking or prepping meals', emoji: '🍳' },
        { value: 'being_outside', label: 'Being outside', emoji: '🌳' }
      ]
    }
  };

  const currentStepKey = steps[step];
  const currentStepData = stepData[currentStepKey];

  return (
    <div className="survey-body">
      <div className="survey-container">
        <Progress value={((step + 1) / steps.length) * 100} />
        <div className="text-4xl mb-4 icon-wrapper">
          {iconsMap[currentStepKey]}
        </div>
        <h1>{currentStepData.title}</h1>
        <p>{currentStepData.subtitle}</p>
        {currentStepData.maxSelections && (
          <p className="text-sm text-purple-600 mt-2">
            Selected: {form[currentStepKey].length} / {currentStepData.maxSelections}
          </p>
        )}

        <div className="options-list">
          {currentStepData.options.map((option) => (
            <OptionCard
              key={option.value}
              option={option.label}
              emoji={option.emoji}
              description={option.description}
              isSelected={form[currentStepKey].includes(option.value)}
              onClick={() => {
                if (currentStepData.maxSelections && form[currentStepKey].length >= currentStepData.maxSelections && !form[currentStepKey].includes(option.value)) return;
                handleOptionToggle(currentStepKey, option.value, currentStepData.isMultiSelect);
              }}
            />
          ))}
        </div>

        <div className="navigation-buttons">
          {step > 0 && <button className="nav-button back" onClick={() => setStep(step - 1)}>Back</button>}
          {step < steps.length - 1
            ? <button className="nav-button next" onClick={() => setStep(step + 1)} disabled={form[currentStepKey].length === 0}>Next</button>
            : <button className="nav-button submit" onClick={handleSubmit} disabled={form[currentStepKey].length === 0}>Let's Get Started! 🚀</button>
          }
        </div>
      </div>
    </div>
  );
}
