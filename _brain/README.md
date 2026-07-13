# AI Nexus — AI Project Control System

AI Nexus is a **state-driven control framework** for AI-assisted software development.

It does not contain application code. It contains the **governance system that tells an AI how to plan, structure, and build a project** — enforcing deterministic behavior, preventing runaway token usage, and guaranteeing complete outputs.

---

## Why This Exists

Most AI-assisted projects break down because:

- The AI makes assumptions about requirements
- Planning and coding get mixed in the same session
- Context bloat causes the AI to lose track of prior decisions
- Outputs are partial, inconsistent, or unrepeatable

AI Nexus fixes this with a strict **4-state execution model** and a memory system that keeps context minimal and controlled.

---

## How It Works

All AI behavior is governed by `_brain/claude.md` (the brain controller).

The AI moves through four states in order. No state can be skipped.

| State | Name | What Happens |
|---|---|---|
| 1 | BOOTSTRAP_MODE | AI collects project specs. No files written. No code. |
| 2 | CONFIRMATION_LOCK | AI presents plan. Waits for your approval. |
| 3 | SYSTEM_GENERATION | AI writes the full `_brain/` structure. No code yet. |
| 4 | EXECUTION_MODE | AI executes one task at a time. Updates memory. Stops. |

---

## Quick Start

### Step 1 — Add AI Nexus to your project

Open a terminal in your project's root folder and run:

```bat
setup.bat
```

This downloads and installs the `_brain/` system into your project automatically.

> **What setup.bat does:**
> 1. Deletes any existing `_brain/` folder in your project
> 2. Clones the AI Nexus repository from GitHub into a temporary `_brain/` folder
> 3. Extracts only the `_brain/` contents from the clone (discards everything else)
> 4. Flattens them into your project's `_brain/` folder
> 5. Cleans up and confirms completion
>
> After it runs, your project will have a `_brain/` folder with the full AI Nexus system ready to use.

---

### Step 2 — Start a new project with AI

Open a new AI chat session (Claude, ChatGPT, or any LLM).

Copy and paste the contents of `_brain/prompts/bootstrap_prompt.md` into the chat.

The AI will enter BOOTSTRAP_MODE and ask you 8 questions about your project. Answer them.

---

### Step 3 — Review and approve the plan

After you answer the questions, the AI moves to CONFIRMATION_LOCK.

It will present:
- A feature classification (what to build now, defer, or reject)
- A dependency map
- A high-level architecture

Reply with **confirm**, **approved**, or **proceed** to continue.

The AI will then generate the full `_brain/` planning structure for your project (SYSTEM_GENERATION).

---

### Step 4 — Build, one task at a time

For every new session where you want to continue building:

Copy and paste the contents of `_brain/prompts/continue_prompt.md` into a new chat.

The AI will:
1. Read `_brain/progress/progress.md` and `_brain/summaries/current_state.md`
2. Select the next incomplete task
3. Execute it fully
4. Update the memory files
5. Stop

Repeat this for each session.

---

### Debugging

If something breaks, copy and paste the contents of `_brain/prompts/debug_prompt.md` into a chat, then describe the problem.

The AI will fix only what is broken — no refactoring, no feature additions.

---

## Folder Structure

```
_brain/
├── claude.md               ← Brain controller (DO NOT MODIFY)
├── prompts/                ← Paste these into your AI sessions
│   ├── bootstrap_prompt.md ← Start a new project
│   ├── continue_prompt.md  ← Resume work
│   └── debug_prompt.md     ← Fix something broken
├── memory/                 ← Project context and architecture
│   ├── app_context.md
│   ├── system_architecture.md
│   └── glossary.md
├── progress/               ← Task tracking
│   ├── progress.md         ← AI reads this every session
│   └── backlog.md
├── tasks/                  ← Task rules and templates
│   ├── task_rules.md
│   └── task_templates.md
├── decisions/              ← Architecture and scope decisions
│   ├── decision_log.md
│   └── rejected_options.md
├── timelines/              ← Technical and business timelines
│   ├── actual_timeline.md
│   └── reported_timeline.md
├── summaries/              ← State snapshots
│   ├── current_state.md    ← AI reads this every session
│   └── weekly_summary.md
├── interaction/            ← AI response rules
│   ├── assumptions.md
│   └── response_rules.md
├── governance/             ← Scope and authority rules
│   ├── rules.md
│   └── scope.md
├── security/               ← Auth and secrets policy
│   ├── auth_boundaries.md
│   └── secrets_policy.md
├── deployment/             ← Deployment plan and environments
│   ├── deployment.md
│   └── environments.md
├── releases/               ← Versioning and changelog
│   ├── changelog.md
│   └── versioning.md
├── skills/                 ← Tech stack and references
│   ├── skills.md
│   └── resources.md
└── guides/
    └── new_machine_setup.md ← Onboarding a new machine or developer
```

---

## Token Efficiency

AI Nexus is designed to keep context small and predictable.

| Metric | Uncontrolled AI | With AI Nexus |
|---|---|---|
| Files read per session | All (full repo scan) | 2–3 files max |
| Tasks per session | Multiple (unbounded) | Exactly one |
| Token usage (medium project) | ~250,000 | ~90,000 |
| Reduction | — | ~55–65% |

---

## Rules

- `claude.md` is the only file that controls AI behavior — never modify it during a project
- All other `_brain/` files are data — the AI reads and writes them, you can read them anytime
- Never skip a state
- Never ask the AI to execute multiple tasks in one session
- If something is unclear, consult `interaction/assumptions.md` — the AI is required to ask rather than guess

---

## Who This Is For

- Developers building serious AI-assisted projects
- Anyone hitting token limits or losing context across sessions
- Teams who need predictable, repeatable AI outputs
- Long-running or multi-phase builds where consistency matters

---

## License

Free to use and modify.
