# 75

A college attendance tracker. Mark every class, watch your percentage, stay above the line.

Mobile-first React PWA with a retro-arcade skin - black canvas, pixel type, hard edges, light-blue accent.

---

# Install it

### **[seventyfive75.web.app](https://seventyfive75.web.app)**

<img src="docs/install-qr.svg" alt="QR code for seventyfive75.web.app" width="200" />

Point your camera at that and it opens straight to the app. No typing, no app store.

Then install it so it lives on your home screen like any other app, with no address bar:

**Android (Chrome)**
Open the link, then either tap the **Install** banner Chrome shows at the bottom, or **⋮ menu -> Add to Home screen -> Install**. It lands in your app drawer and opens full screen.

**iPhone / iPad (Safari)**
Open the link **in Safari** (Chrome on iOS cannot install web apps), then **Share button -> Add to Home Screen -> Add**.

**Desktop (Chrome / Edge)**
Click the **install icon** at the right of the address bar, or **⋮ menu -> Cast, save and share -> Install page as app**.

Once installed it works offline for anything already loaded, and updates itself in the background every time it is opened.

## Want a real Android APK?

Installing above still starts in a browser. If you want a file you can send round WhatsApp and install like a normal Android app, wrap it as a Trusted Web Activity:

**Easiest, nothing to install:** go to [pwabuilder.com](https://www.pwabuilder.com), paste `https://seventyfive75.web.app`, hit **Package for stores -> Android**, and download the `.apk`. Anyone installing it will need to allow **Install unknown apps** once, since it is not coming from the Play Store.

**From the command line**, if you have a JDK and the Android SDK:

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://seventyfive75.web.app/manifest.webmanifest
bubblewrap build          # produces app-release-signed.apk
```

Either route produces an app that is genuinely just this site in a full-screen shell, so it stays up to date on its own with no reinstalling.

There is no iOS equivalent. Apple only allows web apps on the home screen through the Safari route above.

> Regenerate the QR after changing the URL with `npm run qr` (or `APP_URL=https://example.com npm run qr`).

---

## What it does

- Pick your **year, semester and section** once; the app already knows your routine.
- **Y is computed for you.** Every class the routine scheduled between your semester start date and now counts as held - minus anything you mark as *no class*. Classes you never marked count against you until you fill them in.
- **X is what you mark.** Present / Absent / No class, per class, from the Subjects screen.
- Home shows **overall, theory and practical** percentages. The bottom-nav dial always shows the overall number.
- Each subject has a **dated history** you can correct, plus a `+` that back-fills any day you forgot.
- Colour bands: **≥75% blue**, 65-74% amber, **<65% red**.

## Setup

```bash
npm install
cp .env.example .env     # fill in from the Firebase console
npm run dev
```

Create a Firebase project, enable **Authentication → Email/Password and Google**, and create a **Firestore** database. Paste the web app's config into `.env`.

Without `.env` the sign-in screens still render, but no auth or data will work.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run lint` | Type-check only |
| `npm test` | Vitest - the attendance math specs |
| `npm run icons` | Regenerate PWA PNGs from `public/*.svg` (needs `sharp`) |
| `npm run qr` | Regenerate the install QR in `docs/` |

## Deploying

```bash
npm run build
firebase login
firebase use --add            # writes .firebaserc
firebase deploy               # hosting + firestore rules
```

`firebase.json` already carries the correct PWA cache headers: never cache the service worker, shell or manifest; cache hashed assets for a year.

## Adding a section

Everything routine-shaped lives in `src/data/`.

1. Add any new papers to `SUBJECTS` in `src/data/subjects.ts`.
2. Add a `Section` to `SECTIONS` in `src/data/routines.ts` with its `slots`, and set `status: 'available'`.

A section listed with `status: 'soon'` appears in the setup picker but can't be chosen.

### Lab batches

Both current sections split into two lab batches, because their routines run two
labs in parallel rooms. Tag a slot with `batch: '1'` or `batch: '2'` and only
students in that batch see it; leave `batch` off and everyone gets it. Declare
the ids on the section as `batches: ['1', '2']` and the setup screen grows a
batch picker automatically.

Batch 2 is the group listed second on the printed routine (the "II" rows). Each
batch ends up with one session of each lab per week and 16 classes in total.

If a section gains batches after students have signed up, the setup gate sends
them back to pick one rather than silently dropping their labs from the totals.

**Slot ids are permanent.** Stored attendance records point at them, so if a routine changes mid-semester, repoint an existing slot at a different subject rather than renumbering it.

## Layout

```
src/
  data/         subjects.ts, routines.ts     - static routine config
  lib/          firebase.ts, attendance.ts   - SDK init; all the maths (+ specs)
  utils/        date.ts, band.ts, advice.ts, cn.ts
  types/        every Firestore document shape
  services/     writes (auth, user, attendance)
  hooks/        reads (useAttendanceRecords, useStats, useMarking, useNow)
  context/      AuthContext, StatsContext
  components/   auth/ layout/ attendance/ ui/
  pages/        one component per route
```

Reads are live `onSnapshot`; writes are plain service calls with no optimistic
update - the open listener pushes the new state back. Attendance documents are
keyed `YYYY-MM-DD__slotId`, so every write is idempotent and re-marking a class
overwrites instead of duplicating.
