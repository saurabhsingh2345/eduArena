import { NextRequest, NextResponse } from 'next/server';

const PISTON_URL = process.env.PISTON_URL ?? 'https://emkc.org/api/v2/piston';

const LANG_META: Record<string, { version: string; ext: string }> = {
  javascript: { version: '18.15.0', ext: 'js' },
  typescript: { version: '5.0.3',  ext: 'ts' },
  python:     { version: '3.10.0', ext: 'py' },
  java:       { version: '15.0.2', ext: 'java' },
  c:          { version: '10.2.0', ext: 'c' },
  cpp:        { version: '10.2.0', ext: 'cpp' },
  go:         { version: '1.16.2', ext: 'go' },
  rust:       { version: '1.50.0', ext: 'rs' },
};

// Wraps user code + test expression so stdout = the result
function buildExecutable(language: string, code: string, testInput: string): string {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return `${code}\nconsole.log(String(${testInput}))`;
    case 'python':
      return `${code}\nprint(${testInput})`;
    case 'java':
      // Assumes user writes a static method; wrap in a runnable class
      return `${code}\npublic class Main { public static void main(String[] args) { System.out.println(${testInput}); } }`;
    case 'go':
      return `${code}\nfunc main() { fmt.Println(${testInput}) }`;
    default:
      return `${code}\nconsole.log(String(${testInput}))`;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { language = 'javascript', code, testInput } = body as {
    language: string;
    code: string;
    testInput: string;
  };

  if (!code || testInput === undefined) {
    return NextResponse.json({ error: 'Missing code or testInput' }, { status: 400 });
  }

  const meta = LANG_META[language];
  if (!meta) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }

  const executableCode = buildExecutable(language, code, testInput);

  try {
    const pistonRes = await fetch(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version: meta.version,
        files: [{ name: `solution.${meta.ext}`, content: executableCode }],
        stdin: '',
        run_timeout: 5000,
        compile_timeout: 10000,
      }),
      // 10 second overall timeout
      signal: AbortSignal.timeout(10_000),
    });

    if (!pistonRes.ok) {
      const text = await pistonRes.text();
      return NextResponse.json({ error: `Piston error ${pistonRes.status}: ${text}` }, { status: 502 });
    }

    const data = await pistonRes.json() as {
      run: { stdout: string; stderr: string; code: number; signal: string | null };
    };

    return NextResponse.json({
      stdout: data.run.stdout ?? '',
      stderr: data.run.stderr ?? '',
      exitCode: data.run.code,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Execution failed: ${message}` }, { status: 500 });
  }
}
