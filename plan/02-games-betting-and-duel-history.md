# Bundle 02: Games, Betting and Duel History

Status: Geplant  
Release: Zwei Minor-Releases: Roulette zuerst, Duel-History danach

## Ziel

Roulette soll zwischen Runden kontrolliert pausieren. Duel soll als einzelnes
Match statt als irrefuehrende Statistik dargestellt werden.

## Bestehende Anknuepfungspunkte

- Roulette-State-Machine: `src/main/loyalty/games/rouletteScheduler.ts`
- Spielkonfiguration: `src/main/loyalty/games/gameRegistry.ts`
- Duel: `src/main/loyalty/games/duelGame.ts`
- Spielansicht: `src/renderer/src/views/games/GameDetailView.vue`
- Spielhistorie: Loyalty-Repository und `listGameHistory`

## Roulette

1. Eine eigene Konfiguration `roundCooldownSeconds` neben Wettfenster und
   Spin-Verzoegerung einfuehren.
2. Die Zustandsmaschine explizit als `closed`, `betting`, `spinning` und
   `cooldown` modellieren.
3. Nach der Aufloesung keine sofortige neue Wette oeffnen. Erst nach Ablauf
   des Cooldowns startet die naechste Runde.
4. Bei null Einsaetzen eine lokalisierte Meldung wie `Keine Wetten gesetzt`
   verwenden; keine Ausgabe `0 von 0`.
5. Konfiguration, Hinweise und Beispieltexte in Deutsch und Englisch ergaenzen.
6. Eine sichtbare Countdown-Quelle fuer den naechsten Rundenstart bereitstellen
   und im Dashboard mit dem Roulette-Status synchronisieren.
7. Nach einer erfolgreichen Roulette-Runde einen zusammengefassten Verlauf
   erzeugen: pro Nutzer eine Gewinn- oder Verlustbuchung statt separater
   Einsatz-/Gewinnzeilen.
8. Gewinner in der Ergebnisnachricht mit `@user` und ausgezahltem Betrag nennen.
9. Eine nachtraegliche Erhoehung der eigenen offenen Farb-Wette erlauben; der
   weitere Einsatz muss erneut validiert und atomar abgebucht werden.
10. Fuer Gamble einen eigenen Cooldown zwischen Einsaetzen einfuehren und
    Ablehnungen mit verbleibender Wartezeit beantworten.

## Duel

1. Die generischen Wins/Losses/Win-Rate/Net-Statistiken fuer Duel aus der
   Ansicht entfernen, da ein Duel immer Gewinner und Verlierer erzeugt.
2. Eine Migration fuer `loyalty_duel_matches` anlegen mit Challenger, Gegner,
   Gewinner, Verlierer, Einsatz und Zeitpunkt.
3. Beim Abschluss eines Duells genau einen Match-Datensatz schreiben.
4. IPC und Renderer um eine Liste dedizierter Duel-Matches erweitern.
5. Eine Zeile pro Match darstellen: `User A gegen User B`, Gewinner und Betrag.

## Datenregeln

- Das Abbuchen und Gutschreiben bleibt atomar und laeuft weiter ueber das
  Loyalty-Ledger.
- Abgebrochene oder abgelaufene Duelle werden nicht als Match gewertet.
- Bestehende Ledger-Eintraege bleiben erhalten; die Match-Tabelle ist eine
  zusaetzliche lesbare Aggregation.

## Tests und Abnahme

- Roulette startet nach dem Ergebnis erst nach dem konfigurierten Cooldown.
- Wetten waehrend Cooldown werden abgelehnt.
- Leere Runde zeigt die neue Meldung.
- Countdown entspricht dem echten Scheduler-Zustand.
- Roulette-History enthaelt pro Nutzer genau einen Ergebnis-Eintrag.
- Gewinnernachricht enthaelt Nutzername und Betrag.
- Nachtraegliches Erhoehen einer Wette respektiert Guthaben, Limits und Phase.
- Gamble-Cooldown blockiert zu fruehe Einsaetze und laeuft danach automatisch ab.
- Duel erzeugt exakt einen History-Eintrag pro abgeschlossenem Match.
- Duel-Ansicht zeigt keine allgemeinen Game-Stats, aber den Match-Verlauf.
- Migration funktioniert mit vorhandenen Loyalty-Konten und Ledger-Eintraegen.
