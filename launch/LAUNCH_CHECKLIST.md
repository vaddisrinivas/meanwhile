# Launch checklist

- [ ] Create the public GitHub repository and set the final name.
- [ ] Replace `[SITE URL]`, `[REPOSITORY URL]`, and `[DEMO URL]` in launch copy.
- [ ] Enable GitHub Pages through GitHub Actions.
- [ ] Confirm the deployed `quests.json`, five guides, seven packs, share page, and static redirects.
- [ ] Test the universal install in Codex plus one of Cursor, Gemini CLI, OpenCode, or Copilot.
- [ ] Test the Claude Code install separately.
- [ ] Record the 35-second contextual demo.
- [ ] Capture desktop and mobile screenshots with readable text.
- [ ] Confirm the social preview image resolves with an absolute deployed URL.
- [ ] Run `npm run check` and `node scripts/check-links.mjs`.
- [ ] Decide whether to stay fully static or route `/go/*` through the optional Worker.
- [ ] If deploying the Worker, verify a `302`, one aggregate Analytics Engine point, and no application logs.
- [ ] Publish Show HN, one agent-specific community post, and one short social demo.
- [ ] Answer launch comments with actual quest examples, not feature lists.
- [ ] Review accepted, ignored, declined, and annoyed feedback after one week.
- [ ] Remove weak quests before adding more.
