# Spinner

The indeterminate activity indicator — the small rotating "throbber" that spins
while a page or a task is loading. Its visual definition lives entirely in twelve
`.tga` frames rather than in a stylesheet, which is why almost nothing about it
appears in `steam.styles`.

## Purpose

`Spinner` tells the user *something is happening, and I don't know how long it
will take*. It is the counterpart to `ProgressBar`: use `ProgressBar` when the
completion percentage is known, `Spinner` when it is not.

It has two sizes in the corpus — the 20×20 inline throbber in the toolbar, and a
100×75 loading area in the screenshot manager — but only one animation.

## VGUI original

`ThrobberImagePanel`. This is a **C++ control class, not a stylesheet entry** —
and that distinction matters, because it means most of the spinner's behaviour is
not in this corpus at all. There is no `ThrobberImagePanel` block in
`steam.styles` (verified: the class name does not appear anywhere in the file).

The class name appears exactly once in the corpus:

```ini
"PageLoadThrobber"
{
    "ControlName"		"ThrobberImagePanel"
    style="Panel_transparent"
    zpos="-2"
    "group" "url"
}
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\uinavigatorpanel.layout:14-20
```

Its style is defined locally in the same file, not in `steam.styles`:

```ini
Panel_transparent
{
    bgcolor="none"
}
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\uinavigatorpanel.layout:492-495
```

`bgcolor="none"` is the whole style. A throbber has **no background, no bevel,
no inset and no text colour** — it is a transparent window that a sprite is drawn
into. Of the controls these six docs survey it is the clearest case of a control
whose entire definition is artwork.

### Placement

```ini
place { control="PageLoadThrobber" align=right y=36 height=20 width=20  margin-right=10 margin-top=8 }
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\uinavigatorpanel.layout:895
```

**20×20 is the canonical spinner size** — it is the placed size *and* the native
size of every frame (measured below), so no scaling occurs.

### The large variant

```ini
ScreenshotLoadingThrobber
{
    minimum-width=100
    minimum-height=75
    bgcolor=black
}
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\screenshotmanager.layout:170-175
```

Note this one is **not** transparent: it is a black 100×75 rectangle. That is
the "full-panel loading" case — the spinner is drawn inside a black area where a
screenshot will appear. So the theme has two distinct presentations:

| Presentation | Size | Background |
| --- | --- | --- |
| Inline (toolbar, "is the page loading") | 20×20 | none (`layout:494`) |
| Block (screenshot manager, "wait for this region") | 100×75 minimum | `black` (`layout:174`) |

## Variants

| Variant | Size | Background | Source |
| --- | --- | --- | --- |
| *(default)* | 20×20 | none | `uinavigatorpanel.layout:895`, `:494` |
| `--block` | fills its container (min 100×75) | `black` | `screenshotmanager.layout:170-175` |
| `--inactive` | 20×20 | none | `minithrobberinactive.tga` — see below |
| `--inline-label` | 20×20 + text | none | *(library)* — "Loading…" beside it |
| `--paused` | 20×20 static | none | *(library)* — reduced-motion equivalent |

### The inactive frame

`minithrobberinactive.tga` is a 13th sprite alongside the twelve animation
frames. It is the same size (20×20) and is clearly the non-animating state — the
spinner at rest. Because the corpus never references it by name (only the
`ThrobberImagePanel` C++ class would), the exact moment it is drawn is not
recoverable: most likely when a load is queued but not yet running, or when the
control is disabled.

This library uses it as the **prefers-reduced-motion** still frame and as the
`--paused` state, which is the most defensible reuse: a spinner that must not
animate needs to look like a spinner that is not animating, not like nothing.

| Asset | Size | Role |
| --- | --- | --- |
| `minithrobber01.tga` … `minithrobber12.tga` | 20×20 each | The 12-frame loop |
| `minithrobberinactive.tga` | 20×20 | The at-rest frame |

