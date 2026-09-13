# ProgressBar

## Purpose

A horizontal trough with a filled portion showing how far along something is.
In the client it is the loading bar under a connect screen, the "verifying game
cache" bar, the update-download bar in the Steam client, and the map-download
progress in the server browser.

## VGUI original

`ProgressBar` in VGUI1 (`vgui_dll/include/VGUI_ProgressBar.h`) and VGUI2
(`vgui_controls/ProgressBar.cpp`), with `ProgressBar` as the abstract base and
`ProgressBar`/`ContinuousProgressBar` as the concrete implementations.
`steam.styles`:

```
ProgressBar
{
    bgcolor       "ProgressBarBG"
    border        "ProgressBarBorder"
    barcolor      "ProgressBarFilled"
    barinset      "4 4 4 4"
}
```

The port — **exact**, from `greensteam.css:371-395`:

```css
progress {
  width: 90%;
  margin: 12px auto;
  margin-top: 18px;
  height: 26px;
  box-sizing: border-box;
  border-top: solid 1px #292d23;
  border-bottom: solid 1px #899281;
  border-left: solid 1px #292d23;
  border-right: solid 1px #899281;
  background: #3e4637;
}
progress::-webkit-progress-bar {
  background: #3e4637;
  padding: 4px;
}
progress::-webkit-progress-value {
  height: 16px;
  background: repeating-linear-gradient(
    to right, #96892d, #96892d 8px, #3e4637 1px, #3e4637 12px);
}
```

Four things worth extracting, because each is counter-intuitive:

1. **The frame is *inset* and the trough is `--vgui-surface-dark` `#3E4637`, not
   black.** A progress bar is a *recess* in the panel, but unlike a text input it
   is not hollowed all the way out — it keeps the panel's own dark green. Getting
   this wrong (using `#000`) makes the bar read as a text field.
2. **The fill is a *striped* gradient, not a solid or smooth one.** `8px` of
   maize `#96892D`, then `4px` of `#3E4637`, repeating every `12px`. This is the
   single most distinctive thing about a VGUI progress bar and the one detail
   every recreation gets wrong by using a flat fill.
3. **There is a `4px` inset between the trough and the fill.** The `26px` outer
   height decomposes exactly: `26 − 2 × 4 (padding) − 2 × 1 (border) = 16px`,
   which is the fill height. The `barinset "4 4 4 4"` in `steam.styles` is the
   same number. Do not scale the fill to the full trough.
4. **The stripe gradient in the port contains a bug — and it happens to be
   harmless.** The stops are listed as `#96892d, #96892d 8px, #3e4637 1px,
   #3e4637 12px`. The third stop (`1px`) is *before* the second (`8px`), so the
   CSS gradient algorithm clamps it to `8px`. The rendered result is the intended
   `8px` maize / `4px` dark. Write the clamped version
   (`#96892D 0 8px, #3E4637 8px 12px`) so the intent is explicit rather than
   depending on a clamping rule.

## Anatomy

```html
<div class="vgui-progress" role="progressbar"
     aria-valuenow="45" aria-valuemin="0" aria-valuemax="100">
  <div class="vgui-progress__trough">
    <div class="vgui-progress__fill" style="--vgui-progress: 45%"></div>
  </div>
  <span class="vgui-progress__text">45%</span>
</div>
```

Native `<progress>` is tempting — the port uses it — but it cannot be styled
consistently: `::-webkit-progress-value` and `::-moz-progress-bar` place the
inset differently (the port has to add `margin-top: 4px; margin-left: 4px` for
Firefox to compensate), and `::before`/`::after` do not render inside a
`<progress>` in Gecko, which kills the label. A `div` with `role="progressbar"`
is the more reliable choice here. See *Open questions*.

## Variants

| Variant | Class | Use |
| --- | --- | --- |
| Determinate | — | Known percentage |
| Indeterminate | `--indeterminate` | Unknown duration; animates a sweeping fill |
| With label | `--with-text` | Percentage or byte count inside the bar |
| Small | `--small` | `16px` outer, `8px` fill, `2px` inset; for inline use |
| Continuous | `--continuous` | `ContinuousProgressBar`: no discrete percentage, advances constantly |

## States

| State | Trough | Fill |
| --- | --- | --- |
| Determinate | `#3E4637`, inset bevel | `8px`/`4px` maize stripe, `4px` inset, `#B8C4AD` leading edge |
| Indeterminate | same | Stipes scroll horizontally; **wrapped in `prefers-reduced-motion`** |
| Complete | same | Stripe reaches the far edge; left stripe phase intact |
| Paused | same | Stripes stop; the fill stays where it was |
| Error | `#3E4637`, bevel replaced by `--vgui-danger` on top/left | Fill colour unchanged — the *frame* carries the error |
| Disabled / idle | same | `0px` fill; `--vgui-text-dim` label |

