import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import "../components/Dashboard/Dashboard.css"; 

interface Profile {
  idealSelf: string[];
  // Add other profile properties as needed
}

interface VibeKeywords {
  [key: string]: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (status !== 'authenticated') return;

      try {
        
        setIsLoadingProfile(true);
        setError(null);
        const res = await fetch('/api/profile');
        
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data: Profile = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError('Unable to load profile. Please try again later.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [status]);

  const generatePersonaLabel = (tags: string[] = []): string => {
    const keywords: VibeKeywords = {
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

  const getVibeName = (profile: Profile | null): string => {
    if (!profile?.idealSelf?.length) return "your unique self";

    const tags = profile.idealSelf;
    const vibeMap: VibeKeywords = {
      "Calm & balanced": "Zen Seeker",
      "Creative & fulfilled": "Creative Spirit",
      "Disciplined & structured": "Focus Architect",
      "Productive without burnout": "Flow Builder",
      "Flexible but consistent": "Balance Bender",
      "Energetic & inspired": "Firecracker",
      "Mentally clear & intentional": "Clarity Coach",
      "Focused & driven": "Deep Diver"
    };

    const picked = tags.map(tag => vibeMap[tag] || tag);
    return picked.length === 1 ? picked[0] : `${picked[0]} + ${picked[1]}`;
  };

  if (status === 'loading' || isLoadingProfile) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <p className="text-center">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return null; // This case should be rare due to the redirect
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">
        ✨ Welcome, {session?.user?.name ?? 'friend'}!
      </h1>
      <p className="text-lg mb-6 text-gray-700">
        You’re a <strong>{generatePersonaLabel(profile.idealSelf)}</strong>. 
        Prism will help you flow through your week with the right mix of rest, focus, and joy.
      </p>
      <p className="text-lg mb-6 text-gray-700">
        Your vibe: <strong>{getVibeName(profile)}</strong>
      </p>
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/calendar')}
          className="bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white px-8 py-3 rounded-xl text-lg shadow-md transition-all"
          disabled={isLoadingProfile}
        >
          Open My Personalized Calendar
        </button>
      </div>
    </div>
  );
}