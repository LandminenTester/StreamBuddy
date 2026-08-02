# Bundle 07: Automessages and Greetings

Status: Geplant  
Release: Minor

## Ziel

Automessages sollen konfigurierte Commands sicher einsetzen koennen. Neue und
personalisierte Begruessungen sollen zeitnah auf aktuelle Zuschauer reagieren.

## Bestehende Anknuepfungspunkte

- Automessages: `src/renderer/src/views/automessages/` und
  `src/main/twitch/chat/automessageScheduler.ts`
- Command-Aufloesung: `src/main/twitch/chat/commandRouter.ts`
- Begruessungen: `src/main/loyalty/greetings/` und die Greetings-Ansicht
- Presence: `src/main/twitch/chat/presenceTracker.ts`

## Automessages

1. In Message-Texten konfigurierte Commands ueber eine klar definierte Syntax
   aufloesen und deren aktuelle Antwort einsetzen.
2. Unbekannte oder deaktivierte Commands unveraendert bzw. mit einem sichtbaren
   Validierungsfehler behandeln; keine stillen falschen Ersetzungen.
3. Rekursive Ersetzungen und unbounded Message-Laengen verhindern.
4. Preview und Validierung in der Automessage-UI ergaenzen.

## Greetings

1. Neue Zuschauer in einem Intervall von 15 bis 30 Sekunden pruefen, ohne
   bereits begruesste Nutzer erneut zu begruessen.
2. Presence-Aenderungen und periodischen Fallback so zusammenfuehren, dass
   keine doppelten Chat-Nachrichten entstehen.
3. Personalisierte Mehrfachtexte zufaellig oder rotierend auswaehlen und
   Platzhalter wie Username sicher ersetzen.
4. Fehler beim Senden protokollieren und den Nutzer fuer spaetere Versuche
   nicht dauerhaft als erfolgreich begruesst markieren.
5. Intervall, aktive Begruessungen und zuletzt begruesste Nutzer nach
   Disconnect, Reconnect und Streamwechsel korrekt zuruecksetzen.

## Tests und Abnahme

- Command-Platzhalter werden in Automessages korrekt ersetzt.
- Unbekannte Commands erzeugen keine falsche Nachricht.
- Greeting-Check laeuft im konfigurierten 15-30-Sekunden-Intervall.
- Jeder Zuschauer wird pro Stream nur einmal begruesst.
- Mehrere personalisierte Texte werden verwendet und Username-Platzhalter
  korrekt ersetzt.
- Reconnect erzeugt weder doppelte Begruessungen noch veraltete Session-Daten.
