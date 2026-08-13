# Framecraft product illustration

**Status: CREATED.** The editable source, audio MP4, and README GIF are in the repository.

## Outputs

- Narrated video: `assets/meanwhile-demo.mp4`
- README preview: `assets/meanwhile-demo.gif`
- Scene config: `launch/framecraft/scenes.json`
- Editable HTML scenes: `launch/framecraft/01-hook.html` through `06-end.html`
- Live-site capture: `launch/framecraft/site.png`

Rendered with [vaddisrinivas/framecraft](https://github.com/vaddisrinivas/framecraft). Validation passed for H.264 video, AAC audio, 1920x1080 resolution, matched stream durations, and no black frames.

## Brief

- Product: Meanwhile — a skill that offers one fitting side quest while an AI agent keeps working.
- Audience: people using Codex, Claude Code, Cursor, Gemini CLI, OpenCode, or GitHub Copilot.
- Runtime: 28.7 seconds, 16:9, 1920x1080, visible on-screen copy, narrated voiceover.
- Tone: warm, clever, finite, human; never productivity guilt.
- End card: `Meanwhile — Side quests from your AI.`

## Shot list

| Time | Picture | Voiceover | Caption |
|---|---|---|---|
| 0–4s | Dark terminal: `Add OAuth login and test the callback flow.` | “Your agent is working. Stop watching it.” | Your agent is working. Stop watching it.
| 4–9s | One Meanwhile card appears with an OAuth learning quest. | “Meanwhile offers one fitting side quest, while the main work keeps moving.” | Trace one OAuth exchange.
| 9–14s | Four finite paths arrive in sequence. | “Learn something relevant. Reset. Play. Or test what the agent built.” | Learn. Reset. Play. Test.
| 14–19s | Restraint labels appear: `once`, `optional`, `no account`, `no streak`, `no completion tracking`. | “Exactly once per session. Optional. No account, streak, or completion tracking.” | Optional by design.
| 19–25s | The live catalogue appears beside `52 quests` and `7 packs`. | “It is one skill plus a static catalogue, ready for every major coding agent.” | One skill. One static catalogue.
| 25–29s | Brand and live URL end card. | “Meanwhile. Side quests from your AI.” | Meanwhile — Side quests from your AI.

## Asset list

- `assets/meanwhile-social.png` — approved social image and end-card source.
- `index.html` — catalogue screen capture.
- `meanwhile/SKILL.md` — behavior-contract screen capture.
- `quests.json` — machine-readable catalogue screen capture.
- Terminal mockup with the OAuth task and progress line; use fictional/local text only.
- Captions in high-contrast white with red accent; no user data, credentials, or browser cookies.

## Re-render

```sh
python /path/to/framecraft.py render launch/framecraft/scenes.json
ffmpeg -y -i assets/meanwhile-demo.mp4 -vf "fps=12,scale=640:360:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" assets/meanwhile-demo.gif
```

Review each export against the product claim: one optional quest, no separate agent, and no completion tracking.
