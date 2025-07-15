/*

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    if (status === 'authenticated') fetchProfile();
  }, [status]);

  if (status === 'loading' || !profile) {
    return <p className="p-8">Loading your dashboard...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">🌟 Welcome to Prism, {session?.user?.name || 'friend'}!</h1>

      <p className="text-lg mb-6 text-gray-700">
        We’ve personalized your space based on your vibe. Here’s a snapshot of your planning style and energy needs:
      </p>

      <div className="bg-white shadow-lg rounded-xl p-6 space-y-4 border border-indigo-100">
        <div>
          <h2 className="font-semibold">🧠 Planning Style:</h2>
          <p>{profile.planningStyle}</p>
        </div>

        <div>
          <h2 className="font-semibold">💭 Ideal Self Tags:</h2>
          <ul className="list-disc ml-5 text-gray-700">
            {profile.idealSelf.map((tag: string, idx: number) => (
              <li key={idx}>{tag}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">🌤️ Energy Environment:</h2>
          <p>{[profile.locationType, profile.climate, profile.energyAccess].filter(Boolean).join(", ")}</p>
        </div>

        <div>
          <h2 className="font-semibold">🤝 Support Style:</h2>
          <p>{profile.supportStyle || "Not specified"}</p>
        </div>

        <button
          onClick={() => router.push('/calendar')}
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-all"
        >
          Open My Calendar
        </button>
      </div>
    </div>
  );
}
*/
// frontend/pages/dashboard.tsx

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import "../components/Dashboard/Dashboard.css"; 
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    if (status === 'authenticated') fetchProfile();
  }, [status]);

  if (status === 'loading' || !profile) {
    return <p className="p-8">Loading your dashboard...</p>;
  }
  const generatePersonaLabel = (tags: string[]) => {
    const keywords = {
        'Creative & fulfilled': 'Creative',
        'Calm & balanced': 'Zen',
        'Disciplined & structured': 'Disciplined',
        'Productive without burnout': 'Balanced',
        'Energetic & inspired': 'Inspired',
        'Mentally clear & intentional': 'Clear-Minded',
        'Flexible but consistent': 'Adaptable',
        'Focused & driven': 'Driven',
    };

    const matched = tags.map(tag => keywords[tag]).filter(Boolean);
    return matched.length ? matched.slice(0, 2).join(' ') : 'Mindful Explorer';
    };

  const vibeName = (() => {
    if (!profile.idealSelf || profile.idealSelf.length === 0) return "your unique self";
    const tags = profile.idealSelf;
    const vibeMap: Record<string, string> = {
      "Calm & balanced": "Zen Seeker",
      "Creative & fulfilled": "Creative Spirit",
      "Disciplined & structured": "Focus Architect",
      "Productive without burnout": "Flow Builder",
      "Flexible but consistent": "Balance Bender",
      "Energetic & inspired": "Firecracker",
      "Mentally clear & intentional": "Clarity Coach",
      "Focused & driven": "Deep Diver"
    };
    const picked = tags.map((tag: string) => vibeMap[tag] || tag);
    return picked.length === 1 ? picked[0] : `${picked[0]} + ${picked[1]}`;
  })();

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">✨ Welcome, {session?.user?.name || 'friend'}!</h1>
      <p className="text-lg mb-6 text-gray-700">
        You’re a <strong>{generatePersonaLabel(profile.idealSelf)}</strong>. Prism will help you flow through your week with the right mix of rest, focus, and joy.
      </p>
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/calendar')}
            className="bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white px-8 py-3 rounded-xl text-lg shadow-md transition-all"
          >
            Open My Personalized Calendar
          </button>
        </div>
      </div>
  );
}
