# Bundle 04: Chat Realtime

Status: Geplant  
Release: Patch 2

## Ziel

Der Chat soll Nachrichten unabhaengig von der aktuell geoeffneten Seite
empfangen und den neuesten Stand anzeigen.

## Bestehende Anknuepfungspunkte

- Chat-Store: `src/renderer/src/stores/chat.store.ts`
- App-Lifecycle: `src/renderer/src/components/shared/AppShell.vue`
- Darstellung: `src/renderer/src/components/dashboard/ChatFeedPanel.vue`
- Main-IPC: `src/main/twitch/chat/tmiClient.ts`

## Umsetzung

1. `subscribeToMessages` in einen langlebigen App-Shell-Lifecycle verschieben.
   Dashboard darf nicht mehr der Besitzer des einzigen Message-Listeners sein.
2. Eine zentrale Subscription-Referenz verwenden, damit Router-Wechsel keine
   doppelten Listener erzeugen.
3. Das bestehende Nachrichtenlimit von 200 beibehalten und bei Disconnect nur
   den Status aktualisieren; Nachrichten werden nicht unnoetig geloescht.
4. Autoscroll anhand der Scrollposition steuern: Bei Position nahe am Ende
   automatisch folgen, bei bewusstem Hochscrollen nicht springen.
5. Fuer neue Nachrichten ausserhalb der aktuellen Position einen kleinen
   Hinweis mit Rueckkehr zum neuesten Stand vorsehen.
6. Cleanup beim Unmount der App-Shell und bei erneutem Initialisieren sicherstellen.

## Tests und Abnahme

- Nachricht wird auch auf Settings-, Loyalty- und Poll-Seiten empfangen.
- Ein Router-Wechsel erzeugt keinen zweiten Eintrag pro Nachricht.
- Chat bleibt am Ende, wenn der Nutzer nicht hochgescrollt hat.
- Manueller Hochscroll wird nicht durch neue Nachrichten unterbrochen.
- Reconnect und Disconnect fuehren nicht zu Listener-Leaks.
