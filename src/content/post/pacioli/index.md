---
title: 'Pacioli — An AI Ledger That Never Trusts the AI With Math'
description: 'A deterministic double-entry bookkeeping engine where the LLM only proposes; every number and every write is computed and gated by Python.'
publishDate: '13 June 2026'
updatedDate: '13 June 2026'
coverImage:
  src: './cover.webp'
  alt: 'Pacioli proposal-review dashboard'
tags: ['Python', 'FastAPI', 'LLM', 'System Design', 'Project']
homePageIdx: 1
---

## The premise

Most "AI accountant" demos hand the language model a spreadsheet and let it report the
totals. That is exactly the thing language models are worst at. Pacioli is built on the
opposite assumption. LLMs are excellent at _parsing intent_ and _structuring_ an instruction
into well-formed accounting actions, and unreliable at _arithmetic_ and _state mutation_, so
the design draws that line explicitly in code.

The model is confined to producing a structured, schema-validated proposal. Every figure in
a report, every balance check, and every byte written to disk is computed and gated by
deterministic Python. Nothing the model emits touches the ledger until a human approves it, and
anything approved can be reverted in a single call. The AI is a convenience at the edge, not a
dependency in the critical path.

> **Key Takeaways**
>
> - The LLM only proposes structured actions. It never computes a figure or writes to the ledger.
> - Every number is recomputed by deterministic Python straight from the ledger rows, so the model's arithmetic is never trusted.
> - Nothing lands without human approval, and every execution can be rolled back from a full byte-exact snapshot.

## Four design decisions

### 1. The model boundary

Every Gemini call runs inside `asyncio.wait_for` with a hard timeout, off the event loop via
`asyncio.to_thread`. A retry helper classifies failures. Timeouts and transient `429`/`5xx`
errors back off and retry; auth and bad-request errors fail fast. The response is then guarded
on three fronts: an empty or blocked candidate, a JSON parse error, and a shape check that
rejects any proposal that isn't a proper object. Each fails _closed_ with an actionable message
rather than leaking a half-parsed structure downstream.

The most interesting part is semantic self-correction. The model's structured output is
validated against a Pydantic schema, and when validation fails the exact validator error is fed
back into the next prompt as explicit `SYSTEM FEEDBACK`:

```text
[SYSTEM FEEDBACK — fix these validation errors and retry:]
write_cell requires cell_ref and new_value
Remember: debits must equal credits.
```

The model repairs its own output, up to a retry cap. That turns the LLM's most common failure
mode, _almost_-valid JSON, from a hard error into a recoverable round-trip.

### 2. Deterministic math

Financial figures are never read out of the model's response. A dedicated report engine
recomputes every report straight from the ledger rows: debits and credits summed per account,
normal-balance direction resolved from the chart of accounts, column positions detected from
header names rather than hardcoded. Each report carries its own self-consistency assertion. A
Trial Balance reports `balanced` only when debits and credits agree to the cent; the Balance
Sheet only when `Assets == Liabilities + Equity`. The model's role in reporting is reduced to a
single token of intent: "show me the balance sheet." The numbers are Python's.

### 3. Defense in depth

- **Atomic state transition.** Approval is one conditional SQL update:
  `UPDATE … SET status='executed' WHERE id=? AND status='pending'`. The double-approval race is
  closed at the database, not in application logic. The losing request sees `rowcount == 0` and
  gets a `409`.
- **Serialized, atomic file I/O.** Every Excel read-modify-write runs under a cross-process
  `FileLock`, writes to a `.tmp` file, and swaps it in with `os.replace`, an atomic rename, so
  a crash mid-save leaves either the whole old file or the whole new one, never a torn `.xlsx`.
- **Double-entry pre-flight.** Before any cell is touched, the proposed debit and credit columns
  are summed and the entire batch aborts if they diverge by more than a cent.

### 4. One-click undo

Every execution captures a full, byte-exact snapshot of the ledger, taken _inside the same file
lock_ that guards the write, so the captured bytes are always a consistent pre-execution state.
The snapshot is stored as a BLOB keyed to the proposal. Because it's the entire file rather than
a computed diff, restoration is total and lossless: one `POST` rolls the ledger back to exactly
where it was.

## The workflow

A proposal moves through a strict state machine: `pending → executed`, or a terminal
reject/expire. The operator reviews a per-cell `old → new` diff, decides, and only then does the
ledger snapshot, flip status atomically, and run the write under the full validation chain. Stale
proposals auto-reject after 15 minutes.

## Stack

FastAPI + Uvicorn, SQLite (WAL) via `aiosqlite` for proposals/snapshots/audit, `openpyxl` for
the ledger, `filelock` for cross-process serialization, Pydantic v2 for the validation contract,
and Google Gemini 2.5 Flash for intent parsing. Lint and tests (ruff + pytest) run in CI.

The whole point is that you could swap the model out, or have it fail entirely, and the ledger's
correctness guarantees would not move an inch.

---

### Skills & Deliverables:

- **Backend system design**: async FastAPI service with a lifespan-managed lifecycle, a strict
  proposal/approval state machine, and an audit trail.
- **LLM integration with guardrails**: timeout/retry transport, schema-validated structured
  output, and a self-correcting validation feedback loop.
- **Data integrity & concurrency**: atomic SQL transitions, cross-process file locking, atomic
  file swaps, and full-snapshot reversibility.
