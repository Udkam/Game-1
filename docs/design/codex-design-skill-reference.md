# codex-design-skill Reference

Source: `https://github.com/Udkam/codex-design-skill`

Reviewed commit: `a798952effd67ebea39b9732c848e5de89d8263f`

Reviewed files:

- `plugins/craft-frontend-design/skills/craft-frontend-design/SKILL.md`
- `plugins/craft-frontend-design/skills/craft-frontend-design/references/interface-taxonomy.md`
- `plugins/craft-frontend-design/skills/craft-frontend-design/references/visual-systems.md`
- `plugins/craft-frontend-design/skills/craft-frontend-design/references/motion-and-interaction.md`
- `plugins/craft-frontend-design/skills/craft-frontend-design/references/platform-adapters.md`
- `plugins/craft-frontend-design/skills/craft-frontend-design/references/quality-gates.md`
- `evals/cases/game-ui/pass-fail-evidence.md`
- `evals/cases/game-ui/expected-assertions.md`

Applied principles:

- Classify the surface as a game / interactive toy UI.
- Keep the game board primary instead of adding a landing hero above it.
- Make player state, progress, controls, restart, and feedback immediately readable.
- Use a specific visual thesis instead of generic SaaS gradients or decorative blobs.
- Use semantic tokens for color, spacing, radius, motion, focus, and surfaces.
- Use short motion for causality and feedback, with `prefers-reduced-motion` support.
- Keep mobile controls and board visible, with touch targets at least 44px.
- Cover disabled, selected/current, success, and debug/help states.
- Use accessible names for icon controls and visible focus states.
