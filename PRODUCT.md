# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The web app is `apps/web` (Next.js). The Expo app in `apps/native` records its own platform in `apps/native/PRODUCT.md`. Everything else here is shared.

## Users

Members: adults (18+) in the United States who are noticing their own hair thinning. They are privacy-sensitive about a personal subject and wary of being sold to. They come to keep photos of their own hairline, look back at them, and decide for themselves what, if anything, to do next. Clinics are not users of v1.

## Product Purpose

Seenmark is how a member keeps photos of their own hairline ("check-ins") and chooses a next step. The member compares check-ins side by side or with a slider, chooses a band (early, mid, or late), and reads a short educational menu for that band. On the late band, they can record an introduction request. Success is a member who trusts the record enough to come back and add the next check-in.

## Positioning

A clinic is the last step, not the front door. Seenmark never interprets a photo: the member chooses the band, and nobody can pay to change it. "Verified" is a check Seenmark performs (a named US-licensed physician, a published price range, and result photos at least 12 months out that are not the clinic's ads). It is not a badge or a rating, and no clinic is verified in v1.

## Operating Context

- A member takes a check-in at home, in similar light each time, often months apart. A monthly reminder may invite another photo, but it never says the hair got worse.
- On web, a photo comes from a file or the phone camera. On native, it comes from the camera only.
- An introduction request is stored for the member and is not sent to any clinic in v1.

## Capabilities and Constraints

- Check-ins are visible only to the member, are never sent to a clinic, and are deleted with the check-in or the account.
- Nothing drawn on or around a photo may read as a measurement. There is no Norwood stage, no score computed from a photo, and no treatment recommendation (ADR 0005).
- Menus stay educational. Mid says a prescriber is who discusses medicines, and late explains what a clinic conversation and "verified" mean.
- At most one paid link, only on the early menu, never on the screen where the band is chosen, and labeled "Paid link" right next to it (ADR 0006).
- There is no clinic directory, no star ratings, and no rankings (ADRs 0002 and 0004).
- The member never pays, and clinics don't pay in v1 (ADR 0003).
- Terminology follows `CONTEXT.md`: member, check-in, band, score, introduction, menu, verified clinic. Avoid patient, scan, diagnosis, lead and catalog.

## Brand Commitments

- Name: Seenmark, with a ring-and-dot logo mark.
- Voice: private, plain-spoken, calm, member-in-control. Sentence case. Copy says what happens, never sells, and never uses fear.
- A highlighter yellow under ink is the brand's single accent (see `design-system.md`).

## Evidence on Hand

- One hero photograph: `apps/web/public/seenmark-checkin-hero.png`.
- There are no testimonials, customer counts, clinic partners, press or outcome data. Future work must not fabricate any of them.

## Product Principles

1. The member decides. The interface shows, and never concludes.
2. Privacy is stated where it matters, in plain words, not as a badge.
3. Every action names exactly what will happen, including what will not happen (e.g. "not sent to a clinic").
4. Commerce cannot move the member's band or the order of a menu.

## Accessibility & Inclusion

Members may be anxious and reading closely about a personal subject. Text, dates and counts must stay highly readable: WCAG 2.2 AA at minimum, with 7:1 as the target for body and small text. Full keyboard support, honored reduced motion, and both light and dark themes.
