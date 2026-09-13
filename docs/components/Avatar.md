# Avatar

A small square picture representing a player — the friend-activity thumbnail and
the account button's portrait. It is **not a VGUI control**; it is an
`ImagePanel` (or `Image`) with a picture in it, and this doc specifies the
wrapper: the sizes, the placeholder, the status ring and the fallbacks.

## Purpose

`Avatar` gives a person a face in the interface. In Steam it appears in two
places and at two sizes, and almost nowhere else:

1. **Chrome** — the account button in the top-right of the client, `24×24`.
2. **Notifications** — the corner toast that announces a friend coming online,
   `42×42`.

It is a *display* component. It has no interaction of its own; when it is
clickable (the account button), the click target is a `Button` and the `Avatar`
is its content.

## VGUI original

**Composed — no `Avatar` class exists.** Per `docs/README.md`'s "deliberately
not specified" section, `AvatarImage` lives only in Steam's own non-SDK client
library, so its metrics come from client resources rather than
`source-sdk-2013`.

### Size 1 — the notification avatar, 42×42

```ini
"ImageAvatar"
{
    "ControlName"		"ImagePanel"
    "fieldName"		"ImageAvatar"
    "xpos"		"16"
    "ypos"		"16"
    "wide"		"42"
    "tall"		"42"
}
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\friends\FriendOnlineNotification.res:19-26
```

The parent is a `240×98` panel with `style="notification"`
(`FriendOnlineNotification.res:9-17`), so the avatar sits `16px` in from the
top-left of a 240×98 toast, at `42×42`. Its remaining properties —
`AutoResize 0`, `PinCorner 0`, `paintbackground 1` — describe a fixed, painted,
non-resizing image.

**This exact `ImageAvatar` block is duplicated across twelve notification
resources**, one per event type:

```
friends/broadcastapprovenotification.res     friends/ClanEventNotification.res
friends/broadcastinvitenotification.res      friends/ClanInvitationNotification.res
friends/broadcastviewernotification.res      friends/FriendIngameNotification.res
friends/ChatInviteNotification.res           friends/FriendInvitationNotification.res
friends/ChatMsgNoTextNotification.res        friends/FriendOnlineNotification.res
                                             friends/GameInviteNotification.res
                                             friends/VoiceChatInviteNotification.res
```

Twelve identical copies is the strongest possible evidence that the notification
avatar is a fixed, single-size element in the client — it was copy-pasted, not
parameterised. (Verified: each of the twelve declares its `ImageAvatar` block at
line `19`, with `"wide" "42"` and `"tall" "42"`.) The eight *other* notification
`.res` files in `friends/` — `AchievementNotification`,
`broadcastpublicstatenotification`, the two broadcast error notifications,
`giftreceivednotification`, `itemreceivednotification`, `newturnsnotification`
and `remoteplaytogetheravailablenotification` — have **no** avatar, which is
itself informative: the avatar appears only on person-centric events, not on
system announcements.

### Size 2 — the account button avatar, 24×24

```ini
account_avatar
{
    "ControlName"	"Image"
    "fieldName"		"account_avatar"
    "zpos" 			"-2" // behind dropdown button
}
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\accountbutton.layout:5-9
```

Placed at:

```ini
place { control="account_avatar" align=right end-right="account_persona" height=24 width=24 }
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\layout\accountbutton.layout:179
```

Two details matter here:

- **The control class is `Image`, not `ImagePanel`.** The notification uses
  `ImagePanel`; the account button uses `Image`. Both are plain picture holders;
  the distinction is which of Valve's two image classes was available in each
  context, and it does not change the visual result.
- **`zpos = "-2"` with the comment `// behind dropdown button`.** The avatar is a
  *backdrop* for the account chrome, layered behind the dropdown affordance. An
  `Avatar` used inside a composite control may legitimately sit behind its
  neighbours, so the component must not assume it owns its box's stacking
  context.

### Colours

The avatar itself has no `steam.styles` block — it paints a bitmap. The
*placeholder* does have a scheme token:

```ini
Friends.NoAvatarOver						"White"
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\styles\steam.styles:361
```

`Friends.NoAvatarOver` is the only avatar-adjacent colour in the corpus, and its
name and value are unambiguous: when there is no avatar, something is drawn
**over** the placeholder box in **white**. In this library that is the initials
glyph or the generic player silhouette drawn on the placeholder.

The neighbouring friend-panel tokens (`steam.styles:358-362`) are what the avatar
sits among and are worth having on hand:

