# StatusBar

A thin strip of status information pinned to the bottom of a window — the "what
is the app doing" line that in Steam carries the current download and its
progress.

There is **no named VGUI class** for this. It is a composition: a `Panel`-ish
region holding one `StatusLabel` and one slim `ProgressBar`. This doc specifies
the composition and the metrics, which *are* in the corpus, rather than inventing
a control that Valve never had.

## Purpose

`StatusBar` is the chrome at the bottom edge of a window that reports activity
without stealing focus. It has exactly two jobs:

1. Say what is happening, in one short uppercase phrase.
2. Show how far along it is, if there is a measurable end.

It is not a toolbar (no controls the user operates), not a menu bar, and not a
place for errors that need acknowledgement (that is a `Dialog`).

## VGUI original

**Composed — no VGUI class by this name.** The corpus's only status-strip
definition is a `.layout` file:

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\uistatuspanel.layout
```

### The controls

```ini
StatusDownloading { controlname=URLLabel style="StatusLabel" labelText="" URLText="steam://open/downloads" }
StatusPaused{ controlname=URLLabel style="StatusLabel" labelText="" URLText="steam://open/downloads" }
StatusComplete { controlname=URLLabel style="StatusLabel" labelText="" URLText="steam://open/downloads" }
StatusProgressbar	{ controlname="ProgressBar" style="ProgressBar" barinset=0 continuous=1 }
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\uistatuspanel.layout:5-8
```

Four observations, each of which shapes the component:

- **The three status strings do not share one slot — they share two.** The
  corpus places `StatusDownloading` alone in `TitleRegion`
  (`uistatuspanel.layout:30`, `margin-top=13` of a 60px region) and
  `StatusPaused, StatusComplete` together in `statusRegion`
  (`:31`, `margin-top=2` of a 28px region). So in Valve's status *dialog* the
  "downloading" text is drawn up in the title area and only the paused/complete
  text lands in the bottom strip. This is the single most surprising thing in the
  layout, and it is the reason this doc treats the strip as **one message slot**
  rather than three controls: the two placements are never simultaneously
  occupied in the corpus, and a general-purpose bottom bar cannot also own the
  window title.
- **Every status string is a link, and none is hard-coded.** All three are
  `URLLabel` with the same `URLText="steam://open/downloads"`
  (`uistatuspanel.layout:5-7`); clicking the status opens the downloads page.
  This is the reason `StatusLabel` has a hover state at all
  (`steam.styles:2389`).
- **The progress bar is slimmed twice** — by `barinset=0` and by being placed at
  `height=3`. See below.
- **The runtime text is not in the layout at all.** All three labels declare
  `labelText=""`; the strings are supplied from a localisation key in C++ (the
  neighbouring overlay layouts use the same `#Overlay_Taskbar_…` convention,
  `overlaydesktop.layout:10`). A `StatusBar` therefore takes its message as a
  prop or child, never as a hard-coded string — and this corpus cannot tell you
  what Steam's strings actually say.

### The slim progress bar

`uistatuspanel.layout` defines a `SlimProgressBar` style in its own `styles`
block:

```ini
SlimProgressBar
{
    render_bg
    {
        0="fill( x0, y0, x1, y1, DarkGreenBG )"
    }
}
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\uistatuspanel.layout:13-19
```

**A single flat fill of `DarkGreenBG` `#3E4637` — one line, no bevel, no
stripes, no inset.** Compare the full `ProgressBar` style
(`steam.styles:1850-1862`), which is `bgcolor = DarkGreenBG` plus four 2px bevel
lines — top and left `BorderDark`, bottom and right `BorderBright` — and nothing
else; the slim variant drops even that bevel, which is exactly what a 3px-tall
bar needs, because a 2px line on both sides would leave a 1px interior or no
interior at all.

Note what VGUI's `ProgressBar` does *not* define: the style block has no
`render_bg` fill program and no stripe pattern, so the moving fill is drawn by the
client, not by the theme. The `26px` trough and the `8px`/`4px` maize stripe are
the library's own geometry (`ProgressBar.md`), not a transcription of this block.

It *is* used — just not in this file:

