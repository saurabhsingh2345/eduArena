import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Build a tight, context-aware prompt per interaction type
function buildPrompt(ctx: TutorContext): string {
  const base = `You are an expert tutor embedded in an interactive learning platform.
Be concise (3-5 sentences max), conversational, and focused on the specific struggle.
Never give the full answer — guide the learner to the insight themselves.
Current lesson segment: "${ctx.segmentText}"`;

  switch (ctx.interactionType) {
    case 'code': {
      const errorSection = ctx.errorMessage
        ? `\nThe code produced this error:\n${ctx.errorMessage}`
        : ctx.failedTests
        ? `\nFailed test cases:\n${ctx.failedTests.map((t) => `  Input: ${t.input} → Expected: ${t.expected}, Got: ${t.actual}`).join('\n')}`
        : '';
      return `${base}

The learner is solving this coding challenge: "${ctx.challengeText}"
Language: ${ctx.language ?? 'javascript'}
Starter code: \`\`\`\n${ctx.starterCode ?? ''}\n\`\`\`
Their current code: \`\`\`\n${ctx.userCode ?? ''}\n\`\`\`${errorSection}

Provide a targeted hint that addresses the specific issue without solving it.
If there's an error, explain what the error means in plain terms first.`;
    }

    case 'mcq':
      return `${base}

The learner answered an MCQ wrong.
Question: "${ctx.challengeText}"
Their answer: "${ctx.userAnswer}"
Correct answer: "${ctx.correctAnswer}"

Explain why their answer is incorrect and guide them toward understanding the right concept. Don't just state the correct answer — explain the underlying reasoning.`;

    case 'fill_blank':
      return `${base}

Fill-in-the-blank: "${ctx.challengeText}"
The learner is stuck. Hint available: "${ctx.hint ?? 'none'}"

Give a slightly more specific nudge than the existing hint — think aloud about what the blank is testing.`;

    case 'concept_match':
      return `${base}

Concept matching exercise. The learner is struggling to match terms to definitions.
${ctx.challengeText}

Explain the key differences between the concepts they're confusing, using a memorable analogy or concrete example.`;

    default:
      return `${base}\n\nThe learner needs help understanding the current topic. Give a clear, encouraging explanation.`;
  }
}

interface FailedTest { input: string; expected: string; actual: string; }

interface TutorContext {
  segmentText: string;
  interactionType: 'code' | 'mcq' | 'fill_blank' | 'concept_match' | string;
  challengeText: string;
  userCode?: string;
  starterCode?: string;
  language?: string;
  errorMessage?: string;
  failedTests?: FailedTest[];
  userAnswer?: string;
  correctAnswer?: string;
  hint?: string;
}

export async function POST(req: NextRequest) {
  const ctx = await req.json() as TutorContext;

  const prompt = buildPrompt(ctx);

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.6,
    stream: true,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
