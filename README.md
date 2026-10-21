# Planary Portal

The customer portal at **portal.planary.ch**: where organisations (clubs, schools, communities) see their tournaments, plan and invoices, manage their team and talk to Planary support. German, "du".

Next.js 16 (App Router), React 19, plain CSS from the handoff boards (`src/app/portal.css`), dark mode through `next-themes`. No UI library.

## Pages

| Route | Screen |
| --- | --- |
| `/` | Übersicht: kommende und vergangene Turniere, Plan, Nutzung, offene Anfrage. New organisations get the four-step welcome. |
| `/turniere`, `/turniere/[id]` | All tournaments with filters; one tournament with its steps, facts, share link and organisers. |
| `/abrechnung` | Invoices (PDF, pay link), plan switch (Stripe Checkout, Event per tournament, Verein by card, TWINT or invoice), payment method (Stripe customer portal), billing address. Owners only. |
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
| `overdue` | Invoice 2026-0142 twelve days overdue (red banner, red tab count, "Bezahlen") |
| `incident` | The amber incident banner |
| `member` | Noa Brunner as member: no Abrechnung or Einstellungen, team read only |
| `none` | Signed in without an organisation |
| `error`, `loading` | The error card and the loading state |

Writes change an in-memory copy, so sending a request, replying, inviting or saving settings can be clicked through.

## Deploy

Vercel (or any Next host) with the variables in `.env.example`, domain `portal.planary.ch`. planary-org must list `https://portal.planary.ch` in its allowed origins, and planary-auth must allow it as a `returnTo`.
