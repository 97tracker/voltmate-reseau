---
name: qa-cycle
description: Run a full VoltMate release cycle by delegating to the product-owner, qa-tester, and devops subagents in sequence — triage/prioritize, test the running app for real bugs, fix, then ship. Use before a deploy, when the user asks to "run a QA pass", "do a sprint", or wants the PO/QA/DevOps team to take a pass at the project. Not for a single quick bug check — use the qa-tester agent directly for that.
---

# VoltMate QA cycle

This orchestrates the three project subagents defined in `.claude/agents/` — `product-owner`,
`qa-tester`, `devops` — into one repeatable loop. Run each step for real; don't skip a step by
assuming its outcome.

## Steps

1. **Prioritize** — invoke `product-owner`. Ask it to re-read `ROADMAP.md`, check the current phase's
   exit KPIs, triage any open bugs/issues, and state what this cycle should focus on (a roadmap item,
   a batch of bugs, or both). Do this first — testing without a priority just produces a random pile
   of findings.
2. **Test** — invoke `qa-tester` with the priorities from step 1 in view. It drives the real running
   stack (bring it up first if it isn't up) and files findings — as GitHub issues if a remote exists,
   otherwise in `QA_FINDINGS.md`.
3. **Fix** — work through what QA found, most user-impacting first (per the PO's triage). This can be
   the main session directly; it doesn't need its own subagent. Re-run the specific repro for each
   fix before considering it done — don't take a code change on faith.
4. **Ship** — invoke `devops` to commit, and push/deploy if the user has authorized it for this
   session (see the agent's own rules — it will not force-push or bypass the feature-branch
   convention on its own).
5. **Close the loop** — invoke `product-owner` again to update `ROADMAP.md` status markers for
   anything that shipped, and close/comment on resolved issues.

## When to shorten the cycle

- User just wants bugs found, not fixed/shipped: stop after step 2.
- No GitHub remote yet: steps 2 and 5 write to local markdown files instead of `gh issue`; step 4
  stops at commit (no push target).
- Small one-off fix requested directly: skip this skill entirely, it's overhead for a single change.