| Token | Value | Line |
| --- | --- | --- |
| `Friends.PanelOver` | `87 87 87 255` | `steam.styles:358` |
| `Friends.PanelSelected` | `17 17 17 255` | `steam.styles:359` |
| `Friends.SectionHeader` | `127 135 121 255` | `steam.styles:360` |
| `Friends.NoAvatarOver` | `White` | `steam.styles:361` |
| `Friends.IgnoredColor` | `248 108 79 255` | `steam.styles:362` |

Note that `Friends.PanelSelected` is `#111111` — a near-black selection, not the
maize used in lists. **The friends list is its own visual world**, and an
`Avatar` in it should not be styled from `List`'s tokens.

### Where avatars are referenced in the menus

The client exposes avatar commands, which confirms the feature set but adds no
metrics:

```ini
EditProfileNameAvatar	{ text="#steam_menu_edit_profile_name_avatar"  shellcmd="steam://url/SteamIDEditPage" }
ShowAvatars				{ text="#steam_menu_friends_showavatars"       shellcmd="steam://friends/settings/showavatars" checkable=1 }
ChangeAvatar			{ text="#steam_menu_set_avatar"                shellcmd="steam://url/SteamIDEditPage" }
```

```powershell
F:\steam-style\OG-Steam\OG-Steam\resource\menus\steam.menu:61, :72, :77
```

`ShowAvatars` being `checkable=1` is a useful reminder for this library:
**avatars can be switched off.** A layout must not collapse when the avatar is
absent — the two sizes above are also the reserved space.

## Variants

| Variant | Size | Source |
| --- | --- | --- |
| `--sm` | `24×24` | `accountbutton.layout:179` |
| `--md` *(default)* | `42×42` | `FriendOnlineNotification.res:25-26` |
| `--lg` | `64×64` | *(library extension)* |
| `--square` / `--round` | Same size, different corner treatment | *(library)* |
| `--placeholder` | No image; initials over the no-avatar colour | `Friends.NoAvatarOver`, `steam.styles:361` |
| `--status` | Adds the ring | *(library)* |
| `--bare` | No frame, image only | *(library)* |

Only three sizes are offered, and the first two are the corpus values. `--lg` is
labelled an extension because there is no large avatar anywhere in this corpus —
Steam's profile page uses one, but it is not in these resources.

**`--round` is an extension, and a questionable one.** VGUI-era Steam avatars
are square. A round mask is a post-2010 convention and will read as anachronistic
next to this theme. It is offered for completeness, not recommended.

## Anatomy

```tsx
<span class="vgui-avatar vgui-avatar--md">
  <img class="vgui-avatar__image" src={url} alt="dalcvi" />
  <span class="vgui-avatar__status vgui-avatar__status--online" aria-hidden="true" />
</span>
```

Three parts:

1. **Frame** — a fixed-square box with the theme's raised bevel and a 1px inset
   gap. The corpus declares no bevel on `ImageAvatar`, so this is a library
   construction consistent with `Panel`; see Open questions.
2. **Image** — square, `object-fit: cover`, so a non-square upload is centre-
   cropped rather than letterboxed.
3. **Status ring** — a 2px coloured edge or corner pip carrying online / away /
   busy / offline. **Not in the corpus** in this form; the colour is available
   (`--vgui-steam-green` `FullGreen` is the "Online" token, `foundations.md:85`),
   but nothing in this resource set draws a ring.

## States

| State | Behaviour | Source |
| --- | --- | --- |
| Loaded | Image drawn, cover-cropped | `ImageAvatar`, `accountbutton.layout:179` |
| Loading | Placeholder box; **reserve the space** | *(library)* |
| Missing / none | White glyph over the placeholder (`Friends.NoAvatarOver`) | `steam.styles:361` |
| Error | Same as missing — never a broken-image icon | *(library)* |
| Hover | Nothing on the avatar itself | no stylesheet block |
| Selected | In the friends list, `Friends.PanelSelected` `#111111` | `steam.styles:359` |
| Ignored | `Friends.IgnoredColor` `248 108 79` | `steam.styles:362` |

**An `Avatar` has no hover state.** Adding a hover ring is the standard modern
reflex and it is wrong here; the frame is static chrome. If the avatar is
clickable, the *button around it* gets the hover treatment, not the avatar.

The `IgnoredColor` state is the one genuine piece of per-user state the corpus
gives: an ignored friend is tinted `#F86C4F`. Reproduce it as a border or a
badge, not as a colour overlay on the image — desaturating someone's face is a
different (and worse) signal.

## Tokens

