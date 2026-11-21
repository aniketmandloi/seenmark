# Seenmark design system

Generated with the ui-ux-pro-max skill from `PRODUCT_BRIEF.md`, for the web app (`apps/web`, `packages/ui`). The native app mirrors the same palette in `apps/native/lib/constants.ts`.

## How this was generated

- The two `--design-system` runs did not fit this product. "private personal health tracking calm" returned an Enterprise Gateway pattern with a red and blue palette. "personal health progress tracker" returned Glassmorphism on navy with Caveat and Quicksand. The skill's query contract says unverified output must not be persisted, so neither result was saved as-is.
- This file instead combines focused domain searches with the constraints already in the brief:
  - `--domain product` (Healthcare App, Mental Health App) gave **Accessible & Ethical** as the primary style.
  - `--domain style "accessible ethical"` gave 7:1 contrast targets, 3–4px focus rings, 44px targets and a 16px minimum body size.
  - `--domain typography` gave a data-pairing principle: keep display type and data type separate.
  - `--domain google-fonts "Bricolage Grotesque"` confirmed opsz 12–96, wdth 75–100 and wght 200–800.
  - `--domain chart "timeline progress over time"` covers time series: series are told apart by line style plus direct labels, never by hue alone.
  - `--domain ux` covered contrast and number formatting.
- The neumorphism and claymorphism secondary styles were rejected. They rely on low-contrast surfaces, which conflicts with the readability requirement.

## 1. UI style

**Accessible & Ethical with an editorial highlighter.** The base is a calm, high-contrast reading surface: ink on cool paper, generous measure, one accent. The brand expression is a single highlighter yellow used the way a person marks their own notes. It marks what *you* chose or what matters right now, and nothing else.

Principles:

1. **Plain record, not a clinic.** Surfaces read as a private notebook: paper cards, ink type and dates. Nothing looks clinical, such as gauges, scores, percentages or progress rings.
2. **Yellow means "yours".** The highlighter marks the member's choice (selected band, the active nav item, the primary action) and key words in headlines. It is never used for warnings, decoration fields or more than one focal point per view.
3. **Photos stay unmarked.** Nothing is drawn on or over a check-in photo that could read as a measurement (ADR 0005). Overlays, grids, rulers and heatmaps are out.
4. **Calm motion.** Motion is short and caused by something the member did. Everything honors `prefers-reduced-motion`.

## 2. Palette

All values are the live tokens in `packages/ui/src/styles/globals.css`, converted from OKLCH to sRGB hex.

### Light

| Token | Hex | OKLCH | Use |
| --- | --- | --- | --- |
| `--background` | `#F1F2F5` | 0.961 0.004 271 | Page (cool paper) |
| `--foreground` | `#16161B` | 0.202 0.01 285 | Ink: text, outlines, focus ring |
| `--card` | `#FBFBFC` | 0.988 0.001 286 | Cards, sheets, popovers |
| `--primary` | `#FFD83D` | 0.891 0.166 94 | Highlighter fill. **Never text.** |
| `--primary-foreground` | `#16161B` | 0.202 0.01 285 | Ink on yellow |
| `--muted` / `--secondary` | `#E6E8EC` | 0.931 0.006 265 | Quiet bands, secondary buttons |
| `--muted-foreground` | `#4A4A55` | 0.413 0.018 286 | Secondary text, captions, dates |
| `--accent` | `#FFF3BF` | 0.961 0.068 97 | Pale highlighter wash (reminders, request card) |
| `--destructive` | `#B01F1F` | 0.49 0.18 27 | Delete, errors; ≥4.5:1 on its own 10–20% tints |
| `--success` | `#227240` | 0.49 0.11 152 | "Recorded", "Saved" |
| `--border` | `#D5D7DE` | 0.88 0.01 273 | Dividers (decorative only) |
| `--input` | `#83868F` | 0.62 0.014 273 | Field and control borders, 3.5:1 on Sheet |

### Dark

| Token | Hex | Use |
| --- | --- | --- |
| `--background` | `#121215` | Page |
| `--foreground` | `#F1F1F4` | Text |
| `--card` | `#202026` | Cards |
| `--primary` | `#FFD83D` | Highlighter, unchanged, still under ink `#16161B` |
| `--muted` | `#1B1B20` | Quiet bands |
| `--muted-foreground` | `#B6B6C2` | Secondary text |
| `--accent` | `#3A3418` | Dark highlighter wash |
| `--destructive` | `#F97770` | Delete, errors |
| `--success` | `#65C281` | Saved |
| `--border` | `#2D2D35` | Dividers |
| `--input` | `#71717A` | Field and control borders, 3.3:1 on card |

