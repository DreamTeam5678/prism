// frontend/pages/survey.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { submitSurvey } from '../lib/saveSurvey'; 
import toast from 'react-hot-toast';

// Extend the session user type to include 'id'
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;

  }
}

export default function SurveyPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // ✅ Local state (this is basic — you can later split into pages or components)
  const [role, setRole] = useState('');
  const [planningStyle, setPlanningStyle] = useState('');
  const [idealSelf, setIdealSelf] = useState<string[]>([]);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [locationType, setLocationType] = useState('');
  const [climate, setClimate] = useState('');
  const [energyAccess, setEnergyAccess] = useState('');
  const [supportStyle, setSupportStyle] = useState('');

  const handleSubmit = async () => {
    try {
      const environment = { locationType, climate, energyAccess };
      
      await submitSurvey({
        userId: session?.user?.id ?? '',
        role,
        planningStyle,
        idealSelf,
        blockers,
        dislikes,
        environment,
        supportStyle,
        createdAt: new Date().toISOString(),
      });

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit survey.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">✨ Prism Onboarding Survey</h1>

      <div className="space-y-4">
        {/* Role Selection */}
        <label className="block">What’s your current role?</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border rounded">
          <option value="">-- Select --</option>
          <option value="student">Student</option>
          <option value="professional">Professional</option>
          <option value="everyday">Everyday User</option>
        </select>

        {/* Planning Style */}
        <label className="block">How do you currently plan?</label>
        <select value={planningStyle} onChange={(e) => setPlanningStyle(e.target.value)} className="w-full p-2 border rounded">
          <option value="">-- Select --</option>
          <option value="frontloader">Frontloader</option>
          <option value="just_tasks">Just task lists</option>
          <option value="reactive">Reactive</option>
          <option value="none">I don’t</option>
        </select>

        {/* Add more inputs for idealSelf, blockers, dislikes, environment, supportStyle */}
        {/* For brevity we’ll use dummy text inputs for now */}

        <label className="block">Ideal Self (comma separated)</label>
        <input value={idealSelf.join(',')} onChange={(e) => setIdealSelf(e.target.value.split(','))} className="w-full p-2 border rounded" />

        <label className="block">Blockers (comma separated)</label>
        <input value={blockers.join(',')} onChange={(e) => setBlockers(e.target.value.split(','))} className="w-full p-2 border rounded" />

        <label className="block">Dislikes (comma separated)</label>
        <input value={dislikes.join(',')} onChange={(e) => setDislikes(e.target.value.split(','))} className="w-full p-2 border rounded" />

        <label className="block">Location Type</label>
        <input value={locationType} onChange={(e) => setLocationType(e.target.value)} className="w-full p-2 border rounded" />

        <label className="block">Climate</label>
        <input value={climate} onChange={(e) => setClimate(e.target.value)} className="w-full p-2 border rounded" />

        <label className="block">Energy Access</label>
        <input value={energyAccess} onChange={(e) => setEnergyAccess(e.target.value)} className="w-full p-2 border rounded" />

        <label className="block">Support Style</label>
        <input value={supportStyle} onChange={(e) => setSupportStyle(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <button onClick={handleSubmit} className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded">
        Finish Setup
      </button>
    </div>
  );
}
