# Bundle 03: Live Polls and Templates

Status: Geplant  
Release: Patch 1

## Ziel

Antworten einer aktiven Twitch-Umfrage sollen live sichtbar sein. Ein Poll-
Template soll direkt eine neue Umfrage starten koennen.

## Bestehende Anknuepfungspunkte

- Poll-UI: `src/renderer/src/views/polls/PollsView.vue`
- Poll-Store: `src/renderer/src/stores/polls.store.ts`
- EventSub-Handler: `src/main/twitch/eventsub/handlers/onPollUpdate.ts`
- Twitch-Subscriptions: `src/main/twitch/eventsub/subscriptions.ts`
- Template-Store und Repository

## Umsetzung

1. EventSub-Payloads fuer Progress und End auf Pflichtfelder pruefen:
   Twitch-Poll-ID, Status und Choices mit Titel und Vote-Anzahl.
2. Ungueltige Payloads loggen und ignorieren, ohne den EventSub-Listener zu
   beenden.
3. Fortschritt in SQLite speichern und als `polls:onUpdate` an das Fenster
   senden. Der Listener wird auf Root-/App-Shell-Ebene nur einmal registriert.
4. Template-Start ueber einen plain `PollCreateInput`-Payload ausfuehren;
   reaktive Template-Arrays duerfen nicht direkt an Electron IPC gehen.
5. Startfehler im Poll-Modal anzeigen. Das Modal schliesst nur nach erfolgreichem
   Start; lokale Draft-Daten bleiben bei einem Fehler erhalten.
6. Bei null Votes die Prozentanzeige als `0%` behandeln und keine Division durch
   null ausfuehren.

## Tests und Abnahme

- Progress-Event aktualisiert aktive Polls ohne View-Wechsel.
- End-Event aktualisiert Choices und Status.
- Unvollstaendige Events werden verworfen und geloggt.
- Template-Start funktioniert mit mehreren Choices und Channel-Points-Option.
- IPC-/Twitch-Fehler bleiben sichtbar und lassen das Modal offen.
- Keine `NaN`- oder `Infinity`-Anzeigen bei null Stimmen.
