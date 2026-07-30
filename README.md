# StreamingBot

Electron-Desktop-App (TypeScript, Vue 3, Tailwind CSS) zur Verwaltung eines Twitch-Bot-Accounts: Chat-Commands, Automessages, Umfragen, Kanalpunkte, ein eigenes Loyalty-Währungssystem mit Games sowie Stream-Statistiken.

## Features

- **Twitch-Verbindung**: OAuth (Device Code Grant Flow) für einen separaten Bot-Account, mit dynamischer, feature-basierter Scope-Anforderung und Reauth-Button bei fehlenden Berechtigungen
- **Chat-Commands**: Trigger/Aliase, Permission-Level (everyone/subscriber/moderator/broadcaster), Cooldowns
- **Automessages**: Zeitintervall- oder Nachrichtenanzahl-basiert, mit Rotation mehrerer Nachrichten
- **Kanalpunkte**: Custom-Reward-Verwaltung (Sync mit Twitch), automatische Aktionen bei Einlösung (Chat-Nachricht/Command), Redemption-Log
- **Umfragen**: Erstellen und live verfolgen über Twitch EventSub
- **Loyalty-System**: Eigene Kanal-Währung (Follow/Sub/Gifted-Sub/View-Time), Rangliste, erweiterbares Games-Plugin-System (`!gamble`, `!duel`)
- **Dashboard**: Viewer-Count- und Messages/Stunde-Charts, Bot-Status

## Entwicklung

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run lint
npm run test
```

## Build (Windows-Installer)

```bash
npm run package:win
```

Eigenes App-Icon: `build/icon.ico` ablegen (ansonsten nutzt electron-builder ein Standard-Icon).

## Twitch-Setup

1. Eine Twitch-Developer-App unter https://dev.twitch.tv/console/apps anlegen:
   - **Client-Typ**: `Öffentlich` (Public) -- wichtig, da die App keinen Server hat, der ein Client-Secret sicher verwahren könnte.
   - **OAuth Redirect URLs**: leer lassen -- der Device Code Grant Flow braucht keine Redirect-URI.
   - **Kategorie**: z.B. "Chat Bot" (rein informativ für Twitch, ohne funktionale Auswirkung).
2. `.env.example` nach `.env` kopieren und `MAIN_VITE_TWITCH_CLIENT_ID` mit der erzeugten Client-ID befüllen.
3. Der verwendete Twitch-Account sollte ein **separater Bot-Account** sein, der als Moderator im Zielkanal eingesetzt ist.
4. Beim Verbinden in der App (Einstellungen -> "Mit Twitch verbinden") zeigt die App einen Code an, der auf `https://www.twitch.tv/activate` eingegeben werden muss (öffnet sich automatisch im Standardbrowser).
5. Hinweis: Für die **Kanalpunkte-Verwaltung** (Custom Rewards anlegen/ändern) verlangt Twitch ein Token des Broadcaster-Accounts selbst — ein reiner Moderator-Bot-Token kann nur auf bestehende Redemptions reagieren, aber keine neuen Rewards erstellen.

**Technischer Hintergrund**: Twitch unterstützt für den klassischen Authorization-Code-Grant kein PKCE (der verlangt immer ein Client-Secret). Für Public Clients ohne Secret ist der **Device Code Grant Flow (DCF)** der von Twitch vorgesehene Weg -- kein lokaler Redirect-Server, kein eingebettetes Login-Fenster nötig.

## Abhängigkeiten (nicht im fxmanifest-Äquivalent, hier: package.json)

Laufzeit-Abhängigkeiten siehe `package.json` (`dependencies`). Kernbibliotheken: `better-sqlite3` (lokale Datenhaltung), `tmi.js` (Twitch-Chat/IRC), `chart.js`/`vue-chartjs` (Stats-Charts), `pinia`/`vue-router` (Frontend).

## CI/CD

- `.github/workflows/ci.yml`: Typecheck, Lint, Test, Build bei jedem Push/PR (windows-latest, Node 20)
- `.github/workflows/release.yml`: Bei Git-Tag `v*` -> baut den NSIS-Installer und lädt ihn als GitHub-Release-Asset hoch
- `.github/workflows/release-please.yml`: Automatisierter Versions-Bump + CHANGELOG.md aus Conventional Commits (PR-basiert, Merge erzeugt den Tag)

Code-Signing für Windows-Builds ist aktuell **nicht** aktiv (SmartScreen-Warnung beim ersten Start wird akzeptiert) -- siehe Kommentare in `electron-builder.yml` für die spätere Ergänzung.

### Neuen Release veröffentlichen

1. Auf `main` committen/mergen (Conventional-Commits-Format, z.B. `feat: ...`, `fix: ...`).
2. `release-please` öffnet automatisch einen PR mit Versions-Bump + Changelog.
3. Diesen PR mergen -> release-please erstellt den Git-Tag `vX.Y.Z`.
4. Der Tag-Push triggert `release.yml`, das den Windows-Installer baut und an die GitHub-Release anhängt.

## Projektstatus

Alle 10 Implementierungsphasen (Scaffolding, SQLite/IPC, OAuth, Chat/Commands, Automessages, Kanalpunkte, Umfragen, Loyalty-Grundgerüst, Loyalty-Games, Stats/Dashboard, CI/CD) sind abgeschlossen.
