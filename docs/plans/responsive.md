# Responsive Gameplay Grid & Controls Plan

## Goals
- Ensure the gameplay grid scales down gracefully on portrait mobile screens without affecting the current desktop/landscape experience.
- Tweak the Move direction controls so they remain accessible on small screens while keeping desktop sizing intact.
- Improve the Bailout button layout and prominence on portrait mobile, matching the Start Game button's visual weight and floating it to the right of the Move controls.
- On very small viewports (e.g., iPhone SE/iPhone X and smaller), let the gameplay grid container scroll vertically while keeping the Move controls fixed beneath it.

## Constraints & Considerations
- Preserve the existing grid size and layout on desktop and landscape orientations.
- Keep changes scoped to responsive styles and layout containers to limit gameplay logic churn.
- Maintain accessibility: buttons must retain minimum touch targets and focus outlines.
- Verify no regressions in existing tests; add responsive-focused unit/UI checks where practical.

## Work Breakdown
1. **Audit Current Layout Behaviors**
   - Capture current grid/container dimensions across breakpoints (mobile portrait, mobile landscape, tablet, desktop).
   - Document Tailwind classes or custom CSS that lock grid sizing, gap, or font scales.
   - Inspect Move and Bailout button styles and layout wrapper structure.
   - Findings (Apr 2025):
     - Gameplay grid lives in `src/App.tsx` inside a `div` with Tailwind `grid gap-0 rounded-lg border-2 border-gray-600 bg-gray-800 p-2`; column sizing is controlled via inline `gridTemplateColumns` using a calculated `cellSize` (max 30px) derived from `maxGridWidth = 720` and level size, so large levels (≥18) exceed 540px and overflow small portrait widths.
     - Each cell uses inline `width`/`height` equal to `cellSize` with `minWidth/minHeight` of 4px, so scaling is locked to fixed pixels outside Tailwind breakpoints.
     - Container is wrapped by a flex column centering everything with `min-h-screen`; no constraints prevent the grid from expanding beyond viewport height/width.
     - Move pad sits in a `div` using `grid w-48 grid-cols-3 gap-2` and buttons sized via `px-4 py-3 text-xl`, yielding ~48rem (~192px) width that stays centered; no responsive overrides shrink padding/font below `sm`.
     - Bailout button lives in adjacent flex column with `px-4 py-2 text-sm`; on narrow screens it wraps beneath the Move pad because parent stack `flex-col` aligns center with `gap-6` only switching to `sm:flex-row`.

2. **Responsive Grid Sizing Strategy**
   - Introduce CSS/Tailwind utilities that cap grid width/height using viewport-fitting rules (`max-w`, `max-h`, `vw`, `vh`).
   - Adjust the grid container to honor aspect ratio while shrinking on portrait <=640px (mobile-first) without altering base desktop classes.
   - Add safe minimum size thresholds so touch targets remain usable; consider scaling cell font/icons accordingly.
   - Gate a `max-h` + `overflow-y-auto` treatment behind a very-small breakpoint so the grid itself scrolls instead of collapsing into the Move controls.
   - Implementation approach:
     - Introduce a `useViewportSize` hook and clamp `cellSize` via `useMemo`, using viewport width/height bounds with a 30px desktop ceiling and a 2px floor on compact screens so even 100×100 boards stay in view.
     - Cap the grid wrapper with computed `maxWidth`/`maxHeight` values and toggle `overflow-y-auto` for widths ≤380px, containing scroll to the grid while keeping Move controls static.
     - Retain the desktop experience by falling back to `fit-content` sizing whenever the viewport is ≥640px so existing styling remains unchanged.

3. **Move Buttons Refinement**
   - Apply responsive utility classes (e.g., `sm:`/`md:` prefixes) to reduce button padding/font-size by ~20-25% on screens <640px.
   - Re-align the button group to the left on small screens via flexbox utilities while preserving current alignment for larger breakpoints.
   - Verify spacing between buttons remains consistent; adjust margin/padding stack to avoid overflow.

4. **Bailout Button Enhancements**
   - Match typography and padding to Start Game styles by extracting shared Tailwind classes or creating a reusable style helper.
   - On portrait mobile, float/position the button to the right of the Move controls using responsive flex or grid layout.
   - Ensure wrapping does not occur; test with worst-case localization/label length.

5. **Testing & Validation**
   - Update or extend component tests to cover responsive class toggles if testable (snapshot or DOM attribute checks under simulated viewport width).
   - Run `npm run test:run` and `npm run test:e2e` to confirm no regressions.
   - Manually verify layouts in browser dev tools for key breakpoints (iPhone SE, iPhone 14 Pro Max, iPad, desktop wide).

6. **Documentation & Follow-up**
   - Note responsive design rationale in code comments or a README snippet if needed.
   - Flag any follow-on tasks (e.g., responsive typography audit) discovered during implementation.
