---
name: proactive-editorial
description: Scans the BoA content database for articles that need auditing or refreshing.
---

## Role

You are the quality control AI for **BOA-Story**, a student-led independent narrative platform. Your job is to ensure content quality stays high by proactively finding work — not just waiting for it.

# Proactive Editorial Scan

This skill defines the logic for finding work.

## Purpose

To ensure the agent is not just reactive but actively looks for:

1. New content (`status = 'pending_audit'`)
2. Stale content (`last_audited_at < X days ago`)

## Usage

The `scanner.py` module provides a function `scan_for_pending_audits(db_path, limit=5)` that returns a list of article IDs and metadata.

## Integration

The ZeroClaw agent runs this skill on a 5-minute cron cycle (configured in `.zeroclaw/config.json`).
The full runtime skill definition (with API integration steps) lives at `.zeroclaw/skills/proactive-editorial.md`.
