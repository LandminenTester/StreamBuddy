# Planned Features – Twitch Dashboard & Agentic Worker Roadmap

## Zweck dieses Dokuments

Dieses Dokument beschreibt geplante Funktionen für die nächste Entwicklungsphase. Es dient als Grundlage für Agentic Worker, damit diese später detaillierte technische Pläne, Architekturentscheidungen, Datenbankänderungen und Implementierungsschritte vorbereiten können.

Die Features sollen modular geplant werden und bestehende Komponenten berücksichtigen. Vor jeder Umsetzung soll der Agentic Worker:

* Bestehende Architektur analysieren
* Abhängigkeiten identifizieren
* Datenbankänderungen planen
* API-Erweiterungen definieren
* Frontend- und Backend-Anpassungen beschreiben
* Migrationen berücksichtigen
* Risiken und Alternativen dokumentieren

---

# 1. Erweiterung Chat-System zu einem vollständigen Twitch Chat Client

## Ziel

Der interne Chat soll langfristig alle wichtigen Funktionen des nativen Twitch Chats unterstützen und erweitern.

Der Nutzer soll nicht mehr zwingend den Twitch Chat öffnen müssen, sondern alle Moderations- und Interaktionsfunktionen innerhalb des Dashboards durchführen können.

---

## Geplante Funktionen

### 1.1 Benutzerinteraktionen

Benutzername im Chat soll anklickbar sein.

Mögliche Aktionen:

* Timeout vergeben
* Benutzer bannen
* Timeout aufheben
* Ban aufheben
* Benutzerinformationen anzeigen
* Moderationshistorie anzeigen

Beispiel:

```
User klickt auf:
@ExampleUser

Aktionen:
- Timeout 10 Sekunden
- Timeout 1 Minute
- Timeout 10 Minuten
- Ban
- Nachricht löschen
- Profil öffnen
```

---

## 1.2 Twitch Emotes Integration

Der Chat soll Twitch Emotes vollständig darstellen.

Unterstützte Erweiterungen:

* Native Twitch Emotes
* BetterTTV (BTTV)
* 7TV
* Optional: FrankerFaceZ

---

## Anforderungen

### Backend

* Abrufen der verfügbaren Emotes
* Speicherung der aktivierten Erweiterungen
* Caching der Emote-Daten
* Automatische Aktualisierung

Mögliche Daten:

```
emote_provider
- twitch
- bettertv
- 7tv
- ffz

enabled
true/false
```

---

### Frontend

Chat Renderer muss unterstützen:

```
Text Nachricht:

"Hallo Kappa PogChamp"

Darstellung:

Hallo [Kappa Bild] [PogChamp Bild]
```

---

## 1.3 Badges

Unterstützung von:

* Subscriber Badges
* Moderator Badge
* VIP Badge
* Founder Badge
* Broadcaster Badge
* Twitch Staff Badge
* Custom Badges

---

Datenquellen:

* Twitch Helix API
* Twitch IRC Tags

---

## 1.4 Multi-Channel Chat / Stream Together Support

Ziel:

Mehrere Twitch Chats gleichzeitig darstellen.

Use Cases:

* Stream Together Sessions
* Co-Streams
* Gemeinsame Events

---

Funktionen:

* Weitere Channels hinzufügen
* Chat Quelle auswählen
* Nachrichten mit Channel Badge markieren
* Moderation pro Channel

Beispiel:

```
[Channel A]
User123:
Hallo zusammen


[Channel B]
User456:
Grüße vom anderen Stream
```

---

Prüfung:

Vor Implementierung prüfen:

* Unterstützt Twitch bereits automatisch Multi-Channel Szenarien?
* Gibt es Einschränkungen durch IRC?
* Welche OAuth Permissions werden benötigt?

---

# 2. Dashboard Erweiterung Stream Informationen

## Ziel

Das Dashboard soll aktuelle Streaminformationen anzeigen und bearbeiten können.

---

## Anzeige

Dashboard Widget:

```
Live Status:

Titel:
"Gaming Abend mit Community"

Kategorie:
"Grand Theft Auto V"

Tags:
Deutsch
Community
Roleplay
```

---

## Änderbare Informationen

Der Nutzer soll ändern können:

### Stream Titel

* Direkt über Dashboard editierbar
* Speichern über Twitch API

---

### Kategorie / Game

Funktionen:

* Suche nach Twitch Kategorien
* Auswahl neuer Kategorie
* Aktualisierung über Twitch API

---

### Stream Tags

Unterstützung:

* Vorhandene Tags anzeigen
* Tags entfernen
* Neue Tags hinzufügen

---

Benötigte Twitch Permissions:

```
channel:manage:broadcast
```

---

# 4. Aktivitätenfeed

## Ziel

Ein zentraler Feed für alle wichtigen Twitch Ereignisse.

---

## Unterstützte Events

### Zuschauer Aktionen

* Follow
* Unfollow
* Subscribe
* Resubscribe
* Gift Sub
* Cheer
* Raid
* Host

---

## Darstellung

Beispiel:

```
15:32

⭐ Max123 folgt dir


15:35

💜 GamerGirl subscribed Tier 1


15:40

🚀 AnotherStreamer raidet mit 50 Zuschauern
```

---

## Datenquellen

Primär:

* Twitch EventSub

---

## Speicherung

Alle Events sollen dauerhaft gespeichert werden.

Beispiel:

```
events

id
type
user_id
channel_id
payload
created_at
```

---

# Priorisierte Bugfix- und Feature-Buendel

Die folgenden Einzelplaene teilen die offenen Punkte in unabhaengige Branches,
Pull Requests und Releases auf. Die Release-Version wird weiterhin automatisch
ueber `scripts/release.mjs` bestimmt.

| Reihenfolge | Plan | Status | Release-Ziel |
| --- | --- | --- | --- |
| 1 | [Loyalty Commands and Admin](01-loyalty-commands-and-admin.md) | Geplant | Patch 1 / Minor |
| 2 | [Games, Betting and Duel History](02-games-betting-and-duel-history.md) | Geplant | Minor |
| 3 | [Live Polls and Templates](03-polls-live-and-templates.md) | Geplant | Patch 1 |
| 4 | [Chat Realtime](04-chat-realtime.md) | Geplant | Patch 2 |
| 5 | [Stream Archive](05-stream-archive.md) | Geplant | Patch 3 |
| 6 | [Ad Schedule](06-ad-schedule.md) | Geplant | Patch 1 |
| 7 | [Automessages and Greetings](07-automessages-and-greetings.md) | Geplant | Minor |
| 8 | [Dashboard Activity Feed](08-dashboard-activity-feed.md) | Geplant | Minor |

## Abhaengigkeiten

- Die globale Chat-Subscription aus Bundle 04 muss vor einer dauerhaften
  Poll-Live-Anzeige aus Bundle 03 vorhanden sein.
- Die Duel-History-Tabelle aus Bundle 02 muss vor der neuen Duel-Ansicht
  eingefuehrt werden.
- Die erweiterte Archiv-API aus Bundle 05 wird vor der UI-Anzeige umgesetzt.
- Automessage-/Greeting-Session-Logik aus Bundle 07 bleibt von der globalen
  Chat-Subscription aus Bundle 04 getrennt, nutzt aber dieselbe Chat-Verbindung.
- Der Activity Feed aus Bundle 08 baut auf EventSub auf und soll Redemptions
  zusaetzlich zum bestehenden `redemption_log` als normalisierte Events speichern.
- Jeder Bundle-Branch wird separat geprueft, als PR erstellt und erst nach
  bestandenen Checks gemerged.