All measured from the `.tga` header (width at bytes 12–13, height at 14–15,
little-endian) in `F:\steam-style\OG-Steam\OG-Steam\graphics\`.

### The twelve frames are genuinely twelve frames

It is worth confirming rather than assuming, because a "throbber" is exactly the
kind of asset that can turn out to be one image repeated. Hashing the set:

- All thirteen files are **32bpp and exactly 1644 bytes** — which decomposes
  exactly into an 18-byte TGA header, a 20×20×4 = 1600-byte uncompressed payload
  (`imagetype=2`, no colour map) and a 26-byte TGA 2.0 footer signed
  `TRUEVISION-XFILE`.
- All thirteen have **distinct MD5 hashes**. Twelve distinct animation frames
  plus one distinct inactive frame.

So the animation is real, and the sprite is a true sequence. (Compare
`LevelMeter.md`, where the analogous check found that the eight `rampUp`/
`rampDown` files are only **four** distinct images.)

### The other loop set, and why it is not this component

`graphics/` also contains `loop_1.tga` … `loop_8.tga`: **eight 20×20 frames, all
32bpp, all 1644 bytes, all eight hashes distinct**. That is a second, shorter
sprite loop of exactly the same geometry as the throbber, and it is tempting to
treat it as the "light" variant of the same control.

This doc does not, for two reasons. First, **nothing in the corpus references
either set by name** — a search of every `.layout`, `.res`, `.styles` and `.menu`
file for `minithrobber` and `loop_` returns nothing at all; the frames are loaded
by C++ and the class name `ThrobberImagePanel` (`uinavigatorpanel.layout:16`)
never names an image. Second, a third candidate exists that *is* named and is
demonstrably **not** a spinner: `steamrootdialog.layout:144-150` gives
`ClientLogo` an `image="graphics/piston"` — a 340×133 static bitmap, not a
frame sequence. Mere presence in `graphics/` is not evidence of an animation.

The honest position: `minithrobber*` is an *inferred* choice, made because
`ThrobberImagePanel` is the only animated sprite consumer the corpus names and
twenty 20×20 frames of a rotating glyph is what a throbber looks like. `loop_*`
is the other plausible set. See `## Open questions`.

## Anatomy

```tsx
<span class="vgui-spinner" role="progressbar" aria-label="Loading">
  <span class="vgui-spinner__frame" aria-hidden="true" />
</span>
```

- The outer element is the accessible container. It carries the `role`.
- The inner element is the visual. It is `aria-hidden` because it conveys
  nothing a screen reader can use.

The 12 frames are rendered either as a CSS sprite-sheet animation (one element,
`background-position` stepped 12 times) or as a procedurally drawn set of 12
rotated bars. The procedural route is the default — see **Assets**.

## States

| State | Behaviour | Source |
| --- | --- | --- |
| Active | 12 frames looping | `minithrobber01..12` |
| Paused / inactive | Single static frame | `minithrobberinactive.tga` |
| Reduced motion | Static frame + any text label | *(library policy)* — see Accessibility |
| Disabled | Not a corpus concept; treat as `--paused` | *(library)* |

**A spinner has no hover, focus, active or selected state.** It is not
interactive. Do not add one. If a spinner needs to be clickable (to cancel a
load), that is a `Button` with a spinner *inside* it, not a clickable spinner.

## Tokens

Because the control has no stylesheet entry (`uinavigatorpanel.layout:492-495`
declares only `bgcolor="none"`), it declares **no colour tokens of its own**. Any
colour comes from the sprite artwork or, in this library, from the procedural
fallback.

| Token | Where |
| --- | --- |
| `--vgui-text-strong` `#FFFFFF` | Default bar colour of the procedural spinner |
| `--vgui-text-muted` `#A0AA95` | Trailing/dimmed bars in the sweep |
| `--vgui-heading` `#C4B550` | Optional maize emphasis |
| `--vgui-surface` `#4C5844` | Optional backing plate |
| `--vgui-spinner-size` `20px` | Native size |
| `--vgui-spinner-duration` `1.2s` | One full rotation — **invented**, see below |
| `--vgui-spinner-easing` `steps(12, end)` | Twelve discrete steps |

`--vgui-spinner-size`, `--vgui-spinner-duration` and `--vgui-spinner-easing` are
component-local and keep `var()` fallbacks. Shared palette tokens are referenced
**without** fallbacks.

**The duration is an invention.** `1.2s` is chosen to match the perceived speed
of a 12-frame turn-of-the-millennium throbber — the frames were stepped by the
engine's frame tick, not by a timer, so there is no interval in the corpus. 100ms
per frame is the conventional value and sits in the range the original art was
drawn for. If fidelity matters more than inference, expose it as a prop and
document that the corpus does not specify it.

## CSS recipe

Procedural 12-bar spinner (the default — no binary assets):

```css
.vgui-spinner {
  display: inline-grid;
  place-items: center;
  inline-size: var(--vgui-spinner-size, 20px);
  block-size: var(--vgui-spinner-size, 20px);
  color: var(--vgui-text-strong);
}

/* Twelve absolutely-positioned bars, each rotated 30° further than the last. */
.vgui-spinner__frame {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  animation: vgui-spinner-step var(--vgui-spinner-duration, 1.2s)
             var(--vgui-spinner-easing, steps(12, end)) infinite;
}

.vgui-spinner__frame::before {
  content: '';
  position: absolute;
  inset: 0;
  background: conic-gradient(
    from 0deg,
    currentColor 0deg 30deg,
    color-mix(in srgb, currentColor 55%, transparent) 30deg 60deg,
    transparent 60deg 360deg
  );
  /* Twelve hard steps of a fading wedge. The theme has no gradients, so the
     trailing bars are drawn as flat opacity steps rather than a smooth ramp. */
  mask: radial-gradient(circle, transparent 0 30%, #000 30% 45%, transparent 45%);
}

@keyframes vgui-spinner-step {
  to { transform: rotate(360deg); }
}

/* The block presentation: a large black plate with the spinner centred. */
.vgui-spinner--block {
  --vgui-spinner-size: 32px;
  inline-size: 100%;
  block-size: 100%;
  min-inline-size: 100px;
  min-block-size: 75px;
  background-color: #000;
}
```

