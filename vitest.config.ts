import { defineConfig } from "vitest/config";

/**
 * One reason to have a config at all: agent worktrees. Claude Code sessions
 * create throwaway checkouts under .claude/worktrees/ (a launch rehearsal
 * flips live:true there), and vitest's default glob happily collected their
 * test files — so the suite failed on assertions about a state the REAL
 * tree is not in. The default excludes stay; .claude joins them.
 */
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/.claude/**"],
  },
});
