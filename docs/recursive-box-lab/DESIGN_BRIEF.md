# Recursive Box Lab Design Brief

## Design Thesis

Recursive Box Lab should feel like a folded laboratory instrument: a playable grid puzzle where boxes expose smaller calibrated rooms inside themselves. The visual system should suggest blueprint folds, bench-top instruments, and nested spatial readouts without copying the minimalist white-square identity of Patrick's Parabox.

## Interface Classification

Primary mode: game / interactive toy UI.

The first screen must be playable. The board, progress, current world path, controls, restart, and feedback must be visible immediately. There is no marketing hero.

## Visual System

- Typography: `Space Grotesk` for headings and labels, `IBM Plex Mono` for counters and debug readouts, with system fallbacks.
- Palette: ink, porcelain surface, blueprint teal, signal amber, cargo green, player yellow, and error/success states. Avoid a one-note purple/blue or beige palette.
- Layout: board-first app shell with a side instrument rail. On mobile, controls stack below the board.
- Components: 8px-or-less radius, crisp borders, restrained shadows, and stable grid/cell dimensions.
- Icons: `lucide-react` for tool buttons; labels remain visible for commands where clarity matters.
- Assets: no external gameplay assets; the grid and entities are rendered in CSS/HTML so state remains inspectable.

## Motion System

- Move feedback: short transform/settle animation.
- Entering or changing worlds: subtle fold/zoom treatment on the active grid.
- Hover/focus: targeted color, border, and transform changes.
- Durations stay under 240ms for routine controls.
- `prefers-reduced-motion` disables transform-heavy motion.

## State Coverage

- Current level: active selection state.
- Disabled: unavailable next-level button.
- Success: solved banner.
- Debug: toggleable layer tree and last action readout.
- Help: toggleable overlay with controls and legend.
- Empty/error/loading: not relevant for local static level data in Stage 4.

## Accessibility

- Buttons have accessible names.
- Icon-only movement controls expose `aria-label` and `title`.
- Keyboard movement works globally for WASD and arrow keys.
- Focus-visible styles are explicit.
- Status changes use text and shape, not color alone.
- Help text is available on demand.

## Responsive Strategy

- Desktop: board plus side instrument rail.
- Tablet/mobile: board remains first; side rail stacks below.
- Touch targets are at least 44px.
- Board uses stable aspect-ratio cells and responsive maximum width.

## Known Limits

- Motion is CSS-only; there is no timeline library.
- Inner-world previews are capped to keep the board readable.
- Full content help/about pages and localStorage progress are deferred to Stage 5.
