# LevelMeter

A four-step segmented indicator used for values that are read as a *level*
rather than a percentage — signal strength, connection quality, voice activity.
It is the discrete counterpart to `ProgressBar`: four blocks, not a continuous
fill.

## Purpose

`LevelMeter` answers "how strong is this, in coarse terms?" A `ProgressBar`
says 47%; a `LevelMeter` says three bars out of four. The difference is
deliberate and is the control's whole reason to exist: a four-step meter does
not imply a precision the underlying measurement does not have.

Typical uses:

- Server-browser connection quality (the ancestor of Steam's ping bars).
- Voice-chat activity, where the level rises and falls while someone speaks.
- Any "good / fair / poor" reading that maps naturally onto four states.

## VGUI original

There is **no stylesheet class**. `LevelMeter` is reconstructed from a sprite
family, and this is the first thing to be honest about: `steam.styles` contains
no `LevelMeter`, no `Ramp`, and no block that references any ramp asset. The
control's existence is established entirely by its artwork.

Eight `.tga` files, all **20×20**, in two four-frame ramps:

| Asset | Size | Direction |
| --- | --- | --- |
| `rampUp_1.tga` … `rampUp_4.tga` | 20×20 each | Ascending |
| `rampDown_1.tga` … `rampDown_4.tga` | 20×20 each | Descending |

```powershell
F:\steam-style\OG-Steam\OG-Steam\graphics\rampUp_1.tga    # … through rampUp_4
F:\steam-style\OG-Steam\OG-Steam\graphics\rampDown_1.tga  # … through rampDown_4
```

All sixteen measurements taken from the `.tga` header (width at bytes 12–13,
height at 14–15, little-endian).

Every one of the eight files is also **exactly 1644 bytes** with 32bpp. The
arithmetic is exact and confirms there is nothing hidden in these files: an
18-byte TGA header, a 20×20×4 = 1600-byte uncompressed BGRA payload
(`imagetype=2`, no colour map), and the 26-byte TGA 2.0 footer whose signature
reads `TRUEVISION-XFILE`. 18 + 1600 + 26 = 1644.

They are all the same shape and the same depth. Whether they *differ* is the next
question, and the answer changes what the component is.

### The up and down ramps are byte-identical mirrors

Hashing the eight files settles it:

| File | MD5 | Matches |
| --- | --- | --- |
| `rampUp_1.tga` | `68F12A8F…CB8C21` | `rampDown_4.tga` |
| `rampUp_2.tga` | `956405CC…5BDDC9` | `rampDown_3.tga` |
| `rampUp_3.tga` | `7D686DEE…1F35CD82` | `rampDown_2.tga` |
| `rampUp_4.tga` | `E1AFC1D7…E506A2` | `rampDown_1.tga` |

There are **four distinct images, not eight**. `rampDown` is `rampUp` read
backwards, byte for byte. Two consequences follow, and both are load-bearing:

1. **`rampUp` and `rampDown` are not two different meters.** They are one meter
   presented in two orders — ascending left-to-right and descending
   left-to-right. That reads exactly like a fill direction: `up` fills the
   blocks on the left first, `down` fills them on the right first. So the variant
   is a *direction* variant, not a *value* variant, and the variant table below is
   named correctly.
2. **Asset duplication is pure waste.** A single four-frame strip is sufficient;
   the second four files exist only so that a caller can ask for a mirrored
   order without re-ordering an array. This library should ship four images and
   an ordering flag, and the table above should be read as *four* assets with two
   presentation orders — not eight assets.

Note what this does **not** say. Nothing in the corpus states that either ramp
encodes `:hover` and `:active`, or that the descending order means "signal
falling". A direction is a direction; the semantic is this library's choice, and
`## Open questions` records it as such.

### What is actually referenced

Every `.layout`, `.res`, `.styles` and `.menu` file in the corpus was searched.
The result is lopsided:

| Asset | Referenced? | Where |
| --- | --- | --- |
| `rampUp_1..4` | **no** | nowhere in the corpus |
| `rampDown_1..3` | **no** | nowhere in the corpus |
| `rampDown_4` | **twice** | `htmlpopup.layout:16`, `overlaywebbrowser.layout:18` |

And the two references are not a meter at all — they are a **static placeholder
image**:

```ini
PageLoadThrobber { controlname="ImagePanel" image="graphics/rampDown_4" }
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\htmlpopup.layout:16
F:\steam-style\OG-Steam\OG-Steam\resource\layout\overlaywebbrowser.layout:18
```

In both files the control is named `PageLoadThrobber` but declared as a plain
`ImagePanel` — the same slot that `uinavigatorpanel.layout:16` fills with the
animated `ThrobberImagePanel`. So **`rampDown_4` is the fallback drawing for a
throbber in a context where the C++ class was not available**: a single static
glyph where an animation would normally go. (See `Spinner.md` for the animated
case.)

This is important for interpreting the artwork:

- `rampDown_4` is a *finished, self-contained* 20×20 image — it works alone.
- The other fifteen files are therefore likely the same: each is a complete
  four-bar level reading, not one bar of a larger composite.

**That is the central inference of this doc:** a ramp frame is a whole meter, and
the four files in a ramp are four *states* of that meter, not four *segments* to
be stacked. A `LevelMeter` shows exactly one 20×20 frame at a time.

## Variants

| Variant | Segments | Direction | Source |
| --- | --- | --- | --- |
| *(default)* | 4 | Ascending (`rampUp`) | `rampUp_1..4.tga` |
| `--down` | 4 | Descending (`rampDown`) | `rampDown_1..4.tga` — **the same four images, reversed** (see above) |
| `--inline` | 4 | Same, 12px segments | *(library)* — for a table cell |
| `--segments-n` | *n* | Same | *(library)* — but see below |

`--down` therefore costs **no extra assets**. It is an ordering flag over the
same four images, and the library should ship it that way rather than shipping
the mirrored duplicates that the corpus does.

`--segments-n` is offered reluctantly. Four is the number the artwork defines,
and a five-segment meter drawn from a four-frame source is a fabrication. If
more resolution is genuinely needed, that is a `ProgressBar`.

### Relationship to `Table`'s ping bars

`foundations.md:90-92` defines three ping tokens for the server-browser bars:

| Token | Value | Meaning |
| --- | --- | --- |
| `--vgui-ping-high` | `#4C5844` | better than 100ms |
| `--vgui-ping-medium` | `#91863C` | 100–150ms |
| `--vgui-ping-low` | `#6A1610` | worse than 150ms |

Those are for the *procedural* ping bars drawn in a rendered table cell. A
`LevelMeter` is the same reading expressed with sprite geometry. Use the tokens
for both so a table's ping column and a standalone `LevelMeter` never disagree.

Note the token naming is inverted relative to what you might expect:
`--vgui-ping-high` is the **good** value (low latency), and its colour `#4C5844`
is **byte-identical to `--vgui-surface`** (`foundations.md:92` and `:68`). Against
a surface panel that is not a low ratio, it is the *same colour*: **1.00:1** —
the "good" bar is literally invisible. It is 1.30:1 against the lighter gutter
surface (`foundations.md:476`). That is a real failure and it is inherited from
Valve. See Accessibility.

## Anatomy

```
<div class="vgui-level-meter" role="meter" aria-valuemin="0" aria-valuemax="4" aria-valuenow="3">
  <span class="vgui-level-meter__segment" />   <!-- ×4 -->
</div>
```

Four segments, drawn procedurally, with `level` of them lit. Structurally the
segments are siblings rather than a single sprite so the meter can be sized,
recoloured and read by assistive tech.

- `--up` renders ascending segments (the `rampUp` family).
- `--down` renders descending segments (the `rampDown` family).

Because only `rampDown_4` is ever referenced, the `--down` direction is the one
with corpus evidence for its appearance. The `--up` family's intended use is
unrecoverable — see Open questions.

## States

| State | Behaviour | Source |
| --- | --- | --- |
| Level 0 | All segments unlit | *(none — inferable)* |
| Level 1–4 | *n* segments lit | `rampUp_1..4` / `rampDown_1..4` |
| Hover | Nothing | no stylesheet block exists |
| Focus-visible | Not focusable — it is a readout | *(library)* |
| Disabled | Dim all segments to `--vgui-text-dim` | *(library)* |
| Animating | Segments light in sequence while a level is updating | *(library)* — see below |

**A `LevelMeter` is not interactive and has no hover state.** It reports. If it
needs to be clickable, wrap it in a `Button`.

The `--animating` state is not from the corpus. A voice-activity meter needs it
(a level that only updates on a timer reads as broken), but it must respect
`prefers-reduced-motion`, same rule as `Spinner`.

## Tokens

No stylesheet block exists, so the meter has no corpus colours. It uses
`foundations.md`'s ping tokens, which are themselves community values.

| Token | Where |
| --- | --- |
| `--vgui-ping-high` `#4C5844` | Good — but see the contrast failure below |
| `--vgui-ping-medium` `#91863C` | Fair |
| `--vgui-ping-low` `#6A1610` | Poor |
| `--vgui-text-dim` `#758666` | Unlit segment |
| `--vgui-text-strong` `#FFFFFF` | Optional segment outline |
| `--vgui-bevel-dark` `#292D23` | Unlit segment inset |
| `--vgui-accent` `#C4B550` | Focus ring, if focusable |
| `--vgui-level-meter-segment` `20px` | Segment size |
| `--vgui-level-meter-gap` `1px` | Gap between segments |
| `--vgui-level-meter-level` `4` | Segment count |

Component-local tokens keep `var()` fallbacks; shared palette tokens do not.

## CSS recipe

```css
.vgui-level-meter {
  display: inline-flex;
  align-items: flex-end;
  gap: var(--vgui-level-meter-gap, 1px);
  block-size: var(--vgui-level-meter-segment, 20px);
  /* A readout, not a target. */
  cursor: default;
  user-select: none;
}

.vgui-level-meter__segment {
  inline-size: var(--vgui-level-meter-segment, 20px);
  block-size: var(--vgui-level-meter-segment, 20px);
  background-color: var(--vgui-text-dim);
  /* The theme has no rounded corners anywhere. Segments are hard-edged. */
  outline: 1px solid var(--vgui-bevel-dark);
  outline-offset: -1px;
}

/* Lit segments. Ascending: later segments are taller. */
.vgui-level-meter--up .vgui-level-meter__segment:nth-child(1).is-lit { block-size: 25%; }
.vgui-level-meter--up .vgui-level-meter__segment:nth-child(2).is-lit { block-size: 50%; }
.vgui-level-meter--up .vgui-level-meter__segment:nth-child(3).is-lit { block-size: 75%; }
.vgui-level-meter--up .vgui-level-meter__segment:nth-child(4).is-lit { block-size: 100%; }

/* Descending: later segments are shorter. This is the rampDown family. */
.vgui-level-meter--down .vgui-level-meter__segment:nth-child(1).is-lit { block-size: 100%; }
.vgui-level-meter--down .vgui-level-meter__segment:nth-child(2).is-lit { block-size: 75%; }
.vgui-level-meter--down .vgui-level-meter__segment:nth-child(3).is-lit { block-size: 50%; }
.vgui-level-meter--down .vgui-level-meter__segment:nth-child(4).is-lit { block-size: 25%; }

.vgui-level-meter__segment.is-lit { background-color: var(--vgui-ping-medium); }

/* Severity by level, using the ping tokens so a table and a meter agree. */
.vgui-level-meter[data-level='1'] .is-lit { background-color: var(--vgui-ping-low); }
.vgui-level-meter[data-level='2'] .is-lit { background-color: var(--vgui-ping-medium); }
.vgui-level-meter[data-level='3'] .is-lit,
.vgui-level-meter[data-level='4'] .is-lit { background-color: var(--vgui-ping-high); }

.vgui-level-meter--inline { --vgui-level-meter-segment: 12px; }

.vgui-level-meter[aria-disabled='true'] .vgui-level-meter__segment { opacity: 0.5; }

.vgui-level-meter--animating .vgui-level-meter__segment.is-lit {
  animation: vgui-level-pulse 900ms steps(4, end) infinite;
}

@keyframes vgui-level-pulse {
  0%   { opacity: 0.35; }
  100% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .vgui-level-meter--animating .vgui-level-meter__segment.is-lit { animation: none; }
}
```

**`--vgui-ping-high` `#4C5844` is invisible on a panel.** The level-3/4 colour is
*the same three bytes* as `--vgui-surface`, so on a surface panel the lit
segments are not low-contrast, they are **absent** (1.00:1; the 1.30:1 at
`foundations.md:476` is the milder case of the lighter gutter surface). Valve
shipped this. This library should not: use a brighter tone for a "good" reading
(the `--vgui-steam-green` `#7EA64B` at 3.48:1 on `surface-dark` is still
AA-large-only, so prefer `--vgui-heading` `#C4B550` at 4.72:1, `foundations.md:434`,
if the meter is the only cue), and keep the profile outline so the segment *shape*
survives either way. Do not rely on the fill to carry the reading.

## React API

```tsx
export interface LevelMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current level, 0…segments. Values are clamped. */
  level?: number
  /** Number of segments. 4 matches the sprite family; other values are an extension. */
  segments?: number
  /** Descending rather than ascending segment heights. */
  direction?: 'up' | 'down'
  /** Compact 12px segments, for table cells. */
  inline?: boolean
  /** Pulse the lit segments while the level is being measured. */
  animating?: boolean
  /** Render and apply a disabled treatment. */
  disabled?: boolean
  /** Text announced to assistive tech, e.g. "Good". Strongly recommended. */
  valueText?: string
}
```

Notes:

- Default `segments` is `4` and `level` is `0`. The corpus defines exactly four
  steps; any other count is a deliberate departure.
- `valueText` should be supplied whenever the meaning is more than a number
  ("Excellent", "Poor"). Without it a screen reader hears only the numeric value.
- `forwardRef<HTMLDivElement>`; `className` merged **last**.

## Accessibility

- **Use `<meter>`, or `role="meter"`.** This is the one control in the library
  where the correct ARIA role is not `progressbar`. A meter represents a
  *measurement within a known range*; a progress bar represents *task
  completion*. Getting this backwards is a common and confusing error.
- Required attributes: `aria-valuemin` (`0`), `aria-valuemax` (`segments`),
  `aria-valuenow` (`level`), and ideally `aria-valuetext` (the human string).
- **A `LevelMeter` is never indeterminate.** It always has a value, even if that
  value is zero. Do not reuse it as a loading indicator — that is `Spinner`.
- **Colour alone does not convey the level.** This is the crux: the lit/unlit
  distinction is a colour change, and the "good" colour is *the same colour as
  the surface* (1.00:1 — see above). Two mitigations are required:
  1. **Shape carries the reading**: because segments are different heights
     (`block-size` 25/50/75/100%), a colour-blind or low-vision user can count
     the tall segments. This is why the height steps exist and why a
     same-height segmented bar would be worse.
  2. **Supply `valueText`**, so assistive tech gets the meaning rather than a
     number.
- **Do not animate it uncontrollably.** A voice-activity meter that pulses is
  meaningful motion; one that pulses decoratively is a distraction and a
  vestibular risk. Gate `animating` behind the caller's state and honour
  `prefers-reduced-motion`.
- **Contrast for the unlit segments.** `--vgui-text-dim` `#758666` on
  `--vgui-surface` is **1.92:1** (`foundations.md:440`). Unlit segments *should*
  be low-contrast — that is how "off" reads — so this is acceptable, but the
  **outline** (`--vgui-bevel-dark` `#292D23`, 1.87:1) is equally faint, meaning
  the meter's total extent can disappear. Give the container a subtle
  `--vgui-surface-dark` backing plate, or accept that the segments' own
  geometry locates the meter.
- **Not focusable, not in the tab order.** Nothing here is interactive. If it
  becomes interactive it is no longer a meter.

## Assets

Eight Valve `.tga` files — **but only four distinct images**, because
`rampDown_n` is `rampUp_(5-n)` byte for byte (all 32bpp, all 1644 bytes, all
20×20):

```powershell
F:\steam-style\OG-Steam\OG-Steam\graphics\rampUp_1.tga … rampUp_4.tga      # 20×20 each
F:\steam-style\OG-Steam\OG-Steam\graphics\rampDown_1.tga … rampDown_4.tga  # 20×20 each
```

**Do not ship them.** Per `foundations.md` §7, the geometry is reproduced
procedurally and no Valve bitmap is redistributed. The recipe above draws four
`div` segments with stepped heights — the same information the sprites carry,
without the copyright burden.

The one fidelity detail worth preserving: the ramps are **hard-edged, unlit-gap
segments**, not a smooth gradient. Valve's bar meters of this era are visibly
discrete. Keep the 1px gap and the profile outline; do not round the corners or
add a gradient.

## Examples

```tsx
{/* Connection quality in a server list row. */}
<LevelMeter level={3} valueText="Good" inline />

{/* Voice activity, descending ramp. */}
<LevelMeter level={micLevel} direction="down" animating valueText="Speaking" />

{/* Explicit, with the meaning spelled out. */}
<LevelMeter level={1} valueText="Poor — 180ms" segments={4} />
```

## Open questions

- **`rampUp_*` is entirely unreferenced.** Every layout, res, style and menu file
  in the corpus was searched; only `rampDown_4` appears, twice, as a static
  throbber placeholder. So the ascending family's *intended* consumer, its
  orientation (horizontal vs vertical), and whether it was ever a meter are all
  unrecovered. The doc treats it as a meter because that is the only reading
  consistent with the name and the four-frame structure, but it is an inference.
- **One frame = one whole meter, or one frame = one bar?** This doc asserts the
  former (a ramp frame is a complete four-bar reading), on the evidence that
  `rampDown_4` is used standalone as a finished image. The alternative — that the
  four frames are four *segments* to be composited into a 40×20 or 80×20 meter —
  cannot be ruled out without decoding the actual pixels, which was not done.
  **Decoding the `.tga` pixel data would settle this**, and it is the single most
  valuable follow-up for this component.
- **What was the meter measuring?** Given the era, most likely connection/signal
  quality or voice activity. Nothing in the corpus says.
- **The descending direction is the canonical one,** by the only evidence
  available (`rampDown_4` is used in preference to any other frame). The default
  variant in this doc is `--up` for the usual meter convention; that may be
  backwards with respect to Valve.
- **What does a direction *mean*?** Now that the two ramps are known to be the
  same four images in opposite order, the direction is certainly a fill order —
  but fill order could encode any of: left-to-right vs right-to-left, hover vs
  active, "gaining" vs "losing", or nothing at all (a spare roll). The corpus
  does not say, and the reference that would say is the C++ that loaded
  `rampUp_*`/`rampDown_*`, not present here. Treat `direction` as a presentation
  prop, which is how this doc specifies it.
- **No stylesheet block means no colours.** Every token in the table is either a
  community value or a library addition. If the sprites turn out to encode a
  specific palette, the tokens should be re-derived from them.