Sprite-sheet alternative, when a consumer supplies their own frames:

```css
.vgui-spinner--sprite .vgui-spinner__frame {
  background-image: var(--vgui-spinner-sheet);
  background-repeat: no-repeat;
  background-size: calc(12 * var(--vgui-spinner-size, 20px)) 100%;
  animation: vgui-spinner-sheet var(--vgui-spinner-duration, 1.2s)
             var(--vgui-spinner-easing, steps(12, end)) infinite;
}

@keyframes vgui-spinner-sheet {
  to { background-position-x: calc(-12 * var(--vgui-spinner-size, 20px)); }
}
```

Reduced motion, which is **not optional**:

```css
@media (prefers-reduced-motion: reduce) {
  .vgui-spinner__frame { animation: none; }
  .vgui-spinner__frame::before {
    background: currentColor;
    mask: radial-gradient(circle, transparent 0 30%, #000 30% 45%, transparent 45%);
  }
}
```

Under reduced motion the spinner becomes a static ring. That is intentional: a
still spinner is ambiguous, so **any spinner shown under reduced motion must be
accompanied by a text label**. See Accessibility.

## React API

```tsx
export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Native size in pixels. 20 is the corpus value. */
  size?: number
  /** Fill the container and paint a black plate. The screenshot-loading case. */
  block?: boolean
  /** Draw the at-rest frame instead of animating. */
  paused?: boolean
  /** Accessible name announced to assistive tech. Defaults to "Loading". */
  label?: string
  /** Repeat the label as visible text beside the spinner. */
  showLabel?: boolean
  /** Sprite-sheet URL. When omitted the spinner is drawn procedurally. */
  frames?: string
  /** Rotation duration in milliseconds. Defaults to 1200. */
  durationMs?: number
}
```

Notes:

- `size` defaults to `20` — the placed size at `uinavigatorpanel.layout:895` and
  the native frame size. Do not offer a size below 16px; a 12-bar sweep is
  illegible smaller than that.
- `block` sets the black plate and the 100×75 minimum from
  `screenshotmanager.layout:172-174`.
- `frames` exists so a consumer who *has* the original artwork (or an
  open-licensed substitute) can get literal fidelity. The default must not
  bundle Valve's `.tga` files — see Assets.
- `forwardRef<HTMLSpanElement>`; `className` merged **last**.

## Accessibility

- **The spinner must have an accessible name and an indeterminate role.**
  `role="progressbar"` with **no** `aria-valuenow` is the correct expression of
  "busy, unknown duration". Omitting the value is what makes it indeterminate —
  supplying `aria-valuenow` when there is no progress is a lie.
- **Announce once, not on every frame.** A spinner is 12 DOM-invisible steps a
  second (or a CSS animation, which is not announced at all). Do not attach
  `aria-live` to the spinner. If the *start* and *end* of a load need announcing,
  do it on the region that changes, or on `aria-busy` on the container.
- **A lone spinner is not an accessible status.** Pair it with text, either
  visually (`showLabel`) or via `aria-label`. "Loading" as an `aria-label` is the
  minimum; "Loading server list" is better.
- **Reduced motion is mandatory, not a nicety.** A continuously rotating element
  is a recognised vestibular trigger (WCAG 2.3.3, *Animation from Interactions*,
  and 2.2.2 for anything over five seconds). The `prefers-reduced-motion` rule
  above must ship in the default stylesheet, and `--paused` must be reachable
  without JS.
- **Do not hide the spinner from assistive tech entirely.** `aria-hidden="true"`
  is correct on the *visual frame* (it carries no information), but the
  *container* must stay exposed, or a screen-reader user has no idea anything is
  happening. This is why the anatomy uses two elements.
- **Colour contrast is structural, not textual.** The spinner's bars must be
  perceivable against whatever is behind them. `--vgui-text-strong` `#FFFFFF`
  on `--vgui-surface` `#4C5844` is **7.54:1** (`foundations.md:429`) — ample.
  On the `--block` black plate it is higher still. Do **not** recolour a
  procedural spinner with `--vgui-text-dim` `#758666` or `--vgui-text-disabled`
  `#75806F`: both fail against `--vgui-surface` (1.92:1 at `foundations.md:440`,
  1.82:1 at `:441`), and an invisible spinner is worse than no spinner.