```ini
downloadprogressbar { controlname="ProgressBar" style="SlimProgressBar" barinset=0 continuous=1 group="HideOnCompletion" }
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\ugcdownloadpanel.layout:30
```

Note that `uistatuspanel.layout:8` asks for `style="ProgressBar"` — the *full*
style — while placing it at `height=3`. That is almost certainly a copy-paste
slip in Valve's own layout: the full style's four 2px bevel lines cannot render
inside a 3px box. The `statusbar` component in this library uses the **slim**
recipe, which is the one the sibling layout proves was intended.

### The regions — the actual metrics

```ini
region { name="TitleRegion" width=max height=60 align=top margin=0 }
region { name="statusRegion" y=0 width=max height=28 align=bottom margin=-10 }
region { name="ProgressRegion" y=32 width=max height=20 align=top margin=0 }
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\uistatuspanel.layout:26-28
```

| Region | Height | Role |
| --- | --- | --- |
| `statusRegion` | **28px** | The message line. The `StatusBar` height. |
| `ProgressRegion` | 20px | The progress slot, of which the bar uses 3px |
| `TitleRegion` | 60px | The dialog title area above |

And the placements:

| Control | Region | Placement |
| --- | --- | --- |
| `StatusDownloading` | `TitleRegion` | `align=top-center margin-top=13` |
| `StatusPaused`, `StatusComplete` | `StatusRegion` | `align=top-center margin-top=2` |
| `StatusProgressbar` | `ProgressRegion` | `width=300 height=3 margin-top=3 align=top-center` |

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\uistatuspanel.layout:30-32
```

So the canonical numbers are:

- **Strip height: 28px.**
- **Message: centred horizontally, 2px from the top of the 28px region** — that
  is the paused/complete placement (`:31`). The downloading string is instead
  centred 13px from the top of the 60px title region (`:30`); a bottom bar cannot
  reproduce that, so this component uses the strip placement for every status.
- **Progress bar: 300px wide, 3px tall, centred, 3px down in its own 20px slot.**

The 300px fixed width is worth noting — the bar does **not** stretch to the strip
width. It is a fixed-centred 300px element, which is why the composition reads as
a centred readout rather than a full-bleed progress line.

### The other status strip — a sunken field that is not sunken

`uistatuspanel.layout` is not quite the only status strip in the corpus.
`DialogServerBrowser.res:31-48` also defines a panel *named* `StatusLabel`, and
it is the only place a status readout is given a concrete box:

```ini
"StatusLabel"
{
    "ControlName"   "Label"
    "xpos"          "11"
    "ypos"          "362"
    "wide"          "544"
    "tall"          "24"
    style="status"
}
```

with the dialog's local `styles` block (`:52-56`) defining:

```ini
status
{
    bgcolor="none"
    inset="8 0 0 0"
}
```

Two things follow. First, **the corpus never applies a sunken or beveled
treatment to a status readout.** The only rule is `bgcolor="none"` plus an 8px
left inset — a transparent box, so the label sits flat on whatever surface is
behind it. A recessed status field is therefore an *invention* of this library,
not a transcription, and `## CSS recipe` says so explicitly. Second, the 544×24
box is the corpus's "wide status strip" proportion, which is the shape a
`--fields` bar with several readouts wants — as opposed to the 28px centred
`uistatuspanel` single-message strip.

## Variants

| Variant | What changes | Source |
| --- | --- | --- |
| *(default)* | 28px strip, centred message, 300×3 progress | `uistatuspanel.layout:27`, `:32` |
| `--message-only` | No progress bar | `StatusLabel` alone |
| `--left` | Message and bar left-aligned rather than centred | *(library)* — multi-field case |
| `--compact` | 20px strip | *(library)* |
| `--fields` | Drops the centred slot for a `flex` row of arbitrary children | *(library)* — the "bottom strip of status fields" case |

`--fields` exists because the README describes `StatusBar` as a "bottom strip of
status fields", and a real application usually wants several (word count, cursor
position, encoding, connection state). The corpus's `uistatuspanel.layout` has
exactly one centred slot, so `--fields` is an extension: it uses the same 28px
height, the same `StatusLabel`, and the same 1px separator, but lays children out
in a row with `gap`.