### Measured contrast (WCAG 2.x)

| Pair | Light | Dark | Target |
| --- | --- | --- | --- |
| foreground / background | 16.1 | 16.6 | 7:1 ✅ |
| foreground / card | 17.4 | 14.4 | 7:1 ✅ |
| muted-foreground / background | 7.8 | 9.3 | 7:1 ✅ (small text and dates) |
| muted-foreground / muted | 7.1 | 8.6 | 7:1 ✅ |
| ink / primary (yellow) | 13.0 | 13.0 | 7:1 ✅ |
| destructive / card | 6.6 | 6.1 | 4.5:1 ✅. Also ≥4.7:1 on its own 10–20% button tints. Darkened from `#BE2F2C`, which fell to 4.46:1 on the page. |
| success / card | 5.7 | 7.4 | 4.5:1 ✅ |
| input / card | 3.5 | 3.3 | 3:1 ✅. Raised from 1.6 / 1.5 (was `#C8CAD3` / `#3C3C44`) so field and control boundaries meet WCAG 1.4.11. |
| primary / background (yellow as a shape) | 1.2 | 13.5 | Yellow alone never carries meaning in light mode. It always pairs with ink text, a check icon or an ink outline. |

Rules:
- Small text (≤14px), dates and counts use `--foreground` or `--muted-foreground` only. Never use opacity-reduced text below 7:1. `/75`-style alpha on body copy over yellow must still be measured.
- Raw hex is never written in components. Use tokens. The one existing exception is the "Take a check-in" panel on the landing page, which uses fixed zinc on purpose because it sits over a photo.

## 3. Typography

| Role | Typeface | Where | Settings |
| --- | --- | --- | --- |
| Display | **Bricolage Grotesque** (variable; opsz, wght) | `h1`, section `h2`s, the big CTA line, band names in the sampler | 600 weight, opsz high, tracking −0.035em, `text-balance`. **Headlines only.** |
| Text and UI | **Public Sans** (variable; wght 100–900) | Body, labels, buttons, nav, form fields, card titles at ≤24px, every number and date | 400 body and 500–600 labels. `tabular-nums` on every date, count and time. |
| Mono | Geist Mono | Reserved (IDs, debug); not used in UI today | |

Why Public Sans: it was designed for US public-service interfaces (USWDS). It is plain-spoken, neutral, with an open aperture and clear `1 / l / I` and `0 / O` shapes at 12–14px, and it has true tabular figures. That fits a US-only, trust-first product and fixes the one readability problem today: Bricolage's quirky small-size forms carry the body copy, dates and counts. It loads through `next/font/google` like the existing fonts, so no dependency is added.

Scale (existing tokens, kept):

| Token | Size | Line height | Font |
| --- | --- | --- | --- |
| `text-display` | clamp(2.9rem → 4.6rem) | 1.0 | Bricolage |
| `text-title` | clamp(2.25rem → 3.75rem) | 1.02 | Bricolage |
| `text-heading` | 1.5rem | 1.25 | Bricolage |
| `text-lede` | 1.125rem | 1.75 | Public Sans |
| body (`text-base`) | 1rem | 1.5–1.6 | Public Sans |
| small (`text-sm`) | 0.875rem | 1.5 (`leading-6`) | Public Sans, 500 for labels |
| caption (`text-xs`) | 0.75rem | 1.6 | Public Sans; **minimum size anywhere**, never below 12px |

Body measure is 45–70ch (`max-w-[42ch]`–`[52ch]` are in use).

## 4. Spacing scale

