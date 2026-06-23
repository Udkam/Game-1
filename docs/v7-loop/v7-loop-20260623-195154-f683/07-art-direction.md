# Art Direction

## Direction

Primary direction: quantum lab sci-fi.

## Palette

- Base: near-black lab graphite and cool dark neutrals.
- Primary energy: cyan.
- Secondary accents: green, magenta, amber, and red for errors.
- Avoid a one-note purple/blue gradient look.

## Assets And License

- Runtime visuals use custom CSS, DOM, and inline SVG authored in this repository.
- No external images, models, audio, icon packs, or remote font files are used in the current v7 runtime.
- Font stack is local/system only: `"Oxanium"`, `"Space Grotesk"`, `"Noto Sans SC"`, `"Microsoft YaHei"`, `system-ui`, `sans-serif`.
- Because no Google Font files are bundled yet, there is no third-party font binary license to record. If Google Fonts are later downloaded/self-hosted, record font name, source URL, and license in this file before final acceptance.

## Character Candidates

1. 量子无人机: chosen for clarity, state feedback, and scalable SVG form.
2. 星舰维修机器人: good personality but risks returning to a little-person silhouette.
3. 数据幽灵 / 光标核心: strong cyber signal but weaker physical push feedback.

## Implemented Character Direction

The current player piece is a vector quantum drone:

- static state: cyan core with visor-like face detail;
- movement state: short bob animation;
- push state: squash/lean pulse;
- teleport state: warp pulse;
- time-shadow state: magenta/cyan delayed hologram body;
- blocked state: engine now exposes `blockedReason`; HUD feedback is still pending;
- win state: current win overlay, final drone victory animation pending.

## Icon Language

Mechanic icons use consistent line weight and color:

- portal ring;
- sync link;
- echo trail;
- swap diamond;
- recursive chamber;
- chain key;
- misdirection warning;
- target core.