| Token | Where |
| --- | --- |
| `--vgui-bevel-light` `#899281` | Frame raised top/left |
| `--vgui-bevel-dark` `#292D23` | Frame raised bottom/right |
| `--vgui-surface-dark` `#3E4637` | Placeholder background |
| `--vgui-surface` `#4C5844` | Placeholder background (variant) |
| `--vgui-text-strong` `#FFFFFF` | Placeholder glyph (`Friends.NoAvatarOver`) |
| `--vgui-steam-green` `#7EA64B` | Online status ring (`FullGreen`) |
| `--vgui-heading` `#C4B550` | Away status ring |
| `--vgui-danger` `#E2251A` | Busy status ring |
| `--vgui-text-dim` `#758666` | Offline status ring |
| `--vgui-friends-selected` `#111111` | Friends-list selection (`PanelSelected`) |
| `--vgui-friends-ignored` `#F86C4F` | Ignored tint (`IgnoredColor`) |
| `--vgui-avatar-size` `42px` | Frame size |
| `--vgui-avatar-status-size` `2px` | Ring thickness |
| `--vgui-avatar-frame-width` `1px` | Frame bevel width |

Component-local metrics keep `var()` fallbacks; palette tokens do not.

`--vgui-friends-selected` and `--vgui-friends-ignored` are new tokens this doc
introduces. `steam.styles:359` and `:362` are the first corpus evidence for
either value, and neither currently exists in `foundations.md` §3 — they should
be added there if this component is built.

## CSS recipe

```css
.vgui-avatar {
  position: relative;
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  flex: none;
  inline-size: var(--vgui-avatar-size, 42px);
  block-size: var(--vgui-avatar-size, 42px);
  padding: var(--vgui-avatar-frame-width, 1px);
  /* Square. The theme has no round mask. */
  border-radius: 0;
  border-top: 1px solid var(--vgui-bevel-light);
  border-left: 1px solid var(--vgui-bevel-light);
  border-bottom: 1px solid var(--vgui-bevel-dark);
  border-right: 1px solid var(--vgui-bevel-dark);
  background-color: var(--vgui-surface-dark);
  overflow: hidden;
}

.vgui-avatar__image {
  inline-size: 100%;
  block-size: 100%;
  /* Centre-crop: a non-square upload must never letterbox in a square frame. */
  object-fit: cover;
  object-position: center;
  display: block;
  /* theme.css ships a global `img { border: solid 2px #7b8484 }`; that grey is
     1.66:1 on --vgui-surface and 2.30:1 on --vgui-surface-dark. The frame above
     owns the bevel, so the inherited border is cancelled here. */
  border: 0;
  /* Pixel-era imagery was not smoothed by the browser's scaler. */
  image-rendering: pixelated;
}

/* The no-avatar state: a white glyph over the box, Friends.NoAvatarOver. */
.vgui-avatar--placeholder .vgui-avatar__image,
.vgui-avatar__image[data-failed='true'] {
  visibility: hidden;
}

.vgui-avatar--placeholder::after {
  content: attr(data-initials);
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font: inherit;
  font-size: calc(var(--vgui-avatar-size, 42px) * 0.4);
  line-height: 1;
  color: var(--vgui-text-strong);
  background-color: var(--vgui-surface-dark);
  text-transform: uppercase;
}

.vgui-avatar--sm { --vgui-avatar-size: 24px; }   /* accountbutton.layout:179 */
.vgui-avatar--md { --vgui-avatar-size: 42px; }   /* FriendOnlineNotification.res:26 */
.vgui-avatar--lg { --vgui-avatar-size: 64px; }

.vgui-avatar--bare { border: 0; padding: 0; }

/* The status ring: a 2px edge, not a filled badge. */
.vgui-avatar__status {
  position: absolute;
  inset: 0;
  border: var(--vgui-avatar-status-size, 2px) solid var(--vgui-text-dim);
  pointer-events: none;
}

.vgui-avatar__status--online  { border-color: var(--vgui-steam-green); }
.vgui-avatar__status--away    { border-color: var(--vgui-heading); }
.vgui-avatar__status--busy    { border-color: var(--vgui-danger); }
.vgui-avatar__status--offline { border-color: var(--vgui-text-dim); }