## Anatomy

```tsx
<div class="vgui-status-bar">
  <StatusLabel href={downloadsUrl}>Downloading</StatusLabel>
  <ProgressBar class="vgui-status-bar__progress" value={47} slim />
</div>
```

Three parts:

1. **Strip** — the container. 28px tall, `--vgui-surface` background, one 1px
   top edge to separate it from the content above.
2. **Message** — a `StatusLabel`. Centred by default; left-aligned when a margin
   is present for other fields.
3. **Progress** — a slim `ProgressBar`, 3px tall, 300px wide, centred. Omit it
   entirely for a message-only bar; do not render a zero-value bar.

Both the message and the progress bar are **optional and independently omittable**.
A `StatusBar` with neither is a 28px empty strip and should not be rendered.

## States

| State | Behaviour | Source |
| --- | --- | --- |
| Idle | No message, no bar — **do not render** | *(library)* |
| Working | Message + determinate bar | `StatusProgressbar`, `:8` |
| Indeterminate | Message + `Spinner` instead of the bar | `Spinner.md` |
| Paused | Message changes to the paused string | `StatusPaused`, `:6` |
| Complete | Message changes, bar removed | `StatusComplete`, `:7`, `HideOnCompletion` |
| Error | Message in `--vgui-danger` + an affordance to see details | *(library)* |

The `HideOnCompletion` group name at `ugcdownloadpanel.layout:30` is the corpus's
own statement of the completion rule: **when the task completes, the bar is
hidden**, and the message changes rather than disappearing.

The exclusivity is the important behavioural spec, but it is **two-of-three, not
three-way**: `StatusPaused` and `StatusComplete` share one slot, so *those two*
are one piece of state and transitioning between them must not shift the layout;
`StatusDownloading` sits in `TitleRegion` (`:30`) and is a different slot
entirely. This library deliberately flattens all three onto the strip, because a
general-purpose bottom bar has no title region to spend. The consequence is that
a component which reproduces Valve's *placement* is impossible and a component
which reproduces Valve's *states* must accept that "Downloading" would have
appeared 13px below the dialog's top edge, not in the strip. Because the slot is
centred in the corpus, text length changes do not move the bar; if `--left` is
used, reserve a minimum width for the message so the bar does not slide.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-surface` `#4C5844` | Strip background |
| `--vgui-surface-dark` `#3E4637` | Slim progress bar trough (`DarkGreenBG`) |
| `--vgui-accent-darker` `#96892D` | Progress bar fill |
| `--vgui-bevel-light` `#899281` | 1px top separator |
| `--vgui-bevel-dark` `#292D23` | 1px bottom edge on the last strip |
| `--vgui-text-muted` `#A0AA95` | Message (via `StatusLabel`) |
| `--vgui-danger` `#E2251A` | Error message |
| `--vgui-status-bar-height` `28px` | Strip height |
| `--vgui-status-bar-progress-width` `300px` | Progress bar width |
| `--vgui-status-bar-progress-height` `3px` | Progress bar height |

Component-local metrics keep `var()` fallbacks; palette tokens do not.

## CSS recipe

```css
.vgui-status-bar {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;            /* the corpus places both children centred */
  gap: 8px;
  min-block-size: var(--vgui-status-bar-height, 28px);
  padding-block: 0;
  padding-inline: 8px;
  background-color: var(--vgui-surface);
  border-block-start: 1px solid var(--vgui-bevel-light);
  color: var(--vgui-text-muted);
  font: inherit;
  font-size: var(--vgui-font-size, 14px);
  /* The strip is chrome: it never scrolls away with the content. */
  flex: none;
}

/* The slim bar. One flat fill, no bevel, no stripes — SlimProgressBar,
   uistatuspanel.layout:13-19. */
.vgui-status-bar__progress {
  box-sizing: border-box;
  inline-size: var(--vgui-status-bar-progress-width, 300px);
  block-size: var(--vgui-status-bar-progress-height, 3px);
  background-color: var(--vgui-surface-dark);
  border: 0;                            /* barinset=0, layout:8 */
}

.vgui-status-bar__progress > * {
  block-size: 100%;
  background-color: var(--vgui-accent-darker);
}

/* Multi-field strip: the label row case. */
.vgui-status-bar--fields {
  justify-content: flex-start;
  gap: 16px;
}

.vgui-status-bar--fields > *:last-child { margin-inline-start: auto; }

.vgui-status-bar--left { justify-content: flex-start; }
.vgui-status-bar--compact { --vgui-status-bar-height: 20px; }

.vgui-status-bar--error { color: var(--vgui-danger); }
```

