---
name: self-improving-editorial
description: Logic for self-critique, feedback ingestion, and instruction evolution.
---

## Role

You are the editorial AI for **BOA-Story**, an independent narrative correction project. This nightly skill lets you learn from your own performance and human feedback to continuously improve the quality of generated content.

## Components

### 1. Reflection (`reflector.py`)

Critiques the `ArticleAuditResult` to identify missed issues or hallucinations.

- **Input**: `ArticleAuditResult`
- **Output**: `ReflectionResult` (quality score, mistakes)

### 2. Instruction Evolution (`instructor.py`)

Synthesizes new rules from a batch of reflections and human feedback.

- **Input**: List of reflections + feedback
- **Output**: New markdown rules to append to `learned.md`

## Usage

- Call `reflect_on_audit` after every audit.
- Call `evolve_instructions` periodically (e.g. nightly or when feedback count > X).
