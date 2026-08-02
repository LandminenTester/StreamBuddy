# Bundle 01: Loyalty Commands and Admin

Status: Geplant  
Release: Patch 1 fuer Earn Rules, danach Minor fuer neue Chat-Befehle

## Ziel

Punkte sollen im Chat und in der Rangliste verwaltbar sein. Earn Rules muessen
zuverlaessig gespeichert werden, und Zuschauer sollen ihren Kontostand sowie
ihren Rang abfragen koennen.

## Bestehende Anknuepfungspunkte

- Earn Rules: `src/renderer/src/views/loyalty/earnRules/` und
  `src/renderer/src/stores/loyalty.store.ts`
- Punkte-Ledger: `src/main/loyalty/loyaltyLedger.ts`
- Rangliste: `src/renderer/src/views/loyalty/leaderboard/`
- Chat-Befehle: `src/main/twitch/chat/commandRouter.ts` und Loyalty-Games

## Umsetzung

1. Earn-Rule-Payload vor jedem IPC-Aufruf als plain Objekt materialisieren,
   Zahlen normalisieren und Wertebereiche validieren.
2. Speichern im Modal mit Loading-State, sichtbarer Fehlermeldung und offenem
   Modal bei Fehlern ausstatten.
3. Einen allgemeinen Loyalty-Command-Handler fuer `!points` und `!rank`
   einfuehren. Trigger muessen wie Game-Trigger konfigurierbar bleiben.
4. `!rank` soll Top 10 mit Rang und Punktestand ausgeben und den Rang des
   anfragenden Users ergaenzen, auch wenn dieser ausserhalb der Top 10 liegt.
5. Einen Admin-Command fuer positive und negative Punktanpassungen einfuehren.
   Standardmaessig nur Broadcaster/Moderator, Zielname und Betrag sind Pflicht.
6. Die Rangliste um eine Namenssuche bzw. manuelle Punkteaktion erweitern.
   Fehlende Konten werden ueber `getOrCreateAccount` angelegt.
7. Antworten, Berechtigungsfehler, unbekannte Nutzer und ungueltige Betraege in
   Deutsch und Englisch lokalisieren.

## Datenfluss und Vertraege

- Rangberechnung bleibt im Repository und liefert stabile 1-basierte Ränge.
- Manuelle Aenderungen laufen weiterhin ueber `setAccountBalance` bzw. das
  Ledger, damit jede Aenderung als `manual_adjust` historisiert wird.
- Neue IPC-Requests verwenden nur primitive Werte und plain Arrays/Objekte.

## Tests und Abnahme

- Earn Rule: Speichern, Validierung, IPC-Fehler und Proxy-freie Payload.
- Rang: Top-10-Grenze, eigener Rang ausserhalb Top 10, leere Rangliste.
- Punkteaktion: positiver Betrag, Entzug, fehlendes Konto, unzureichende Rechte.
- UI: Fehler bleibt sichtbar, erfolgreicher Save aktualisiert die Tabelle.

## Release-Grenze

Dieser Plan enthaelt keine Game-History und keine Roulette-Aenderungen. Diese
gehen in Bundle 02.
