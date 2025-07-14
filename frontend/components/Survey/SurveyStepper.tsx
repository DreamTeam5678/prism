import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { submitSurvey } from '../../lib/saveSurvey';
import toast from 'react-hot-toast';
import { Sparkles} from './Sparkles';
import { Progress } from './Progress';
import { IconClipboardList, IconUser, IconMapPin, IconCloud, IconSun } from '@tabler/icons-react';

const steps = [
  'role', 'planningStyle', 'idealSelf', 'blockers', 'dislikes', 'locationType', 'climate', 'energyAccess', 'supportStyle'
];

const colorPalette = {
  orange: '#dd6d42',
  tan: '#ebdbb4',
  blue: '#d0e4ec',
  lightGray: '#ededed',
  lavender: '#9b87a6',
  sage: '#9ba885',
};

const icons = [
  <IconUser key="role" size={32} />, 
  <IconClipboardList key="planning" size={32} />,
  <IconUser key="ideal" size={32} />, 
  <IconClipboardList key="blockers" size={32} />,
  <IconClipboardList key="dislikes" size={32} />, 
  <IconMapPin key="location" size={32} />,
  <IconSun key="climate" size={32} />, 
  <IconCloud key="energy" size={32} />,
  <IconUser key="support" size={32} />
];


export default function SurveyStepper() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    role: '', planningStyle: '', idealSelf: '', blockers: '', dislikes: '',
    locationType: '', climate: '', energyAccess: '', supportStyle: ''
  });

  const { data: session } = useSession();
  const router = useRouter();

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    try {
      await submitSurvey({
        userId: session?.user?.id!,
        ...form,
        idealSelf: form.idealSelf.split(','),
        blockers: form.blockers.split(','),
        dislikes: form.dislikes.split(','),
        environment: {
          locationType: form.locationType,
          climate: form.climate,
          energyAccess: form.energyAccess
        },
        createdAt: new Date().toISOString()
      });
      router.push('/dashboard');
    } catch {
      toast.error('Failed to submit');
    }
  };

  const labels: { [key: string]: string } = {
    role: 'What’s your current role?',
    planningStyle: 'How do you currently plan?',
    idealSelf: 'Describe your ideal self (comma separated)',
    blockers: 'What blocks your progress? (comma separated)',
    dislikes: 'What planning methods do you dislike?',
    locationType: 'Preferred environment: urban, nature, hybrid?',
    climate: 'Preferred climate?',
    energyAccess: 'How consistent is your energy?',
    supportStyle: 'What type of support do you respond to best?'
  };

  const inputs = (
    <input
      type="text"
      className="w-full mt-4 p-3 border border-gray-300 rounded-xl text-lg"
      value={form[steps[step] as keyof typeof form] || ''}
      onChange={(e) => handleChange(steps[step], e.target.value)}
    />
  );

  return (
    <div className="relative min-h-screen bg-[#fefefc] flex flex-col items-center justify-center px-6 py-12">
      <Sparkles
        background="transparent"
        minSize={0.4}
        maxSize={1}
        particleDensity={30}
        className="absolute inset-0 z-0"
        particleColor="#9b87a6"
      />
      <Progress value={((step + 1) / steps.length) * 100} className="w-full max-w-xl mb-6 z-10" />
      <div className="bg-white z-10 relative shadow-xl rounded-3xl p-10 w-full max-w-xl text-center">
        <div className="text-4xl text-gray-800 mb-4 flex justify-center">{icons[step]}</div>
        <h1 className="text-2xl font-bold mb-4 text-[#444]">{labels[steps[step]]}</h1>
        {inputs}
        <div className="flex justify-between mt-6">
          {step > 0 && (
            <button
              className="text-[#9ba885] hover:text-black font-medium"
              onClick={() => setStep((prev) => prev - 1)}>
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              className="bg-[#dd6d42] text-white font-semibold px-6 py-2 rounded-full hover:opacity-90"
              onClick={() => setStep((prev) => prev + 1)}>
              Next
            </button>
          ) : (
            <button
              className="bg-[#9b87a6] text-white font-semibold px-6 py-2 rounded-full hover:opacity-90"
              onClick={handleSubmit}>
              <span>{step === steps.length - 1 ? "Let’s Get Started!" : "Next"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
