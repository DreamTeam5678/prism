// frontend/lib/saveSurvey.ts
export async function submitSurvey(surveyData: any) {
  const res = await fetch('/api/survey', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(surveyData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || 'Failed to save survey.');
  }

  return await res.json();
}