- **Target size is irrelevant** — a spinner is not a target. But the `--block`
  variant's 100×75 minimum (`screenshotmanager.layout:172-173`) is a good lower
  bound for any region-covering spinner, so it does not read as a stray dot.

## Assets

Valve's original artwork is twelve 20×20 `.tga` frames plus one inactive frame:

```powershell
F:\steam-style\OG-Steam\OG-Steam\graphics\minithrobber01.tga   # … through …
F:\steam-style\OG-Steam\OG-Steam\graphics\minithrobber12.tga
F:\steam-style\OG-Steam\OG-Steam\graphics\minithrobberinactive.tga
```

All thirteen measure 20×20 (`.tga` header, bytes 12–15, little-endian), are
32bpp, and are 1644 bytes each with thirteen distinct hashes. The corpus also
ships `loop_1..8.tga`, eight more distinct frames of the identical geometry,
which this component does not use — see "The other loop set" above and
`## Open questions`.

**These must not be shipped.** They are Valve's copyrighted artwork, and this is
a redistributable npm package. `foundations.md` §7 (`Assets — replacing Valve's
sprites`) sets the policy: reproduce the *geometry* procedurally, ship no
original bitmap. Hence:

- The **default** is a 12-step procedural conic sweep (`--vgui-spinner-duration`
  is a claim about the original's speed, not about its art).
- The **`frames` prop** lets a consumer point at their own sprite sheet if they
  have one, without this package containing it.

Two details of the original are worth reproducing procedurally because they are
what make it read as a 2000s throbber rather than a modern one:

1. **Twelve hard steps, not a smooth rotation.** `steps(12, end)` — a throbber
   from this era is visibly quantised. A smoothly rotating spinner looks wrong
   next to this theme.
2. **A flat trailing fade, not a gradient.** The theme has no gradients anywhere
   (`foundations.md` §3 is entirely flat colours). The conic sweep above uses two
   discrete opacity plateaus rather than a continuous ramp, for the same reason.

## Examples

```tsx
{/* The canonical case: a 20×20 throbber at the end of a URL field. */}
<Spinner />

{/* Blocking a region while a screenshot renders. */}
<Spinner block label="Capturing screenshot" />

{/* With a visible label, which is what reduced-motion users need. */}
<Spinner showLabel>Loading server list…</Spinner>

{/* A consumer's own frame set. */}
<Spinner frames="/assets/minithrobber.png" size={20} />

{/* At rest — e.g. a queued download that has not started. */}
<Spinner paused label="Queued" />
```

## Open questions

- **`ThrobberImagePanel` has no stylesheet block.** Confirmed: the class name
  appears exactly once in the corpus, at `uinavigatorpanel.layout:16`, and its
  style (`Panel_transparent`, `uinavigatorpanel.layout:492-495`) declares nothing
  but `bgcolor="none"`. The animation interval, the number of frames the class
  expects, and whether it loops forward-only are all C++ defaults that are not in
  this corpus. The 12-frame count is inferred from the twelve `minithrobberNN`
  files, which is strong but circumstantial — the class could load a different
  set.
- **`minithrobberinactive` is unreferenced.** No layout and no stylesheet names
  it. Its role (queued? disabled? idle?) is a guess in this doc.
- **`loop_1..8` is an unresolved alternative.** The corpus also ships eight
  distinct 20×20 32bpp frames under that name, and neither set is referenced by
  any layout, res, stylesheet or menu file. This doc chose `minithrobber` because
  its name matches the control (`ThrobberImagePanel`) and its count is twelve,
  but a build where `loop_*` is the page-load animation and `minithrobber*` is
  something else would not contradict anything in the corpus. Evidence that would
  settle it: the C++ that populates the throbber's frame list, or a sprite dump
  from a 2007–2010 client with the two sets rendered side by side.
- **The rotation direction is unknown.** The frames are numbered, but the
  numbering does not reveal whether 01→12 rotates clockwise or anticlockwise, and
  decoding 12 `.tga` frames to compare arc positions was not done. A wrong
  direction is subtle but visible side by side with the original.
- **The frame duration is unknown.** `1.2s` is inferred, not measured. There is
  no timer value anywhere in the corpus.
- **Is there a 16×16 or 32×32 throbber?** Only the `minithrobber*` set exists in
  `graphics/`, and all of it is 20×20. `loop_1..8` is also 20×20. Larger spinners
  in the original client were most likely scaled bitmaps rather than a second
  sprite set — worth confirming before adding any size other than 20 and the
  `--block` plate.
