# StreamingBot — Projektregeln

Electron-Desktop-App (Vue 3 + TypeScript + Tailwind + Pinia + vue-router) zur Verwaltung eines
Twitch-Bot-Accounts. Diese Datei ergänzt die globalen Regeln um das, was für dieses Repo gilt.

## Versionierung

**Die Version wird pro Push auf `main` nur in der Patch-Stelle angehoben** — `1.9.0` → `1.9.1` →
`1.9.2` —, unabhängig davon ob `feat` oder `fix`. Das ist bewusst so: vorher sprang die
Minor-Stelle bei jedem einzelnen Feature-Commit (`1.0.0 → 1.1.0 → 1.3.0 → 1.9.0` in kurzer Zeit),
ohne dass diese Sprünge inhaltlich etwas bedeutet hätten.

Ein Minor- oder Major-Sprung wird **explizit angefordert** über einen Commit-Footer:

```
feat(games): neue Spielart ergaenzt

Release-As: minor
```

Erlaubt: `Release-As: patch|minor|major`. `feat!:` und `BREAKING CHANGE:` lösen weiterhin
automatisch Major aus. Eine Minor-Version bündelt damit mehrere Patch-Releases zu einem
größeren Verbesserungsschritt.

Die Version selbst wird **nie von Hand** in `package.json` geändert — das macht
`scripts/release.mjs` im CI-Lauf. Zum Prüfen: `node scripts/release.mjs --dry-run`.

## Design

- **Kein Container-Look.** Abschnitte werden durch Weißraum, Typografie-Hierarchie und einzelne
  Haarlinien getrennt, nicht durch gerahmte Kästen. Rahmen bleiben Elementen vorbehalten, die
  wirklich abgehoben sind: Modal-Panel, Chat-Feed, Tabellen-Container.
- **Anzeigen statt bearbeiten.** Unterseiten zeigen Werte als nicht editierbaren Text
  (`DefinitionList`); ein „Bearbeiten"-Button öffnet ein Modal mit genau den Feldern dieses Blocks.
  Kein Inline-Autosave. Ausnahmen: Suchfelder, Filter, Theme-/Akzent-Umschalter, Massenaktionen.
- **Farben nur über Tokens.** Keine `slate-`/`neutral-`-Literale in neuem Code — die semantischen
  Klassen `bg-surface`, `text-fg`, `text-fg-muted`, `border-line`, `bg-accent`, `text-success` usw.
  kommen aus `src/renderer/src/assets/styles/tokens.css` und `tailwind.config.ts`.
  `twitch.purple` bleibt für die Twitch-Markenfarbe reserviert (z.B. Default-Rewardfarbe).
- **Komponenten wiederverwenden.** `src/renderer/src/components/ui/` enthält Button, Inputs, Toggle,
  Badge, PageHeader, PageSection, DefinitionList, DataTable, StatRow, EmptyState, BaseModal,
  AppTabs. Kein kopiertes Markup mit wiederholten Klassenketten.
- Icons kommen aus `lucide-vue-next`, direkt importiert, ohne Wrapper.

## Sprachsystem

- Jeder sichtbare Text läuft über `vue-i18n`. `src/renderer/src/i18n/locales/de.json` ist Master
  **und** Fallback; `en.json` muss deckungsgleich sein.
- `npm run i18n:check` meldet im Code benutzte, aber undefinierte Keys als **Fehler** und
  fehlende/verwaiste Keys je Sprache als Warnung. Läuft in der CI.
- `node scripts/i18n-check.mjs --write-template` erzeugt eine leere Key-Datei für neue Sprachen.
- **Bot-Chat-Texte sind kein UI-Text.** Sie gehören zur Kanalsprache und liegen in
  `src/main/loyalty/botTexts.ts`. Geschrieben werden sie **ausschließlich** beim Abschluss des
  Setup-Wizards in der dort gewählten Sprache; ein späterer Sprachwechsel in den Einstellungen
  lässt sie unangetastet. Nur der Button „Bot-Texte zurücksetzen" überschreibt sie bewusst.

## Datenhaltung

Lokales SQLite über `better-sqlite3`, Schema per nummerierten Migrationen in
`src/main/db/migrations/`. Einfache Schlüssel/Wert-Einstellungen kommen ohne neue Migration aus —
dafür gibt es die generische `app_settings`-Tabelle und `appSettings.repo.ts`
(`theme`, `accent_color`, `ui_locale`, `setup_completed`, `setup_version`, `target_channel`, …).

Jeder Zugriff zwischen Renderer und Main läuft über die typisierten IPC-Kanäle in
`src/shared/ipc/channels.ts` + `contracts.ts`.

## Vor dem Abschluss prüfen

```bash
npm run typecheck && npm run lint && npm run i18n:check && npm run test && npm run build
```

Der Lint meldet aktuell mehrere tausend CRLF-Warnungen aus dem Bestand — entscheidend ist
**0 errors**. Live-Test der gebauten App liegt beim Anwender.
