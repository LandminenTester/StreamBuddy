# StreamBuddy

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
2. Die erzeugte **Client-ID** in der App unter Einstellungen -> "Twitch-Client-ID" eintragen und speichern. Die Client-ID liegt lokal in der SQLite-DB, nicht in einer `.env`-Datei -- sie kann jederzeit über die UI geändert werden, auch in der fertig gebauten App, ohne Neubau.
3. Der verwendete Twitch-Account sollte ein **separater Bot-Account** sein, der als Moderator im Zielkanal eingesetzt ist.
4. Beim Verbinden in der App (Einstellungen -> "Mit Twitch verbinden") zeigt die App einen Code an, der auf `https://www.twitch.tv/activate` eingegeben werden muss (öffnet sich automatisch im Standardbrowser).
5. Hinweis: Für die **Kanalpunkte-Verwaltung** (Custom Rewards anlegen/ändern) verlangt Twitch ein Token des Broadcaster-Accounts selbst — ein reiner Moderator-Bot-Token kann nur auf bestehende Redemptions reagieren, aber keine neuen Rewards erstellen.

**Technischer Hintergrund**: Twitch unterstützt für den klassischen Authorization-Code-Grant kein PKCE (der verlangt immer ein Client-Secret). Für Public Clients ohne Secret ist der **Device Code Grant Flow (DCF)** der von Twitch vorgesehene Weg -- kein lokaler Redirect-Server, kein eingebettetes Login-Fenster nötig.

## Abhängigkeiten (nicht im fxmanifest-Äquivalent, hier: package.json)

Laufzeit-Abhängigkeiten siehe `package.json` (`dependencies`). Kernbibliotheken: `better-sqlite3` (lokale Datenhaltung), `tmi.js` (Twitch-Chat/IRC), `chart.js`/`vue-chartjs` (Stats-Charts), `pinia`/`vue-router` (Frontend).

## CI/CD

Ein einziger Workflow, `.github/workflows/ci.yml` (windows-latest, Node 20): Typecheck, Lint,
i18n-Key-Pruefung, Test und Build bei jedem Push/PR. Bei einem Push auf `main` haengen im selben
Lauf die Release-Schritte an -- `scripts/release.mjs` berechnet Version und Changelog aus den
Conventional-Commits seit dem letzten Tag, committet und taggt sie, veroeffentlicht das
GitHub-Release und haengt den bereits gebauten Windows-Installer an.

Code-Signing fuer Windows-Builds ist aktuell **nicht** aktiv (SmartScreen-Warnung beim ersten Start
wird akzeptiert) -- siehe Kommentare in `electron-builder.yml` fuer die spaetere Ergaenzung.

### Versionierung

Die Version wird pro Push auf `main` **nur in der Patch-Stelle** angehoben (`1.9.0` -> `1.9.1` ->
`1.9.2`), unabhaengig davon ob es sich um `feat`- oder `fix`-Commits handelt.

Ein Minor- oder Major-Sprung wird bewusst angefordert, indem ein Commit im Release-Bereich einen
Footer traegt:

```
feat(games): neue Spielart ergaenzt

Release-As: minor
```

Erlaubt sind `Release-As: patch|minor|major`. `feat!:` bzw. ein `BREAKING CHANGE:`-Footer loesen
weiterhin automatisch einen Major-Sprung aus. Damit buendelt eine Minor-Version mehrere
Patch-Releases, statt bei jedem einzelnen Feature-Commit hochzuspringen.

### Neuen Release veroeffentlichen

1. Auf `main` committen/mergen (Conventional-Commits-Format, z.B. `feat: ...`, `fix: ...`).
2. Der CI-Lauf berechnet die naechste Version, schreibt `package.json` und `CHANGELOG.md`,
   setzt den Tag `vX.Y.Z` und veroeffentlicht das Release samt Installer.

Lokal pruefen, was der naechste Lauf tun wuerde:

```bash
node scripts/release.mjs --dry-run
```

## Projektstatus

Alle 10 Implementierungsphasen (Scaffolding, SQLite/IPC, OAuth, Chat/Commands, Automessages, Kanalpunkte, Umfragen, Loyalty-Grundgerüst, Loyalty-Games, Stats/Dashboard, CI/CD) sind abgeschlossen.