/* Friends list, which has its own palette — steam.styles:359, :362. */
.vgui-avatar--ignored { border-color: var(--vgui-friends-ignored); }
```

**`image-rendering: pixelated` is deliberate.** A 42×42 avatar scaled from a
32×32 upload with the browser's default smoothing looks soft and modern; the
theme's whole texture is hard-edged. Gate it behind the same crispness opt-in
that `foundations.md` §5 describes for fonts, since it is a rendering preference
like `-webkit-font-smoothing: none`.

**The status ring is an edge, not a corner pip.** A dot in the bottom-right
corner is the post-2010 idiom; a full-frame 2px border reads as a VGUI-era
selection marker. Neither is in the corpus — the ring is a construction — but the
frame edge is the one that does not fight the square geometry.

## React API

```tsx
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Image URL. Omit to render the placeholder. */
  src?: string
  /** Alt text — the person's name. Pass "" when a name is already adjacent. */
  alt?: string
  /** Size presets. `sm` is 24px (account chrome), `md` 42px (notifications). */
  size?: 'sm' | 'md' | 'lg'
  /** Derive initials from a name and show them when there is no image. */
  name?: string
  /** Presence indicator drawn as a 2px frame edge. */
  status?: 'online' | 'away' | 'busy' | 'offline'
  /** Tint the frame for an ignored friend. */
  ignored?: boolean
  /** Drop the beveled frame; draw the picture alone. */
  bare?: boolean
  /** Round the corners. Not period-accurate; offered for completeness only. */
  round?: boolean
}
```

Notes:

- `alt` defaults to `''`, which marks the image decorative. **This is the right
  default**, because nearly every avatar in a friend list sits next to the
  person's name — announcing "dalcvi, image, dalcvi" is noise. Pass a real `alt`
  only for an avatar that stands alone (the account button).
- `name` is used only to derive initials for the placeholder and is never
  rendered as visible text.
- Failed loads fall back to the placeholder via an `onError` handler; there is no
  path that renders a broken-image icon.
- `forwardRef<HTMLSpanElement>`; `className` merged **last**.

## Accessibility

- **Inside the friend list: `alt=""`.** The name is right there. A decorative
  empty `alt` is correct and the surrounding row's accessible name should come
  from the name text, not the picture.
- **Standing alone: a real `alt`.** The account button's avatar needs
  `alt="dalcvi"` or, better, no image semantics at all and an `aria-label` on the
  button.
- **The status ring is decorative and must be `aria-hidden`.** Presence is
  conveyed by text or by `aria-label` elsewhere in the row ("dalcvi, online");
  a coloured border announces nothing. This is exactly the kind of colour-only
  signal WCAG 1.4.1 forbids, and it is easy to get wrong because the ring *feels*
  informative.
- **`--sm` at 24×24 exactly meets the target-size minimum** (WCAG 2.5.8) and has
  no margin. If the avatar is a click target, either give it a padded hit area
  (`::before` extending the box) or do not make it the thing you click — the
  corpus's own account button wraps the avatar in chrome
  (`accountbutton.layout:5`, `zpos = -2 // behind dropdown button`) rather than
  making the portrait itself the control.
- **Space must be reserved while loading.** A `42×42` avatar that arrives late
  and pushes a notification's text sideways is a layout-shift failure
  (WCAG-compatible CLS). The frame must be sized before the image exists — which
  is why the frame owns the size and the `img` fills it.
- **Contrast of the placeholder.** `Friends.NoAvatarOver` is `White` on the
  placeholder box: `--vgui-text-strong` `#FFFFFF` on `--vgui-surface-dark`
  `#3E4637` is **9.83:1**, comfortably past AAA (7:1). Good — this is one of the
  few interactions in the theme where Valve chose legibility over subtlety.
- **The status colours are the weak point.** `--vgui-steam-green` `#7EA64B` on
  `--vgui-surface-dark` is **3.48:1** and on `--vgui-surface` `#4C5844` it is
  worse at **2.67:1** (both computed; `foundations.md` §10 lists the first). That
  is below the 3:1 WCAG 1.4.11 asks for a graphical state indicator, and the ring
  is only a 2px edge on top of that. Never let the ring be the only indication of
  presence; pair it with the label text or an `aria-label`.
- **The global `img` border fails as a boundary.** `src/styles/theme.css`
  already ships `img { border: solid 2px #7b8484 }`, and an avatar is an `<img>`,
  so the component inherits it. `#7B8484` on `--vgui-surface` `#4C5844` is
  **1.66:1** and on `--vgui-surface-dark` `#3E4637` it is **2.30:1** (computed) —
  both far under the 3:1 that 1.4.11 requires of a boundary that conveys
  grouping. `Avatar` must therefore **override the inherited border** with the
  bevel pairs (`--vgui-bevel-bright` / `--vgui-bevel-dark`, 2.33:1 and 1.87:1 on
  `--vgui-surface`) and, as in the rest of the theme, must not rely on that
  bevel alone: the 1px focus/selection ring is what carries meaning, and it
  passes 3:1 because the theme's focus ring is `#292D23` on a
  maize/white surface.

