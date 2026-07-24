# Agent Infrastructure

## Runtime Agent: ZeroClaw

The active autonomous agent runtime is **ZeroClaw** (`zeroclaw/` — cloned from [zeroclaw-labs/zeroclaw](https://github.com/zeroclaw-labs/zeroclaw)).

- **Auth**: Gemini OAuth (your Google subscription, no API key needed)
- **Config**: `.zeroclaw/config.json`
- **Launch**: `.zeroclaw/run.bat` (Windows)
- **Skills**: `.zeroclaw/skills/`

To start the agent: run `.zeroclaw/run.bat` after completing `zeroclaw auth login --provider gemini` once.

---

## Coding Assistant Skills (Antigravity)

The following skills are available to the **Antigravity coding assistant** within this workspace.
These are editorial guidelines — NOT the ZeroClaw runtime skill definitions.
The ZeroClaw runtime skill definitions live in `.zeroclaw/skills/`.

<available_skills>

- name: article-generator
    description: Generates high-quality, Guardian-style African business and tourism articles from raw news ingestion.
    path: .agent/skills/article-generator
- name: proactive-editorial
    description: Scans the BoA content database for articles that need auditing or refreshing.
    path: .agent/skills/proactive-editorial
- name: self-improving-editorial
    description: Logic for self-critique, feedback ingestion, and instruction evolution.
    path: .agent/skills/self-improving-editorial

</available_skills>