**No bevel on the slim bar.** This is the whole point of `SlimProgressBar` —
`uistatuspanel.layout:17` is a single `fill()` call, which is the VGUI equivalent
of `background-color` and nothing else. A 3px bar with a 1px bevel on each side
would have a 1px interior. Do not apply
`ProgressBar`'s bevel recipe (`ProgressBar.md`) to this variant.

**The strip is flat, and that is a deviation to be aware of.** The corpus gives
the only ruled status readout `bgcolor="none"` with `inset="8 0 0 0"`
(`DialogServerBrowser.res:52-56`) and gives the `uistatuspanel` strip no style at
all — so nothing in the corpus says a status strip should be recessed, and
nothing says it should carry a bevel. The `border-block-start` above is the
minimum needed to stop the strip dissolving into the content above it, and it
uses the standard bevel primitives deliberately rather than inventing a
double-line sunken edge. If a consumer wants the recessed look, the correct
expression is a **parent** with the bevel primitive (inverted), not a change to
this component — the label must stay transparent on top of it, or the two
treatments will fight.

## React API

```tsx
export interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The status message. Rendered through StatusLabel (uppercase by default). */
  message?: React.ReactNode
  /** Progress 0–100. Omit to hide the bar entirely. */
  value?: number
  /** Render the progress region as indeterminate instead of a bar. */
  busy?: boolean
  /** Turn the message into a link, as every corpus status string is. */
  href?: string
  /** Left-align instead of centring the message and bar. */
  align?: 'center' | 'left'
  /** Show the numeric percentage beside the bar. */
  showValue?: boolean
  /** Actionable failure state. Pairs with a details affordance. */
  error?: boolean
  /** Compact 20px strip. */
  compact?: boolean
}
```

Notes:

- `value === undefined` means **no bar**; `value={0}` means a bar at zero. The
  distinction matters — a task that has just started is not the same as a task
  that does not exist.
- `busy` renders a `Spinner` (`Spinner.md`) in the progress slot rather than an
  indeterminate `ProgressBar`. An indeterminate bar with no known end is a worse
  affordance than a throbber.
- The bar is `300px` wide by default, matching `uistatuspanel.layout:32`. Pass
  `className` to override for a full-bleed strip.
- `forwardRef<HTMLDivElement>`; `className` merged **last**.

## Accessibility

- **`<footer>` or `role="contentinfo"`** is the right container in a `Window`;
  a `StatusBar` is genuinely the footer of an application frame. Inside a
  `Dialog` it is the footer of the dialog.
- **Announce transitions once, not continuously.** The message is what changes;
  the bar ticks. Wrap only the *message* in `aria-live="polite"` — put
  `aria-live` on the progress bar and a screen reader will read a number several
  times a second. This is the single most common way a status bar becomes
  hostile.
- **The progress bar carries its own semantics.** Give it `role="progressbar"`,
  `aria-valuemin="0"`, `aria-valuemax="100"` and `aria-valuenow`. When `busy` is
  set, **omit `aria-valuenow`** — that is what makes it indeterminate.
- **Every corpus status string is a link, so the link must be self-describing.**
  `DOWNLOADING` alone in a link list is ambiguous; that is why `StatusLabel.md`
  recommends an `aria-label` or a longer string. The status bar is the canonical
  place for this problem.
- **The 3px bar is not a texture, it is a text alternative.** At 3px tall and
  `300px` wide, the bar is a fine visual read at a glance but conveys nothing to
  a low-vision user. `showValue` exists exactly for this: put the percentage in
  text beside it.