A 4px base (Tailwind's default). Density 4/10 means spacious for marketing and standard for member screens.

| Step | px | Use |
| --- | --- | --- |
| 1 | 4 | Icon gap inside chips |
| 2 | 8 | Gap between tightly related controls |
| 3 | 12 | Row padding, gap between buttons |
| 4 | 16 | Card inner gaps, page gutter on mobile (`px-5` = 20 is the gutter actually used) |
| 6 | 24 | Card padding on mobile, header-to-content |
| 8 | 32 | Card padding on desktop, gap between sidebar cards |
| 10–12 | 40–48 | Gap between member-screen sections |
| 16 | 64 | Footer top padding |
| 24 / 32 | 96 / 128 | Landing section padding (`py-24 lg:py-32`) |

Containers: `max-w-7xl` for the landing and dashboard, `max-w-3xl` for single-column member pages. Gutters are `px-5 sm:px-8 lg:px-10`.

## 5. Buttons

All buttons are pills (`rounded-full`) with an ink focus ring (`ring-2 ring-ring ring-offset-2`).

| Variant | Look | Use |
| --- | --- | --- |
| default | Yellow fill, ink label, soft yellow glow, hover `brightness-105` | **One per view.** Add check-in, Get started, Record my request |
| outline | 2px ink border, inverts to ink fill on hover | Secondary actions: How it works, Sign out, Change band |
| secondary | Muted fill | Low-emphasis toggles |
| ghost | No fill; muted on hover | Icon buttons in rows and the header |
| destructive | Red tint and red label | Delete actions, always behind a confirm dialog |
| link | Ink text with a 2px yellow underline | Inline links ("Open your next steps") |

Sizes: default 44px high (touch minimum), `lg` 48px, `sm` 36px and `icon-sm` 36px. The small sizes are desktop-dense rows only, and their hit area on touch must still reach 44px. Press feedback is `scale-97`. Disabled is 50% opacity with no pointer events. Pending buttons show a spinner, a verb in "-ing…" form and `aria-busy`.

## 6. Cards and surfaces

| Surface | Recipe | Use |
| --- | --- | --- |
| Paper card | `bg-card ring-1 ring-border shadow-paper rounded-2xl`, padding 24/32 | Band picker, auth form |
| Flat card | `bg-card border border-border rounded-2xl` | Menu preview, timeline month groups |
| Highlighter panel | `bg-primary text-primary-foreground rounded-2xl` | One per page at most: auth promises, final CTA |
| Wash | `bg-accent/40–50` | Reminder alert, introduction request |
| Dashed slot | `border-2 border-dashed` | Empty states and "nothing chosen yet" |
| Danger zone | `border border-destructive/30` | Account deletion |

Radius: `rounded-full` for controls, `rounded-2xl` (20px) for cards, `rounded-md` for paper notes and photos. Elevation has three steps only: `shadow-soft` (header on scroll), `shadow-paper` (cards and notes) and `shadow-lifted` (dialogs).

## 7. Chart colors

Seenmark has **no charts of hair**. A chart of a photo-derived value would be a measurement (ADR 0005). Charts may only show what the member did, for example how often they took a check-in. When one is needed:

| Token | Light | Dark | Line / mark |
| --- | --- | --- | --- |
| `--chart-1` | `#16161B` ink | `#F1F1F4` | Solid 2px line or solid bar |
| `--chart-2` | `#FFD83D` highlighter, **with a 1px ink outline** | `#FFD83D` | Filled bar or dot; never a thin line on light |
| `--chart-3` | `#4A4A55` | `#B6B6C2` | Dashed 2px |
| `--chart-4` | `#227240` | `#65C281` | Dotted 2px |
| Grid | `#D5D7DE` | `#2D2D35` | 1px, low contrast |

Direct labels go on the marks, axis labels are Public Sans `text-xs` with `tabular-nums`, and every chart includes a text summary or table alternative.

## 8. Anti-patterns for this product

1. **Anything that reads as a diagnosis.** No Norwood stages, percentages, "hair score" dials, before/after arrows, or overlays on photos.
2. **Clinical or pharma styling.** No medical blue-and-teal, sterile white, stethoscope or DNA iconography, or lab-coat stock photos. They signal "patient", and the glossary avoids that word.
3. **Sales pressure.** No countdowns, "limited spots", or clinic logos as social proof. No more than one paid link, always labeled "Paid link" next to it, and never on the band screen (ADR 0006).
4. **Star ratings or clinic rankings** (ADR 0004).
5. **Fear copy or red-for-worse.** Red is only for destructive actions and errors, never for a band or the passage of time.
6. **Yellow as text or as the only signal.** Yellow is 1.2:1 on the light page, so it always sits under ink or next to an icon.
7. **Low-contrast "calm".** Grey-on-grey small text, `opacity-60` captions, and neumorphic or clay surfaces without boundaries.
8. **Display type in functional UI.** Bricolage in form fields, table cells, dates or buttons.
9. **Hover-only disclosure.** Every hover interaction (how-it-works panels, nav pill) needs a click, tap and keyboard path.
10. **Generic SaaS landing furniture.** Three identical icon cards, gradient blobs, glassmorphism, emoji icons, or "Trusted by" logo strips.
11. **Motion without cause.** Autoplaying carousels, parallax, and looping attention animations (the existing `breathe` is for loading only).

## 9. Creative direction (frontend-design)

**Concept: the margin of a private notebook.** A member's record is a set of dated entries. The design borrows the one device a personal notebook has that an app usually doesn't: a **margin**. Dates, months, band names and section names live in a narrow left margin, and the entry (photo, step, detail) sits to its right. The highlighter is the member's own pen: it marks what they chose, and nothing else.

### Palette (named)

| Name | Hex | Role |
| --- | --- | --- |
| Paper | `#F1F2F5` | Page |
| Sheet | `#FBFBFC` | Cards, fields, dialogs |
| Ink | `#16161B` | Text, outlines, focus, field borders at 40%+ |
| Pencil | `#4A4A55` | Margin labels, dates, captions |
| Highlighter | `#FFD83D` | The member's mark: chosen band, current nav, the one primary action |
| Wash | `#FFF3BF` | Pale highlighter for reminders and the request card |

Functional red `#B01F1F` and green `#227240` are status colors, not part of the palette.

### Type

- **Bricolage Grotesque**: headlines (`h1`, section `h2`), the logo wordmark and the final CTA line. Nothing else.
- **Public Sans**: everything a person reads or operates, including body, labels, buttons, nav, fields, band options, step lists, dates and counts. Numbers always use `tabular-nums`.

### Layout

```
member pages (lg+)                         mobile
┌────────────┬─────────────────────────┐   ┌──────────────────┐
│ margin     │ entry                   │   │ margin label     │
│ (3 cols)   │ (9 cols)                │   │ entry            │
│ Nov 2026   │ ▢ 21 Nov  2 days ago  … │   │                  │
│            │ ▢ 3 Nov   3 weeks ago … │   │ Oct 2026         │
│ Oct 2026   │ ▢ 12 Oct  …             │   │ entry            │
└────────────┴─────────────────────────┘   └──────────────────┘
```

Content is left-aligned throughout and nothing is centered except empty states. Margin labels are real headings, so the outline stays intact, at two levels:

- **Section** (`MarginSection`, `h2`): Ink Public Sans, 16px semibold. Used on the account sections and the band on next steps.
- **Date** (timeline months, `h3`): Pencil, 14px medium, `tabular-nums`.

Content outside a `MarginSection` lines up with the entry column through `marginEntryIndent`. The dashboard is one reading column (`max-w-5xl`) in the order the member works: compare, then choose a band, then the timeline. It never has a sidebar, and the band's menu lives only on its own page.

### Principles

1. Yellow marks only what the member chose (the band, the compare mode, the current page in the nav) or the one thing to do next (one primary button per view). Supporting marks use ink outlines (check discs, step numbers) or Wash (the accent note). The header's visitor "Get started" is an outline button so it doesn't compete with the page's own.
2. Structure carries information. Steps are numbered only where they are a sequence (how it works). Menu items are facts, not steps, so they get a highlighter tick, not a number.
3. One memorable moment per page: the hero highlighter sweep on the landing page, and the margin on member pages. Everything else stays quiet.

### Review against the brief: what changed and why

The first draft of this plan kept the screens as they were. Reviewing it against the frontend-design defaults list and the brief changed five things:

- **Highlighted words in every headline → only in the landing hero.** "Three bands, *three short menus*" and "Your *check-ins*" accented a phrase for decoration, which is a stock tell. The highlighter now means "yours" (the chosen band, the current page). The hero mark stays because it is the brand's established moment (brief: keep `hl`).
- **Middle-dot meta strings → sentences.** "3 check-ins · last one 2 days ago" becomes "3 check-ins. The last one was 2 days ago." The same applies to "Recorded on …".
- **Eyebrow labels above titles → removed.** The privacy line on the dashboard becomes the lede, and the 404 title already says "not here".
- **Arrow glyphs on CTAs → removed.** "Get started" states the action.
- **Numbered circles on menus → highlighter ticks.** The early, mid and late menus are not sequences (brief: "Menu: not a store", educational facts).

The direction is also not one of the default clusters. There is no cream and terracotta, no near-black with acid green, and no hairline broadsheet. The yellow and cool-grey pair comes from the brand, and the margin layout comes from the subject (a dated personal record), not from a template.

### Charts

There are none in the product, and per §7 none are added. The grids this applies to are the landing promise grid, the FAQ grid, the dashboard 2/3 + 1/3 grid, the compare grid and the timeline.
