# Bundle 06: Ad Schedule

Status: Geplant  
Release: Patch 1

## Ziel

Die Werbungsanzeige soll einen gueltigen naechsten Werbezeitpunkt anzeigen und
fehlende oder ungueltige Twitch-Daten nicht als 1. Januar 1970 darstellen.

## Bestehende Anknuepfungspunkte

- Twitch-API: `src/main/twitch/helix/adSchedule.api.ts`
- Poller: `src/main/twitch/ads/adSchedulePoller.ts`
- IPC: `src/main/ipc/automessages.ipc.ts`
- UI: `src/renderer/src/views/automessages/adMessage/AdMessageView.vue`

## Umsetzung

1. Eine zentrale Normalisierung fuer Twitch-Ad-Zeitstempel einfuehren.
   Gueltige ISO-Werte werden als ISO-Werte weitergegeben; leere, `0`,
   ungueltige oder nicht parsebare Werte werden zu `null`.
2. Poller und Renderer verwenden dieselbe normalisierte Struktur.
3. Der Poller sendet keine Vorwarnung, wenn `next_ad_at` ungueltig oder bereits
   abgelaufen ist.
4. Die UI zeigt bei `null` den vorhandenen Kein-Zeitplan-Zustand und formatiert
   niemals einen Ersatzwert als Datum.
5. Logging soll API-Fehler von einem fehlenden Zeitplan unterscheiden.

## Tests und Abnahme

- Gueltiger ISO-Zeitstempel wird korrekt lokal formatiert.
- `null`, leerer String, `0` und ungueltiger String ergeben keinen 1970-Wert.
- Abgelaufene Werbung loest keine Vorwarnung aus.
- API-Fehler lassen den UI-Zustand stabil und werden geloggt.