- **Contrast.** `--vgui-accent-darker` `#96892D` on `--vgui-surface-dark`
  `#3E4637` is **2.77:1** (computed for this doc; `foundations.md:470` records the
  same pair for `--vgui-accent-dark` `#91863C` at **2.66:1**, and `ProgressBar.md`
  uses 2.77:1 for this fill). That fails WCAG 1.4.11 for a meaningful graphic,
  and the 3px height compounds it. The trough is worse: `--vgui-surface-dark`
  against the `--vgui-surface` strip is **1.30:1** (`foundations.md:477`), so
  *where the bar ends* is not perceivable at all. Two required mitigations: keep
  `showValue` on for anything the user must judge, and give the fill a
  non-colour boundary cue — `ProgressBar.md` appends a `#B8C4AD` leading edge for
  exactly this reason. Do not ship a 3px bar whose only signal is yellow-on-green.
- **The 1px top separator is decorative.** Do not use it to convey a boundary
  that must be perceivable.

## Assets

None. The strip is `background-color` + `border`; the slim bar is a single flat
fill (`uistatuspanel.layout:17`), which is a `background-color` declaration in
CSS. This is one of the few components in the library with a **complete** corpus
recipe and no sprite dependency at all.

## Examples

```tsx
{/* The canonical case: a download in progress, clickable, as Steam has it. */}
<StatusBar
  message="Downloading Team Fortress 2"
  value={47}
  showValue
  href="steam://open/downloads"
/>

{/* Indeterminate work — a throbber, not a bar with an unknown end. */}
<StatusBar message="Scanning for servers" busy />

{/* Complete: the bar is gone (HideOnCompletion), the message remains. */}
<StatusBar message="Download complete" href="steam://open/downloads" />

{/* Multi-field strip, the --fields extension. */}
<StatusBar>
  <StatusLabel>Ln 42, Col 7</StatusLabel>
  <StatusLabel>UTF-8</StatusLabel>
  <StatusLabel withDot>Connected</StatusLabel>
</StatusBar>
```

## Open questions

- **`uistatuspanel.layout:8` requests `style="ProgressBar"` at `height=3`.** The
  sibling layout `ugcdownloadpanel.layout:30` uses `style="SlimProgressBar"` at
  `barinset=0 continuous=1` — the same modifiers. This doc treats the status
  panel's `ProgressBar` reference as a copy-paste slip and uses the slim recipe.
  If a screenshot of Steam's actual status strip can be obtained, that would
  settle it; the full style's four 2px bevel lines cannot be what renders in a
  3px box.
- **Why `StatusDownloading` lives in the title region is unexplained.** The
  placement (`uistatuspanel.layout:30`) puts the downloading string in
  `TitleRegion` and the paused/complete strings in `statusRegion` (`:31`). Either
  the download string doubles as the dialog's caption, or the layout is the
  product of two edits that were never reconciled. Evidence: the C++ that applies
  these styles, or a screenshot of the 2003–2010 status dialog.
- **Three status strings, one slot — is that really one component?** The corpus
  ties them to a single download (`steam://open/downloads`). A general-purpose
  library may want a queue. The `--fields` variant is the escape hatch; whether
  the *default* should support a multi-item queue is unresolved.
- **The 300px fixed width is oddly specific.** It is a literal placement value
  (`uistatuspanel.layout:32`), not a token. Whether it should be the default for
  a general strip or only for the centred presentation is a judgement call this
  doc makes in favour of fidelity.
- **What occupies the strip when the app is idle?** Nothing in the corpus
  describes the no-download case. This doc says "do not render", which is a
  choice, not a source.
- **The `Label` colour token is now confirmed** — `Label="160 170 149 255"`
  (`steam.styles:67`), i.e. `#A0AA95`, the same bytes as `--vgui-text-muted`
  (`foundations.md:75`). See `StatusLabel.md`. That resolves the colour of the
  strip's message but leaves its *contrast* failure open: `#A0AA95` on the strip's
  own `--vgui-surface` is 3.11:1, so the default message colour does not meet AA
  at 14px. Which of the three mitigations in `StatusLabel.md` to take is the
  remaining decision.