There is no hover, focus or pressed state. A progress bar is never interactive
and must not be focusable.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface-dark` `#3E4637` | Trough interior **and** the stripe gap |
| `--vgui-accent-darker` `#96892D` | Stripe fill — **2.77:1** against the trough; needs a boundary cue |
| `--vgui-bevel-light-strong` `#B8C4AD` | Required highlight on the fill's leading edge (**5.40:1**) |
| `--vgui-bevel-dark` `#292D23` | Inset top/left |
| `--vgui-bevel-light` `#899281` | Inset bottom/right |
| `--vgui-text` `#D8DED3` | Percentage label |
| `--vgui-heading` `#C4B550` | Alternative label colour (Valve used `Over` for progress text) — **4.72:1** on the trough |
| `--vgui-danger` `#E2251A` | Error frame — **2.11:1** on `#3E4637`; needs the error text too |

Add `--vgui-progress-stripe: 12px` and `--vgui-progress-fill: 8px` to `theme.css`
so the stripe pitch is themeable in one place.

## CSS recipe

```css
.vgui-progress {
  --vgui-progress-fill: 8px;
  --vgui-progress-stripe: 12px;
  --vgui-progress-inset: 4px;

  display: block;
  width: 100%;
  max-width: 480px;
}

.vgui-progress__trough {
  box-sizing: border-box;
  position: relative;
  height: 26px;
  padding: var(--vgui-progress-inset);
  background-color: var(--vgui-surface-dark);
  /* INSET: the bar is recessed into the panel. */
  border-top: 1px solid var(--vgui-bevel-dark);
  border-left: 1px solid var(--vgui-bevel-dark);
  border-bottom: 1px solid var(--vgui-bevel-light);
  border-right: 1px solid var(--vgui-bevel-light);
}

.vgui-progress__fill {
  height: 100%;                    /* = 16px after padding and border */
  width: var(--vgui-progress, 0%);
  /* The boundary highlight: #B8C4AD on #3E4637 is 5.40:1, so the fill's
     extent is legible even when #96892D on #3E4637 (2.77:1) is not. */
  border-right: 1px solid var(--vgui-bevel-light-strong);
  /* 8px maize, 4px dark, every 12px. Stops written already-clamped. */
  background-image: repeating-linear-gradient(
    to right,
    var(--vgui-accent-darker) 0 var(--vgui-progress-fill),
    var(--vgui-surface-dark) var(--vgui-progress-fill) var(--vgui-progress-stripe)
  );
  /* Keep the stripe phase anchored to the bar's left edge, not the fill's,
     so the stripes do not slide as the value changes. */
  background-attachment: local;
  background-repeat: repeat-x;
  transition: width 120ms linear;
}

.vgui-progress--indeterminate .vgui-progress__fill {
  width: 100%;
  background-size: 240px 100%;
  animation: vgui-progress-sweep 1.2s linear infinite;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes vgui-progress-sweep {
    from { background-position-x: 0; }
    to   { background-position-x: 240px; }
  }
}

/* Without motion, an indeterminate bar becomes a full static stripe. */
@media (prefers-reduced-motion: reduce) {
  .vgui-progress--indeterminate .vgui-progress__fill {
    animation: none;
    opacity: 0.6;
  }
}

.vgui-progress__text {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--vgui-text);
  text-align: center;
}
```

**The `background-attachment: local` / stripe-phase point matters.** A naive
implementation puts the gradient on the element whose `width` changes, so as the
bar fills, the stripes *slide* — the `8px` maize band creeps leftward. Valve's bar
was a pixel pattern anchored to the trough. Either fix the phase (as above) or
accept the slide; do not leave it as an accident. This is a subtle defect that
looks like a rendering artifact and is actually a CSS consequence.

## React API

```tsx
export interface ProgressBarProps {
  /** 0–100. Omit to render the indeterminate variant. */
  value?: number
  /** Upper bound when `value` is absolute rather than a percentage. */
  max?: number
  /** Show a label inside or under the bar. */
  showValue?: boolean
  /** Format the label. Defaults to "NN%". */
  formatValue?: (value: number, max: number) => string
  /** Accessible name. Required when there is no visible label. */
  label?: string
  /** Compact variant. */
  small?: boolean
  /** Render the error frame. */
  error?: boolean
  /** Continuous variant: no discrete value, advances on its own. */
  continuous?: boolean
}
```

