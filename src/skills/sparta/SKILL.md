---
name: sparta-skills
description: Domain-specific expertise library covering 40+ faculties from Physical Sciences to Emergency Response
---

# SPARTA Skills

Full skills database at `specs/storage/SPARTA-SKILLS.md` (919 lines, 40+ faculties).

## Available Faculty Levels

| Level | Type | Coverage |
|---|---|---|
| **Doctorate-to-Professor** | Deep analytical | Physical Sciences, Medical, Engineering, Law |
| **Journeyman-to-Master** | Practical applied | Trades, Culinary, Hospitality, Creative |
| **Variable** | Context-dependent | Emerging/Interdisciplinary, cross-domain |

## Core Skill Categories

- **Physical & Life Sciences** — Math, Physics, Chemistry, Biology, Geology, Astronomy
- **Medical & Clinical** — Anatomy, Pharmacology, Surgery, Diagnosis, Epidemiology
- **Engineering** — Mechanical, Electrical, Civil, Chemical, Software, Aerospace
- **Business & Finance** — Accounting, Strategy, Marketing, Investment, Risk
- **Legal** — Contract, Criminal, Constitutional, IP, Regulatory
- **Security & Emergency** — Cybersecurity, Public Safety, Emergency Response
- **Creative & Media** — Writing, Design, Music, Film, Broadcast, Publishing
- **Professional Trades** — Electrical, Plumbing, Construction, Manufacturing, Automotive
- **Healthcare Operations** — Hospital Admin, Allied Health, Clinical Research
- **Government & Public Admin** — Policy, International Development, Campaigns

## Risk Model

Each skill has a risk level: Critical, High, Moderate, or Low, which governs
disclaimer requirements, confidence bounds, and user confirmation needs.
See `specs/storage/SPARTA-SKILLS.md` for full per-faculty mapping.

## Loading Full Detail

To use a specific skill, reference its faculty number and request deep analysis.
The full definitions in SPARTA-SKILLS.md include per-skill confidence thresholds,
cross-validation rules, and recovery strategies for each domain.
