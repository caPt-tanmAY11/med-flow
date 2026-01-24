import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { patientName, age, gender, vitals, history } = await req.json();

    const safeVitals = Array.isArray(vitals) ? vitals.slice(-5) : [];
    const safeHistory = Array.isArray(history) ? history.slice(0, 10) : [];

    const prompt = `
You are an expert medical AI assistant for nurses.

Patient: ${patientName} (${gender}, ${age || 'Unknown Age'})

Recent Vital Signs:
${JSON.stringify(safeVitals)}

Medical History:
${JSON.stringify(safeHistory)}

Task:
1. Identify 3 key trends or risks.
2. Give 3 actionable nursing recommendations.

Output JSON only:
{
  "insights": [],
  "recommendations": []
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return NextResponse.json({ error: 'AI failed' }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });
    }

    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('AI Analysis Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
