# Seenmark product brief

Written from the repository only. Each line cites its source. Items marked "(inferred)" are not stated anywhere and come from the cited copy or code.

## Product

Seenmark is a free, private record of a member's own hairline photos ("check-ins"), which the member compares over time before choosing a band (early, mid, or late) and reading a short educational menu of next steps. On the late band, the member can ask for a clinic introduction. (`CONTEXT.md`, `docs/adr/0002-v1-is-the-three-band-loop.md`, `apps/web/src/app/layout.tsx` metadata)

## Audience

- An adult (18+) in the United States who is noticing their own hair thinning. (`CONTEXT.md` "Member", `docs/adr/0001-v1-market-is-the-united-states.md`, `apps/web/src/components/sign-up-form.tsx` `affirmedAtLeast18` / `affirmedInUnitedStates`)
- Clinics are not users of the v1 UI. (`CONTEXT.md` "Clinic", `docs/adr/0004-verified-is-a-check-not-a-rating.md`)
- (inferred) The member is anxious and privacy-sensitive about a personal topic, and wary of being sold to. Evidence: privacy is repeated on nearly every screen ("Only you can see your photos" in `apps/web/src/app/page.tsx`, `apps/web/src/app/dashboard/dashboard.tsx`, `apps/web/src/components/auth-layout.tsx`, `apps/web/src/app/account/account.tsx`). The copy repeats "never chooses for you" and "nobody can pay to change it" (`page.tsx`, `band-sampler.tsx`, `docs/adr/0006-a-paid-link-cannot-move-the-band.md`). `idea.md` mentions people flying abroad "blind" for surgery.

## Core jobs

1. Take a check-in photo of their own hairline and keep it privately. (`apps/web/src/app/dashboard/photo-picker.tsx`, `packages/db/src/schema/check-in.ts`, `CONTEXT.md` "Check-in")
2. Compare two check-ins side by side or with a slider. (`apps/web/src/app/dashboard/compare.tsx`, `compare-slider.tsx`, `packages/api/src/comparison.ts`)
3. Choose their own band (early, mid, or late), which Seenmark never calculates. (`apps/web/src/app/dashboard/band-picker.tsx`, `packages/api/src/bands.ts`, `docs/adr/0005-the-member-chooses-the-score.md`)
4. Read the short menu of next steps for that band. (`packages/api/src/routers/menu.ts`, `apps/web/src/app/dashboard/next-steps/next-steps.tsx`)
5. On the late band, record an introduction request, which is stored and not sent anywhere. Manage or delete their data. (`apps/web/src/app/dashboard/next-steps/introduction-request.tsx`, `apps/web/src/app/account/account.tsx`, `docs/adr/0004-verified-is-a-check-not-a-rating.md`)

## Pages and screens

### Web (`apps/web/src/app`, Next.js App Router)

| Route | Purpose | Key content | Source |
| --- | --- | --- | --- |
| `/` | Landing page | Hero "Your hairline, over time." with scattered paper notes and a hero photo. How-it-works accordion (3 steps). Interactive band sampler. "Private by design" (3 promises). FAQ (4 cards). Final "Start with one check-in" CTA | `page.tsx`, `how-it-works.tsx`, `band-sampler.tsx` |
| `/login` | Sign in | Yellow promise panel, then email and password form | `login/page.tsx`, `components/auth-layout.tsx`, `components/sign-in-form.tsx` |
| `/signup` | Create account | Promise panel, then name, email, password, an 18+ checkbox and a US-resident checkbox | `signup/page.tsx`, `components/sign-up-form.tsx` |
| `/dashboard` | Check-ins (main member screen) | Header with count and last check-in time, and an "Add check-in" action. Reminder alert. Compare (empty, baseline, or side-by-side/slider). Timeline grouped by month, with a row menu (open, compare, delete). Sidebar with the band picker and a menu preview. Check-in dialog | `dashboard/dashboard.tsx` and its siblings |
| `/dashboard/next-steps` | Menu for the chosen band | Numbered steps, a band badge with "Change band", an empty state with no band, the introduction request card (late band), and the early menu's "Paid link" card | `dashboard/next-steps/*.tsx` |
| `/account` | Account | Details (name, email), sign out, privacy list, and a danger zone that deletes the account | `account/account.tsx` |
| `/todos` | Legacy redirect to `/dashboard` | none | `todos/page.tsx` |
| 404 | Not found | "This page is not here." with a link home | `not-found.tsx` |
| Shared chrome | Sticky header with pill nav, mobile menu sheet, theme toggle, user menu; footer with grouped links and a disclaimer | none | `components/header.tsx`, `nav-pills.tsx`, `site-footer.tsx` |

