import { evaluateSystemOne } from "../server/judge.mjs";

try {
  const result = await evaluateSystemOne(
    {
      state: { purpose: "TypeSafe-as-a-Judge setup connectivity check" },
      questions: {
        ready: {
          type: "noul",
          instructions: "Is this a setup connectivity check?",
          criteria: {
            true: "The state explicitly describes a setup connectivity check.",
            false: "The state does not describe a setup connectivity check.",
          },
        },
      },
    },
    { maxAttempts: 1 },
  );
  process.stdout.write(`Connected to TypeSafe (${result.model}).\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
