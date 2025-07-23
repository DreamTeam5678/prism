// frontend/components/Survey/SurveyStepper.tsx
'use client';
import { JSX, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ClipboardList, /*MapPin, Cloud, Sun, */Target, AlertCircle, ThumbsDown, /*Home, Thermometer */} from 'lucide-react';
import styles from './Survey.module.css';
import { submitSurvey } from '@/lib/saveSurvey';
import React from 'react';

const steps = [
  'currentMode',
  'idealSelf',
  'blockers',
  'dislikes'
] as const;



type StepKey = typeof steps[number];

const iconsMap: Record<StepKey, JSX.Element> = {
  currentMode: <User size={32} />, 
  //planningStyle: <ClipboardList size={32} />, //
  idealSelf: <Target size={32} />, 
  blockers: <AlertCircle size={32} />, 
 // environment: <Home size={32} />, //
 // climate: <Thermometer size={32} />, //
  dislikes: <ThumbsDown size={32} />
};

const Progress = ({ value }: { value: number }) => (
  <div className={styles["progress-bar"]}>
    <div className={styles["progress-bar-filled"]} style={{ width: `${value}%` }} />
  </div>
);

const OptionCard = ({ option, isSelected, onClick, emoji, description }: { option: string; isSelected: boolean; onClick: () => void; emoji?: string; description?: string }) => (
  <div className={`${styles["option-card"]} ${isSelected ? styles["selected"] : ""}`} onClick={onClick}>
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
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<StepKey, string[]>>({
    currentMode: [],idealSelf: [], blockers: [], dislikes: []
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
      await submitSurvey(form);
      router.push('/calendar');
    } catch(error: any) {
      alert(error.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };
 
  type stepConfig = {
    title: string;
    subtitle: string;
    isMultiSelect: boolean;
    maxSelections?: number;
    options: {
      value: string;
      label: string;
      emoji: string;
      description?: string;
    }[];
  };

  const stepData: Record<StepKey, stepConfig> = {
    currentMode: {
      title: "Your Current Mode",
      subtitle: "This grounds us in where you are now.",
      isMultiSelect: false,
      options: [
        { value: 'student', label: 'Student', emoji: '🎓' },
        { value: 'professional', label: 'Professional', emoji: '💼' },
        { value: 'personal', label: 'Personal', emoji: '🌟' }
      ]
    },
    /*
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
    */
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
        { value: 'burnt_out', label: 'I get burnt out from over-scheduling', emoji: '😩' },
        { value: 'lose_motivation', label: 'I lose motivation quickly', emoji: '💤' },
        { value: 'get_distracted', label: 'I get distracted too much', emoji: '📱' },
        { value: 'productivity_guilt', label: 'I feel guilty when I\'m unproductive', emoji: '📉' },
        { value: 'dont_know_start', label: 'I don\'t know where to start', emoji: '🤷‍♀️' },
      ]
    },
    /*
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
    */
    dislikes: {
      title: "What do you not vibe with?",
      subtitle: "We'll avoid suggesting anything that makes you groan.",
      isMultiSelect: true,
      options: [
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
    <div className={styles["survey-body"]}>
      <div className={styles["survey-container"]}>
        <Progress value={((step + 1) / steps.length) * 100} />
        <div className={`${styles["icon-wrapper"]} text-4xl mb-4`}>
          {iconsMap[currentStepKey]}
        </div>
        <h1>{currentStepData.title}</h1>
        <p>{currentStepData.subtitle}</p>
        {currentStepData.maxSelections && (
          <p className={`${styles.selectionCount} text-sm text-purple-600 mt-2`}>
            Selected: {form[currentStepKey].length} / {currentStepData.maxSelections}
          </p>
        )}

        <div className={styles["options-list"]} id="options-list">
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

        <div className={styles["navigation-buttons"]}>
          {step > 0 && <button className={`${styles["nav-button"]} ${styles["back"]}`} onClick={() => setStep(step - 1)}>Back</button>}
          {step < steps.length - 1
            ? <button className={`${styles["nav-button"]} ${styles["next"]}`} onClick={() => setStep(step + 1)} disabled={form[currentStepKey].length === 0}>Next</button>
            : <button className={`${styles["nav-button"]} ${styles["submit"]}`} onClick={handleSubmit} disabled={form[currentStepKey].length === 0}>Let's Get Started! 🚀</button>
          }
        </div>
      </div>
    </div>
  );
}