## Assets

**No avatar artwork exists in this corpus and none may be shipped.** There is no
default-avatar sprite in `graphics/` — the only avatar-related art would be
user-uploaded, and `Friends.NoAvatarOver` (`steam.styles:361`) exists precisely
because there *is* no bundled avatar placeholder image; the placeholder is drawn.

That claim is about avatars specifically, and it is worth being exact about it,
because the corpus *does* ship one placeholder image for a different square
picture — the music player's album art:

| File | Dimensions | Reference |
| --- | --- | --- |
| `graphics/music_player_placeholder_album.tga` | 50×50 | none |
| `graphics/music_player_placeholder_album_400.tga` | 400×400 | none |

Both sizes were read out of the TGA headers (`bytes 12-15`), not estimated. Two
things follow. First, Steam's own answer to "there is no user image yet" was *a
shipped placeholder bitmap at two sizes, 50px and 400px*, one for the list and
one for the detail view — the same small/large pairing this doc infers from
`24×24` and `42×42` for avatars, which makes the two-size shape of the problem
corpus-sanctioned even though the avatar sizes are not. Second, neither file is
named by any `.styles`, `.res` or `.layout` file in the corpus (grep for
`placeholder` across the whole tree returns nothing), so the engine resolves that
art by naming convention in code rather than through a resource entry. That is
the one useful precedent here: placeholder art in this client is a *convention*,
which is why `Avatar` taking a `name` to draw initials, and falling back on
`onError`, is idiomatic rather than a workaround.

The library therefore draws the placeholder as `::after` content (initials, or a
neutral glyph), coloured `--vgui-text-strong` per `Friends.NoAvatarOver`. No
`.tga`, no bitmap, nothing to license.

**Assets:** `F:\steam-style\steam-style-react\` ships **no image assets, by
policy** — no `public/`, no `src/assets/`. That is unusually convenient here: no
avatar placeholder sprite has to be replaced, because the original had none for
avatars either (the album-art placeholder above belongs to the music player, not
to this component). The
picture itself is the one thing the library cannot ship and should never ship —
it is per-user data, an `<img src>`, not theme art.

## Examples

```tsx
{/* Notification toast: 42px, decorative because the name is adjacent. */}
<Notification title="dalcvi is now online">
  <Avatar src={friend.avatar} size="md" name={friend.name} status="online" />
</Notification>

{/* Account chrome: 24px, standing alone, so it needs a real alt. */}
<Avatar src={me.avatar} size="sm" alt={me.name} />

{/* No avatar available — initials over the placeholder. */}
<Avatar size="md" name="dalcvi" status="away" />

{/* Friend list row, where the name text carries all the meaning. */}
<Avatar src={f.avatar} size="sm" alt="" ignored={f.ignored} />
```

## Open questions

- **There is no bevel on the corpus avatar.** `FriendOnlineNotification.res:19-32`
  and `accountbutton.layout:5-9` declare no border, inset or render program — the
  `ImageAvatar` is a bare picture box. The beveled frame in this doc is a library
  construction chosen for consistency with `Panel`. It may be **wrong**: a
  frameless avatar is the literal transcription. A screenshot of Steam's friend
  notification would settle it.
- **The status ring is entirely invented.** Nothing in this corpus draws an
  online/away/busy indicator *on* an avatar. The colours exist
  (`--vgui-steam-green` is labelled "Online" in `foundations.md:85`) and
  `Friends.NoAvatarOver` proves the placeholder has an overlay, but no ring. If
  fidelity matters more than usefulness, drop `--status`.
- **`Friends.NoAvatarOver "White"` — over what exactly?** The token name says a
  white overlay replaces the avatar when none is set, but the underlying box's
  colour is not specified anywhere. This doc assumes `--vgui-surface-dark`
  (`#3E4637`); it could equally be black, matching the `Notification` interior.
- **Only two sizes are evidenced.** `24×24` (`accountbutton.layout:179`) and
  `42×42` (`FriendOnlineNotification.res:25-26`). The `--lg` variant is a
  guess at what a profile view would use; no such view is in these resources.
- **`--vgui-friends-selected` `#111111` and `--vgui-friends-ignored` `#F86C4F`
  are not in `foundations.md` §3.** They are real corpus values
  (`steam.styles:359`, `:362`) that no component doc has yet needed. They should
  be promoted into the palette when this component is built, or explicitly
  scoped to the friends list as a local theme.
