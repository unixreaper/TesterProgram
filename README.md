# Tester Desk (Tauri + Rust + SQLite + React)

Functional desktop QA app with local SQLite database.

## Stack

- Tauri 2 + Rust commands
- SQLite3 (`rusqlite`, bundled)
- React + Vite frontend
- shadcn-style UI components
- i18n (English / Thai)

## Features

- Create and manage test plans
- Create and manage test cases (type, priority, steps, expected result)
- Link / unlink test case to selected test plan
- Plan checklist items with done/undone toggles
- Test result logging (pass/fail/blocked/retest + environment + notes)
- Sidebar/panel show/hide controls
- Single compact top bar (no duplicate header bars)

## Database

- Auto-created at runtime in app data directory as `tester_desk.sqlite3`
- Current DB path is shown in app footer

## Run

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run build
npm run tauri build
```
