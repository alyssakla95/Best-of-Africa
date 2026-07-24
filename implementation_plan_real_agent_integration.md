# Real Agent Integration (Phase 4)

Integrate the `nanobot` AI orchestrator and `article-generator` skill into the asynchronous task pipeline.

## Proposed Changes

### [Component] ContentGeneratorAutomaton

#### [MODIFY] [ContentGeneratorAutomaton.ts](file:///e:/Best%20Of%20Africa%20Platform/automaton/src/boa/ContentGeneratorAutomaton.ts)

- Replace mock generation logic with a call to the `nanobot` CLI.
- Use `child_process.exec` to invoke `python -m nanobot agent -m "Generate article for: [Title]"`.
- Inject environment variables:
    - `NANOBOT_AGENTS__DEFAULTS__WORKSPACE`: Set to project root to find `.agent/skills`.
    - `NANOBOT_PROVIDERS__OPENROUTER__API_KEY`: Pass any available API key if needed.
- Implement a parser to extract `TITLE`, `SUBTITLE`, `CONTENT`, `SUMMARY`, and `TAGS` from the `nanobot` output.

### [Component] Agent Skills

#### [NEW] [article-generator](file:///e:/Best%20Of%20Africa%20Platform/.agent/skills/article-generator/SKILL.md) (Completed)
- Defines the Guardian-style editorial guidelines and output structure.

#### [MODIFY] [AGENTS.md](file:///e:/Best%20Of%20Africa%20Platform/AGENTS.md) (Completed)
- Registers the `article-generator` skill for discovery.

## Verification Plan

### Automated Tests
- Run `npm run test:generator` in the `automaton` directory.
- Verify that the automaton picks up a task and invokes `nanobot`. (Note: Actual LLM call requires valid API key).

### Manual Verification
- Check the console output of the automaton to see the `nanobot` logs and the parsed result.
- Verify that the `agent_tasks` table in D1 is updated with the real generated content.
