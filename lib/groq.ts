import Groq from 'groq-sdk';

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const COURSE_GENERATION_PROMPT = (topic: string, difficulty: string, durationMinutes: number) => {
  const segmentCount = Math.max(16, Math.round(durationMinutes * 1.1));
  const interactionCount = Math.max(6, Math.round(segmentCount / 2.5));

  return `You are a world-class instructional designer and educator. Create a deeply engaging, technically rigorous course on "${topic}" for ${difficulty}-level learners. This course will be displayed as a full-screen narrated presentation — every word will be read aloud, so write like a compelling human teacher, not a textbook.

Duration: ${durationMinutes} minutes → generate exactly ${segmentCount} segments.

═══ COURSE ARCHITECTURE ═══
Follow this learning arc precisely:

Segments 1-2 → HOOK: Open with a shocking fact, a famous failure, or a "what if" scenario that makes the learner feel the weight of this topic. No definitions yet.

Segments 3-4 → WHY IT MATTERS: Real companies, real numbers, real consequences. What breaks or thrives based on mastery of this topic?

Segments 5-${Math.round(segmentCount * 0.5)} → CORE CONCEPTS: One clear idea per segment. Build from scratch — no assumed knowledge. Use brick-by-brick progression.

Segments ${Math.round(segmentCount * 0.5) + 1}-${Math.round(segmentCount * 0.75)} → DEEP DIVE: How it actually works under the hood. Common mistakes, gotchas, edge cases. Include what beginners always get wrong.

Segments ${Math.round(segmentCount * 0.75) + 1}-${segmentCount} → SYNTHESIS: Real patterns, best practices, mental models. When to use vs. avoid. Leave the learner with actionable takeaways.

═══ SEGMENT WRITING RULES ═══
Each "text" field must be 3-5 rich sentences that:
1. Open with a strong hook (surprising fact, vivid analogy, concrete number, or bold claim)
2. Explain the concept using a real-world parallel that clicks instantly
3. Include a specific, concrete example — actual code, a named company, a precise number
4. Close with something that creates forward momentum — a question, a hint at what's coming, or a "now you'll never see this the same way"
5. Sound natural when spoken aloud — no bullet points, no "in this segment we will"

animationStyle options: "type" (typewriter, best for definitions and key statements), "zoom" (best for big reveals and impact moments), "fade" (best for transitions and context), "reveal" (best for building sequences and lists). Vary them meaningfully.

durationSeconds: 18-28 per segment (longer for complex ideas, shorter for punchy reveals).

═══ INTERACTION RULES ═══
Generate exactly ${interactionCount} interactions, placed after every 2-3 segments.
Use ALL four types. Mix in this order: mcq → concept_match → fill_blank → code → mcq → fill_blank → concept_match → code → ...

MCQ rules:
- Question must test understanding, not recall — ask "which scenario", "why would", "what happens when"
- Wrong options must be plausible misconceptions, not obviously wrong
- explanation: 2-3 sentences explaining the correct answer and why the distractors fail
- xpReward: 50, timeLimit: 30

fill_blank rules:
- Sentence must have exactly one blank (___)
- The blank must test a key technical term from the preceding segments
- hint: a clue that helps without giving it away
- xpReward: 30, timeLimit: 20

code rules:
- Real, runnable JavaScript/Python/etc. snippet
- Task: complete a function, fix a bug, or write a one-liner
- testCases: 2-3 concrete input/output pairs
- solution: clean working code
- xpReward: 100, timeLimit: 120

concept_match rules:
- 4-5 pairs of key terms and precise (not circular) definitions
- definitions must be concrete: "A mechanism that..." not just "It is..."
- xpReward: 40, timeLimit: 60

═══ OUTPUT FORMAT ═══
Return ONLY this JSON — no markdown, no commentary, nothing else:

{
  "title": "A compelling, specific title (not generic)",
  "description": "3-4 sentence overview of what learners will master and why it matters",
  "segments": [
    {
      "id": "seg_1",
      "text": "Rich 3-5 sentence narration following all writing rules above",
      "animationStyle": "zoom",
      "emphasis": ["key", "technical", "terms", "from", "this", "segment"],
      "durationSeconds": 22
    }
  ],
  "interactions": [
    {
      "id": "int_1",
      "afterSegmentId": "seg_3",
      "type": "mcq",
      "xpReward": 50,
      "timeLimit": 30,
      "data": {
        "question": "Understanding-test question...",
        "options": ["Plausible A", "Plausible B", "Plausible C", "Plausible D"],
        "correctIndex": 0,
        "explanation": "2-3 sentence explanation of why A is right and what the others miss..."
      }
    },
    {
      "id": "int_2",
      "afterSegmentId": "seg_6",
      "type": "concept_match",
      "xpReward": 40,
      "timeLimit": 60,
      "data": {
        "pairs": [
          { "term": "Term 1", "definition": "Concrete precise definition starting with an action verb or noun..." },
          { "term": "Term 2", "definition": "Concrete precise definition..." },
          { "term": "Term 3", "definition": "Concrete precise definition..." },
          { "term": "Term 4", "definition": "Concrete precise definition..." }
        ]
      }
    },
    {
      "id": "int_3",
      "afterSegmentId": "seg_9",
      "type": "fill_blank",
      "xpReward": 30,
      "timeLimit": 20,
      "data": {
        "sentence": "A sentence with exactly one ___ blank using a key term...",
        "blanks": ["exactterm"],
        "hint": "Think about what concept was introduced in the last few segments"
      }
    },
    {
      "id": "int_4",
      "afterSegmentId": "seg_12",
      "type": "code",
      "xpReward": 100,
      "timeLimit": 120,
      "data": {
        "instruction": "Complete this function that demonstrates a core concept from this topic",
        "language": "javascript",
        "starterCode": "function example(input) {\\n  // complete this\\n}",
        "testCases": [
          { "input": "example('test')", "expectedOutput": "result" }
        ],
        "solution": "function example(input) { return result; }"
      }
    }
  ]
}`;
};

export async function generateCourseContent(topic: string, difficulty: string, durationMinutes: number) {
  let raw = '';

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: COURSE_GENERATION_PROMPT(topic, difficulty, durationMinutes) }],
      max_tokens: 8000,
      temperature: 0.75,
    });

    raw = completion.choices[0].message.content ?? '';
    raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    // Extract JSON if wrapped in other text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];

    return JSON.parse(raw);
  } catch {
    // Retry with stricter settings
    const retry = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: COURSE_GENERATION_PROMPT(topic, difficulty, durationMinutes) },
        { role: 'assistant', content: raw || '' },
        { role: 'user', content: 'The previous response was not valid JSON. Return ONLY the JSON object — no markdown fences, no explanation, just the raw JSON starting with {' },
      ],
      max_tokens: 8000,
      temperature: 0.3,
    });

    let retryRaw = retry.choices[0].message.content ?? '';
    retryRaw = retryRaw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const jsonMatch = retryRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) retryRaw = jsonMatch[0];
    return JSON.parse(retryRaw);
  }
}
