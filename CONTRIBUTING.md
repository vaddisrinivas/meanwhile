# Contributing

Add or improve an option only when it is safe, specific, and genuinely worth interrupting someone for.

## Quality bar

- Give one clear activity, not a broad category.
- Prefer a direct destination over search results.
- Prefer free, usable-without-signup resources.
- Set a realistic duration from the supported values.
- Use `micro` only for no-tab activities of at most 120 seconds.
- Use `journey` for activities offered during waits of at least five minutes.
- Add specific task contexts when the option teaches or checks the current stack.
- Use `return_policy: none` for play and recovery.
- Do not disguise entertainment or rest as productivity.
- Do not add affiliate, referral, tracking, or shortened URLs.
- Do not include HTML in catalogue text.
- Keep prompts natural and non-patronizing.

## Add an option

1. Add any shared destination to `resources`.
2. Add the quest to `quests`.
3. Add it to a pack only when it improves that pack's quality.
4. Set `duration_seconds` to `minutes * 60`.
5. Run:

```sh
node scripts/validate.mjs
node scripts/build.mjs
node scripts/build.mjs --check
```

6. Commit the source and generated changes together.

Pull requests must explain the situation the option serves and why the destination is better than the existing defaults.
