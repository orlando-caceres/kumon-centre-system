# Kumon Production V1.1 — Persistent Client-Test Build

This build keeps the approved V1 interface and makes its current interactive state persistent in MySQL.

## Important architecture note
V1.1 is a **client-testing bridge**. The normalized V1 tables (`students`, `allocations`, etc.) remain in the database, but the approved prototype UI is persisted as one JSON application-state record in `app_state`. This avoids rewriting/breaking the UI before client testing. V2 will migrate the UI to the normalized/flexible schema (student IDs, given/surname, guardians, configurable times/capacities).

## Upgrade an existing V1 installation
1. Back up your existing project folder and database.
2. Unzip this package into a new folder.
3. Copy your existing `.env` from V1 into this folder. Do not copy `.env.example` over it.
4. In Terminal, `cd` into this folder.
5. Run `npm install`.
6. Run `npm run db:migrate:v1.1`.
7. Run `npm run dev`.
8. Open `http://localhost:3000/api/health` and confirm database connected.
9. Open `http://localhost:3000`.
10. Wait for the bottom-right indicator to say `Database: saved`.

## Persistence test
- Add a test student.
- Wait until the indicator says `Database: saved`.
- Refresh the browser. The student must remain.
- Move the student. Wait for `Database: saved`, refresh, and confirm the move remains.
- Add to waitlist / create an absence / mark inactive and repeat the refresh test.
- Stop Node with Ctrl+C, start again with `npm run dev`, and confirm the changes remain.

## Reset only the UI testing state
If you need to return to the original imported prototype data, run in MySQL:
`DELETE FROM kumon_centre.app_state WHERE id=1;`
Then reload the page. The browser will seed a fresh state from `data.js` and save it again.

Do not use `npm run db:reset` unless you intend to reset the whole database.
