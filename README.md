# Planary Portal

The customer portal at **portal.planary.ch**: where organisations (clubs, schools, communities) see their tournaments, plan and invoices, manage their team and talk to Planary support. German, "du".

Next.js 16 (App Router), React 19, plain CSS from the handoff boards (`src/app/portal.css`), dark mode through `next-themes`. No UI library.

## Pages

| Route | Screen |
| --- | --- |
| `/` | Übersicht: kommende und vergangene Turniere, Plan, Nutzung, offene Anfrage. New organisations get the four-step welcome. |
| `/turniere`, `/turniere/[id]` | All tournaments with filters; one tournament with its steps, facts, share link and organisers. |
| `/abrechnung` | Plan: Gratis (usage meters, what's missing, Turnier-Pass and Plus side by side), Gratis with passes, or Plus (subscription lines, last invoices, usage, payment method, billing contact). The overdue panel, the card-expiry note and the "switches to Gratis" note sit on top when they apply. Owners only. |
| `/abrechnung/rechnungen` | Every invoice with its status; the selected one shows its lines, total, "Mit Karte bezahlen" and the QR invoice. |
| `/abrechnung/wechseln` | Switch to Gratis at the end of the paid year: dates, what stays, what changes, who keeps organising (Gratis seats). |
| `/kasse` | Checkout, slim chrome. `?plan=plus` or `?pass=tournament`, optional `&org=`, `&tournament=` (with `&title=`) and `&return=` (planary.ch hosts only). Picks the organisation (or creates one in step 1 for someone without one), the tournament for a pass, and card or invoice for Plus. Card payments continue at Stripe through the URL the API returns; the portal never shows card fields. A declined card comes back here with the reason. |
| `/kasse/fertig?id=` | After paying: waits for the confirmation, then what's unlocked and the way back (the tournament from `return`, team, logo, receipt). |
| `/team` | Members, roles, pending invitations, invite form. Members read only. |
| `/support`, `/support/neu`, `/support/[id]` | Requests, "Etwas stimmt nicht" with topic, tournament, image and "läuft gerade", the thread with reply and attachment, "Als erledigt markieren". |
| `/einstellungen` | Name, tournament address, logo, contact, billing address, delete (30 days). Owners only. |
| `/neu` | Create an organisation. |
| `/einladung/[token]` | Accept an invitation from the e-mail. |

The overdue banner (owners) and the incident banner (organisers with live tournaments, from the Console's "show to organisers") sit under the tabs on every page.

## Data

Everything comes from **planary-org** (`NEXT_PUBLIC_ORG_API`), typed by `src/lib/org-contract.ts`, a copy of planary-org's `src/contract.ts`. Keep them in sync. Sign-in is the Planary Account: planary-auth hands its token back in the URL hash (`src/lib/session.ts`), `/api/me` checks it server-side.

The organisation picked in the switcher is remembered per browser (`src/lib/current-org.ts`).

## Develop

```bash
npm install
NEXT_PUBLIC_PORTAL_DATA=fixtures npm run dev   # http://localhost:3004, sample data, no sign-in
npm run typecheck && npm run lint && npm run build
```

Fixture mode answers from the handoff's sample data (`src/lib/portal-fixtures.ts`) with a fixed clock. `?state=` picks a designed state:

| `?state=` | Shows |
| --- | --- |
| (none) | Verein Gurten LAN, Matteo Keller as owner |
| `new` | Spielclub Thun, just created (welcome checklist, plan Gratis) |
| `gratis` | Spielclub Thun on Gratis with some use (PL-Plan-Gratis) |
| `pass` | Spielclub Thun on Gratis with two passes (PL-Plan-Pass) |
| `overdue` | Invoice 2026-0213 twelve days open: amber banner and tab count, the overdue panel |
| `card` | The card expires before Plus renews |
| `canceling` | Plus switches to Gratis at the end of the year |
| `payfail` | Checkout: the card comes back declined |
| `billing-error`, `billing-loading` | Only the billing call fails or hangs (PL-Plan-Error, PL-Plan-Loading) |
| `incident` | The amber incident banner |
| `member` | Noa Brunner as member: no Abrechnung or Einstellungen, team read only |
| `none` | Noa Brunner, signed in without an organisation (solo checkout creates one) |
| `error`, `loading` | The error card and the loading state |

Writes change an in-memory copy, so sending a request, replying, inviting, saving settings, checking out (paid at once, the provider is skipped) and switching to Gratis can be clicked through.

## Deploy

Vercel (or any Next host) with the variables in `.env.example`, domain `portal.planary.ch`. planary-org must list `https://portal.planary.ch` in its allowed origins, and planary-auth must allow it as a `returnTo`.
