# Dashboard Activity Feed

Status: Umgesetzt in Version 2.10.4.

## Ziel

Das Dashboard bekommt einen zentralen Aktivitaetenfeed fuer Twitch-Ereignisse,
damit Streamer Subscriptions, Follows, Bits, Raids und Channel-Points-Rewards
in einer chronologischen Ansicht sehen koennen.

## Umfang

- Follow
- Subscribe, Resubscribe und Gift Sub
- Bits/Cheer
- Raid
- Channel-Points-Reward-Redemption

## Backend

### EventSub

- Bestehende EventSub-Verbindung in `src/main/twitch/eventsub` erweitern.
- Neue Subscriptions ergaenzen:
  - `channel.cheer`
  - `channel.raid`
  - bei Bedarf `channel.subscription.message` fuer Resubs
- Bestehende Events wiederverwenden:
  - `channel.follow`
  - `channel.subscribe`
  - `channel.subscription.gift`
  - `channel.channel_points_custom_reward_redemption.add`

### Normalisierung

Alle Twitch-Events werden in ein gemeinsames Domainmodell umgewandelt.

Beispiel:

```ts
type ActivityFeedType =
  | 'follow'
  | 'sub'
  | 'resub'
  | 'gift_sub'
  | 'bits'
  | 'raid'
  | 'channel_points'
```

Pflichtfelder:

- `id`
- `type`
- `actorLogin`
- `actorDisplayName`
- `targetLogin`
- `summary`
- `payload`
- `occurredAt`
- `createdAt`

### Datenbank

Neue Tabelle:

```sql
activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  twitch_event_id TEXT,
  actor_login TEXT,
  actor_display_name TEXT,
  target_login TEXT,
  summary TEXT NOT NULL,
  payload TEXT,
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
)
```

Indizes:

- `idx_activity_events_occurred_at`
- `idx_activity_events_type`
- `idx_activity_events_twitch_event_id`

Deduping:

- Wenn Twitch eine Event-ID liefert, wird diese fuer idempotentes Speichern
  genutzt.
- Wenn keine Event-ID vorhanden ist, wird ein stabiler Hash aus Typ, Nutzer,
  Zeitstempel und relevanter Payload gebildet.

### IPC

Neue Channels:

- `activity:list`
- `activity:onEvent`
- `activity:clear`

Optionale Filter:

- Eventtypen
- Zeitraum
- Limit
- Suche nach Nutzer

## Frontend

### Dashboard Widget

- Feed als Dashboard-Bereich direkt sichtbar machen.
- Neueste Ereignisse oben anzeigen.
- Live-Updates ueber `activity:onEvent`.
- Eventtyp mit Icon und Farbe kennzeichnen.
- Kompakte, scanbare Zeilen statt grosser Karten.

### Detailanzeige

Ein Klick auf ein Event oeffnet eine kleine Detailansicht mit:

- Rohdaten aus `payload`
- Nutzer
- Zeitpunkt
- Event-spezifische Details

### Filter

- Alle
- Follows
- Subs
- Bits
- Raids
- Rewards

## Channel-Points-Integration

- Redemptions werden weiterhin in `redemption_log` gespeichert.
- Zusaetzlich wird ein normalisiertes `activity_events`-Event geschrieben.
- Der Activity Feed zeigt Reward-Titel, Nutzer, Eingabetext und Status.
- Aktionen wie `loyalty_exchange` bleiben im Channel-Points-Handler, der Feed ist
  nur Anzeige und Historie.

## Risiken

- Twitch-Scopes muessen je nach Eventtyp erweitert werden.
- Gift-Sub- und Resub-Events haben unterschiedliche Payloads und muessen sauber
  getrennt werden.
- Bei reconnects darf EventSub keine doppelten Feed-Eintraege erzeugen.

## Umsetzungsschritte

1. Shared Activity-Typen und IPC-Contracts anlegen.
2. DB-Migration fuer `activity_events` schreiben.
3. Repository mit `insertActivityEvent`, `listActivityEvents` und Deduping bauen.
4. EventSub-Subscriptions fuer Bits und Raids ergaenzen.
5. Bestehende Follow/Sub/Reward-Handler an Activity-Repository anbinden.
6. Renderer-Store `activity.store.ts` erstellen.
7. Dashboard-Feed mit Filtern und Live-Updates einbauen.
8. Typecheck, i18n-Check und manueller Smoke-Test.