`value === undefined` selects the indeterminate variant, and the component must
then **omit `aria-valuenow` entirely**. Omitting it is what makes assistive tech
announce "busy" rather than "0%"; setting it to `0` is the common bug.

## Accessibility

- **`role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax`, and
  `aria-valuenow`** — or no `aria-valuenow` at all for indeterminate.
- **Do not use a live region for a percentage that updates continuously.** A
  progress bar that announces every percent is unusable. Announce only
  milestones — 25/50/75/100 — or announce completion. The `role="progressbar"`
  itself is not a live region, so this is about not adding `aria-live` on top.
- **`aria-valuetext` when the number is not a percentage.** Downloading 4.2 MB of
  12 MB should say "4.2 of 12 megabytes", not "35". Use `formatValue`.
- **Contrast: `#96892D` on `#3E4637` is 2.77:1.** The fill against the trough
  *fails* WCAG 1.4.11, which wants 3:1 for a graphical element needed to
  understand the state. (Against `--vgui-surface` it is even lower, **2.12:1**.)
  This is the most serious accessibility problem in the component — the bar looks
  perfectly readable to a designer because it is large and colourful, and it is
  genuinely marginal for a low-vision user.
  Two fixes, and **at least one is required**:
  1. Always render a textual percentage (the `--with-text` variant). Then the bar
     is decorative and the number carries the meaning, which passes.
  2. Add a `1px` `--vgui-bevel-light-strong` `#B8C4AD` right edge to the fill
     (**5.40:1** against `#3E4637`), making the boundary unmistakable.
  The recommendation is **both**: text by default, and the edge highlight.
- **The label text** `--vgui-text` `#D8DED3` on `#3E4637` is **7.17:1** (AAA).
  Good. Do not move the label inside the fill, where it would sit on `#96892D`
  (**2.70:1** if light, and only **4.22:1** with dark text).
- **Never animate the fill's `width` on the indeterminate variant.** A width
  animation triggers layout on every frame. Animate `background-position` (as in
  the recipe) or `transform`.
- **Reduced motion.** A sweeping indeterminate bar is continuous motion, which is
  a genuine vestibular trigger. The recipe above handles it; do not skip the
  media query.
- **Do not make the bar focusable or clickable.** A progress bar is a status
  indicator. If the user needs to act on it (cancel a download), put a real
  `Button` next to it.
- **`--and` the total.** Where the operation can fail, the error state must be
  announced too, not just drawn as a red frame — `aria-describedby` pointing at a
  message.

## Assets

None. `steam.styles` defines the bar entirely with `bgcolor`, `border`,
`barcolor` and `barinset` — no sprite. The stripe is a `render_bg` program in
VGUI and a `repeating-linear-gradient` here, which is an unusually clean 1:1
correspondence.

## Examples

```tsx
<ProgressBar value={45} label="Verifying game cache" showValue />

<ProgressBar
  value={4.2} max={12}
  formatValue={(v, m) => `${v.toFixed(1)} of ${m} MB`}
  label="Downloading de_dust2"
  showValue
/>

<ProgressBar label="Connecting to 203.0.113.4:27015" continuous />

<ProgressBar value={80} error label="Download failed" />

<ProgressBar value={62} small />
```

## Open questions

- **`<progress>` vs `role="progressbar"`.** The port uses native `<progress>`,
  which gives the correct role for free. The costs are recorded in *Anatomy*: the
  Firefox fill inset has to be fudged with `margin-top: 4px; margin-left: 4px`,
  and Gecko will not render `::before`/`::after` inside a `<progress>`, so the
  label must live outside anyway. Since the label is already outside, the
  remaining reason to prefer `div` is stylistic consistency (and being able to
  use `padding` for the inset rather than a magic margin). **This needs a
  cross-engine rendering test to settle**; the recommendation to use a `div` is
  provisional.
- **The `width: 90%; margin: 12px auto; margin-top: 18px`** in the port is a
  layout choice for a demo page, not a component metric. It should not be
  inherited — the component should be `width: 100%` of its container.
- `ProgressBarFilled` vs `ProgressBarBG` in `steamscheme.res` were not read as
  concrete values, so whether Valve's fill was the same `#96892D` as the port's
  is unconfirmed. It very likely is, since `#96892D` is also `::selection`'s
  background and the design clearly reused it.
- The stripe pitch (`8px` fill / `12px` period) is taken from the port's
  gradient, which is a *web* interpretation of Valve's `render_bg`. Valve's
  original drew the stripes from the panel width, so the pitch may have been
  proportional rather than fixed. Unverified.
- Whether `--continuous` is genuinely distinguishable from `--indeterminate` in
  VGUI is unclear — both exist as classes, but their visual difference was not
  located in `steam.styles`.