### Native (`apps/native/app`, Expo Router)

`(auth)/welcome`, `(auth)/sign-in`, `(auth)/sign-up`, `(tabs)/(check-ins)/index` (check-ins list and compare), `(tabs)/(check-ins)/check-in/[id]`, `(tabs)/(check-ins)/next-steps`, `(tabs)/account`, `about`, `+not-found`. Built from SwiftUI and Jetpack Compose primitives in `components/form`. (`apps/native/app/**`, `README.md` "Native app UI")

## Tone and feel

Private, plain-spoken, calm, member-in-control. (inferred)

Evidence: the FAQ heading is "Questions, answered plainly." (`page.tsx`). The native welcome calls the app "A quiet place to keep your own check-in photos" (`apps/native/app/(auth)/welcome.tsx`). Copy repeats "at your pace" and "whenever you're ready" (`next-steps.tsx`, `page.tsx`). Non-clinical language is required: the glossary rules out "diagnosis", "scan", "patient" and "Norwood" (`CONTEXT.md`, `docs/adr/0005-the-member-chooses-the-score.md`).

## Stack and platforms

- Web: Next.js 16 (App Router, React 19, React Compiler), Tailwind CSS v4, shadcn/ui (style `base-lyra`, Base UI primitives) in `packages/ui`, lucide-react, next-themes, sonner, TanStack Form and Query, tRPC. (`apps/web/package.json`, `packages/ui/components.json`, `README.md`)
- Native: Expo 57, expo-router NativeTabs, `@expo/ui` (SwiftUI and Compose). (`apps/native/package.json`, `README.md`)
- Backend: Hono, tRPC, Drizzle on Postgres, Better Auth. (`README.md`, `bts.jsonc`)
- Both clients ship, and the web is a full target. ADR 0002 wanted one client, and ADR 0007 records that both frontends stay. (`docs/adr/0002-*`, `docs/adr/0007-*`)

## Existing design constraints to keep

- Tokens live in `packages/ui/src/styles/globals.css`: a cool grey background `oklch(0.961 0.004 271)` (#F1F2F5), ink foreground (#16161B), and one highlighter yellow primary `oklch(0.891 0.166 94)` (#FFD83D) that is only a fill under ink, never text. A dark theme is included. (`globals.css`, `apps/native/lib/constants.ts` comment)
- Type: Bricolage Grotesque (opsz axis) for display and body, with Geist Mono. Type tokens are `text-display`, `text-title`, `text-heading` and `text-lede`. (`apps/web/src/app/layout.tsx`, `globals.css`)
- Brand elements: the `hl` highlighter-mark utility, the ring-and-dot logo (`components/logo.tsx`), pill buttons with an ink-outline variant (`packages/ui/src/components/button.tsx`), the sliding yellow nav pill (`nav-pills.tsx`), and "paper" surfaces with `shadow-paper` and tilts.
- Motion tokens (`ease-out-soft`, `rise`, `drop`, `stagger`, `reveal`) honor reduced motion. (`globals.css`)
- Accessibility work already done: a skip link, radio semantics on toggle groups (`choice-group.tsx`), focus return after deletes, and live regions. (`layout.tsx`, `choice-group.tsx`, `timeline.tsx`)
- Product rules the UI must not break: nothing drawn on photos that reads as a measurement (`compare.tsx` comment, ADR 0005). No paid link on the band screen, and it must be labeled "Paid link" (ADR 0006). No star ratings or clinic directory (ADR 0004). The native palette mirrors the web palette (`apps/native/lib/constants.ts`).
