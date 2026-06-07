import Groq from 'groq-sdk';

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const COURSE_GENERATION_PROMPT = (topic: string, difficulty: string, durationMinutes: number) => `
You are an expert instructional designer creating an immersive course on "${topic}"
for ${difficulty} level learners. Duration: ${durationMinutes} minutes.

Generate a complete course as a JSON object with this EXACT structure:

{
  "title": "...",
  "description": "...",
  "segments": [
    {
      "id": "seg_1",
      "text": "Full narration text for this segment (2-4 sentences)",
      "animationStyle": "type",
      "emphasis": ["key", "words", "to", "highlight"],
      "durationSeconds": 15
    }
  ],
  "interactions": [
    {
      "id": "int_1",
      "afterSegmentId": "seg_2",
      "type": "mcq",
      "xpReward": 50,
      "timeLimit": 30,
      "data": {
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0,
        "explanation": "Why this is correct..."
      }
    },
    {
      "id": "int_2",
      "afterSegmentId": "seg_5",
      "type": "code",
      "xpReward": 100,
      "timeLimit": 120,
      "data": {
        "instruction": "Complete the function that...",
        "language": "javascript",
        "starterCode": "function example() {\\n  // your code here\\n}",
        "testCases": [
          { "input": "example()", "expectedOutput": "result" }
        ],
        "solution": "function example() { return 'result'; }"
      }
    },
    {
      "id": "int_3",
      "afterSegmentId": "seg_8",
      "type": "fill_blank",
      "xpReward": 30,
      "timeLimit": 20,
      "data": {
        "sentence": "In JavaScript, ___ is used to declare a constant variable.",
        "blanks": ["const"],
        "hint": "Think about ES6 declarations"
      }
    }
  ]
}

Rules:
- Generate 8-12 segments for a ${durationMinutes} minute course
- Place interactions after every 2-3 segments (3-4 total interactions minimum)
- animationStyle must be one of: "type", "zoom", "fade", "reveal" — vary them
- Make questions genuinely test understanding, not just recall
- Code challenges must be simple enough to run in a browser sandbox
- Vary interaction types — never two MCQs in a row
- Explanation fields are mandatory — they show after answering
- Return ONLY the JSON object, no markdown, no preamble, no trailing text
`;

export async function generateCourseContent(topic: string, difficulty: string, durationMinutes: number) {
  let raw = '';

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: COURSE_GENERATION_PROMPT(topic, difficulty, durationMinutes) }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    raw = completion.choices[0].message.content ?? '';

    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    return JSON.parse(raw);
  } catch {
    // Retry once with stricter prompt
    const retry = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: COURSE_GENERATION_PROMPT(topic, difficulty, durationMinutes) },
        { role: 'assistant', content: raw || '' },
        { role: 'user', content: 'The response was not valid JSON. Return ONLY the JSON object with no other text.' }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    let retryRaw = retry.choices[0].message.content ?? '';
    retryRaw = retryRaw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(retryRaw);
  }
}
