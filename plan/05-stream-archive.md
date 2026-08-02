# Bundle 05: Stream Archive

Status: Geplant  
Release: Patch 3

## Ziel

Das Stream-Archiv soll Eintrittszeit und die Spiele anzeigen, in deren
Zeitsegment ein Zuschauer anwesend war.

## Bestehende Anknuepfungspunkte

- Session-Tracker: `src/main/twitch/viewers/viewerSessionTracker.ts`
- Streams-Repository: `src/main/db/repositories/streams.repo.ts`
- Session-Repository: `src/main/db/repositories/viewerSessions.repo.ts`
- Archiv-UI: `src/renderer/src/views/audience/archive/ArchiveView.vue`
- Viewer-Typen und IPC-Vertraege

## Umsetzung

1. Alle Viewer- und Stream-Timestamps auf Unix-Sekunden bestaetigen und an
   einer Stelle formatieren. Millisekunden oder `0` duerfen nicht als Datum
   dargestellt werden.
2. Die Session-Abfrage um die ueberlappenden `stream_game_segments` erweitern:
   Segmentbeginn liegt vor Sessionende und Segmentende nach Sessionbeginn.
3. Die API um `games: string[]` erweitern, dedupliziert und in zeitlicher
   Reihenfolge.
4. Bei laufenden Sessions/Segmenten `NULL` mit Stream-Ende oder aktuellem
   Zeitpunkt fuer die Overlap-Berechnung behandeln.
5. Joined-/Betreten-Zeit explizit in der Tabelle anzeigen und bei fehlenden
   Werten einen neutralen Fallback statt `1970` verwenden.
6. Bei keinem Segment den Stream-Spielnamen verwenden, falls vorhanden.

## Tests und Abnahme

- Eintrittsdatum wird fuer eine normale Session korrekt angezeigt.
- Mehrere Spiele waehrend einer Session erscheinen dedupliziert.
- Session vor einem Spielsegment erscheint nicht in diesem Spiel.
- Laufende Session und laufendes Segment funktionieren ohne Endzeit.
- Historische Daten bleiben kompatibel und zeigen keine Epoch-Daten.
