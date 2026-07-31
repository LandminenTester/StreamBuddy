# Changelog

## [1.7.0](https://github.com/LandminenTester/StreamingBot/compare/v1.6.1...v1.7.0) (2026-07-31)


### Features

* **app:** Light/Dark-Theme-Switch im Footer, persistiert in SQLite ([#21](https://github.com/LandminenTester/StreamingBot/issues/21)) ([248cb7c](https://github.com/LandminenTester/StreamingBot/commit/248cb7c615a8d4d0e11c64503d92e2195acefc93))

## [1.6.1](https://github.com/LandminenTester/StreamingBot/compare/v1.6.0...v1.6.1) (2026-07-31)


### Bug Fixes

* **app:** About/Update-Modal verbreitern, Custom-Scrollbar, Changelog-Links vollstaendig entfernen ([#19](https://github.com/LandminenTester/StreamingBot/issues/19)) ([ecda7f6](https://github.com/LandminenTester/StreamingBot/commit/ecda7f6c56ff9a32984c6d42090a721f5ce56b12))

## [1.6.0](https://github.com/LandminenTester/StreamingBot/compare/v1.5.1...v1.6.0) (2026-07-31)


### Features

* **app:** Footer mit Über-StreamerBot-Modal, Fenstertitel, automatisches Update-Modal ([#17](https://github.com/LandminenTester/StreamingBot/issues/17)) ([d328a2b](https://github.com/LandminenTester/StreamingBot/commit/d328a2b4e7d02188fbdff3e161872f935c888065))

## [1.5.1](https://github.com/LandminenTester/StreamingBot/compare/v1.5.0...v1.5.1) (2026-07-31)


### Bug Fixes

* **update:** Update-Checker-Absturz beheben + Lizenz & App-Metadaten ([#15](https://github.com/LandminenTester/StreamingBot/issues/15)) ([d5aaab3](https://github.com/LandminenTester/StreamingBot/commit/d5aaab3ddb4fd63f21f6184f44bc22bb971b5a3d))

## [1.5.0](https://github.com/LandminenTester/StreamingBot/compare/v1.4.0...v1.5.0) (2026-07-31)


### Features

* **settings:** Update-Checker-UI und Changelog-Anzeige ([8b1afa6](https://github.com/LandminenTester/StreamingBot/commit/8b1afa6a634237bf78528bfe5a663e185ff5a34b))
* **update:** Auto-Update-Backend (electron-updater) + Changelog-Parser ([ef34f80](https://github.com/LandminenTester/StreamingBot/commit/ef34f80aed55897cffd7d548b35aadacc6722a3f))

## [1.4.0](https://github.com/LandminenTester/StreamingBot/compare/v1.3.1...v1.4.0) (2026-07-31)


### Features

* **loyalty-ui:** horizontales Tab-System mit Game-Sub-Tabs, Trigger-/Text-Editor und Log ([9502859](https://github.com/LandminenTester/StreamingBot/commit/9502859194b12917a9029039121ff7561d595ace))
* **loyalty:** konfigurierbare Game-Commands, Roulette-Rundendramaturgie, Games-Log ([ca0d0b9](https://github.com/LandminenTester/StreamingBot/commit/ca0d0b9631f54b172be0db336d16fecb39c229b3))
* **loyalty:** Punkte-Verdienen und Games nur waehrend der Stream live ist ([c3a2d80](https://github.com/LandminenTester/StreamingBot/commit/c3a2d80e0177e55c29758b4e6d94f6dad87fd579))

## [1.3.1](https://github.com/LandminenTester/StreamingBot/compare/v1.3.0...v1.3.1) (2026-07-30)


### Bug Fixes

* **ci:** exe-Upload reparieren, Pipeline auf einen Workflow konsolidieren ([c6668ca](https://github.com/LandminenTester/StreamingBot/commit/c6668ca2b0b3f23a9b69da46470ab3e8013c804c))
* **ci:** exe-Upload und Pipeline zu einem einzigen Workflow konsolidieren ([9ea6d29](https://github.com/LandminenTester/StreamingBot/commit/9ea6d29c362dcb0e50db46f7d46c079831cf813e))

## [1.3.0](https://github.com/LandminenTester/StreamingBot/compare/v1.2.0...v1.3.0) (2026-07-30)


### Features

* **auth:** move Twitch Client-ID from .env to runtime-configurable DB setting ([bcb7ffa](https://github.com/LandminenTester/StreamingBot/commit/bcb7ffa6c6701afb4048d381e4fe7655072dd570))
* **commands:** Zustellart (oeffentlich/Erwaehnung/Whisper) pro Command ([a23fdcf](https://github.com/LandminenTester/StreamingBot/commit/a23fdcf3aca24a0aab0d9f495c6daebb59c6ff7e))
* initial commit - Twitch Streaming Bot Desktop App ([5bc1c43](https://github.com/LandminenTester/StreamingBot/commit/5bc1c43f98d05226b2d35d654b0210ffff45d614))
* **loyalty:** geteiltes Bet-Parsing (kein Limit, all/xx%) + neues Roulette-Game ([2fe2626](https://github.com/LandminenTester/StreamingBot/commit/2fe2626f9b9d4a6bc90debf2e4aaf0115f151551))
* **loyalty:** manuelle Punktevergabe/-entzug, CSV-Import/-Export, Konto bearbeiten ([debceff](https://github.com/LandminenTester/StreamingBot/commit/debceffa9b413a0d5ed75bd17729ea65a342f42b))
* **loyalty:** Suche in Rangliste, Blacklist und editierbarer Game-Anzeigename ([fc45f46](https://github.com/LandminenTester/StreamingBot/commit/fc45f4648657eb187ef354c97e4b9ca5cf167992))
* **polls-ui:** Gewinnerauswahl beim Beenden + Template-Liste mit Ein-Klick-Senden ([19914a7](https://github.com/LandminenTester/StreamingBot/commit/19914a779d5aa3ab255e2514a212a61084f32e2b))
* **polls:** Umfrage-Templates (Repository, IPC, Store) ([2038982](https://github.com/LandminenTester/StreamingBot/commit/2038982ec5244f298416b1fe48adb7b8db05542c))
* **settings,dashboard:** Auto-Connect-Einstellung, Chat-Feed im Dashboard, Checkbox-Fix ([d20456d](https://github.com/LandminenTester/StreamingBot/commit/d20456d0ecdfbc70704995ae78f390ef8c04a8c7))


### Bug Fixes

* **auth:** switch Twitch OAuth from PKCE to Device Code Grant Flow ([6d26912](https://github.com/LandminenTester/StreamingBot/commit/6d269128cad56908bd95e50f6fbfd8a809b0864f))
* **auth:** switch Twitch OAuth from PKCE to Device Code Grant Flow ([54c9bdc](https://github.com/LandminenTester/StreamingBot/commit/54c9bdc32f7459004a134f7ee280f2c1d74bc8a4))
* **channel-points:** Twitch-Sync-Fehler nicht mehr verschlucken, Redemption-Handler robust ([d848c4e](https://github.com/LandminenTester/StreamingBot/commit/d848c4eb1a04cee53b1e936c07d6bc82bc2e9d21))
* **polls:** Beenden aktualisiert lokalen Status sofort + manuelle Gewinnerauswahl ([bc444c1](https://github.com/LandminenTester/StreamingBot/commit/bc444c1420e1de106fd13f0e48ea7859b17b5ccc))
* **polls:** Zuruecksetzen-Button fuer haengende Umfragen ([ddf58c9](https://github.com/LandminenTester/StreamingBot/commit/ddf58c969ee7acb6d8179bd9e6510888492c8668))

## [1.2.0](https://github.com/LandminenTester/StreamingBot/compare/v1.1.0...v1.2.0) (2026-07-30)


### Features

* **commands:** Zustellart (oeffentlich/Erwaehnung/Whisper) pro Command ([a23fdcf](https://github.com/LandminenTester/StreamingBot/commit/a23fdcf3aca24a0aab0d9f495c6daebb59c6ff7e))
* **loyalty:** geteiltes Bet-Parsing (kein Limit, all/xx%) + neues Roulette-Game ([2fe2626](https://github.com/LandminenTester/StreamingBot/commit/2fe2626f9b9d4a6bc90debf2e4aaf0115f151551))
* **loyalty:** Suche in Rangliste, Blacklist und editierbarer Game-Anzeigename ([fc45f46](https://github.com/LandminenTester/StreamingBot/commit/fc45f4648657eb187ef354c97e4b9ca5cf167992))
* **settings,dashboard:** Auto-Connect-Einstellung, Chat-Feed im Dashboard, Checkbox-Fix ([d20456d](https://github.com/LandminenTester/StreamingBot/commit/d20456d0ecdfbc70704995ae78f390ef8c04a8c7))


### Bug Fixes

* **polls:** Zuruecksetzen-Button fuer haengende Umfragen ([ddf58c9](https://github.com/LandminenTester/StreamingBot/commit/ddf58c969ee7acb6d8179bd9e6510888492c8668))

## [1.1.0](https://github.com/LandminenTester/StreamingBot/compare/v1.0.0...v1.1.0) (2026-07-30)


### Features

* **loyalty:** manuelle Punktevergabe/-entzug, CSV-Import/-Export, Konto bearbeiten ([debceff](https://github.com/LandminenTester/StreamingBot/commit/debceffa9b413a0d5ed75bd17729ea65a342f42b))
* **polls-ui:** Gewinnerauswahl beim Beenden + Template-Liste mit Ein-Klick-Senden ([19914a7](https://github.com/LandminenTester/StreamingBot/commit/19914a779d5aa3ab255e2514a212a61084f32e2b))
* **polls:** Umfrage-Templates (Repository, IPC, Store) ([2038982](https://github.com/LandminenTester/StreamingBot/commit/2038982ec5244f298416b1fe48adb7b8db05542c))


### Bug Fixes

* **channel-points:** Twitch-Sync-Fehler nicht mehr verschlucken, Redemption-Handler robust ([d848c4e](https://github.com/LandminenTester/StreamingBot/commit/d848c4eb1a04cee53b1e936c07d6bc82bc2e9d21))
* **polls:** Beenden aktualisiert lokalen Status sofort + manuelle Gewinnerauswahl ([bc444c1](https://github.com/LandminenTester/StreamingBot/commit/bc444c1420e1de106fd13f0e48ea7859b17b5ccc))

## 1.0.0 (2026-07-30)


### Features

* initial commit - Twitch Streaming Bot Desktop App ([5bc1c43](https://github.com/LandminenTester/StreamingBot/commit/5bc1c43f98d05226b2d35d654b0210ffff45d614))


### Bug Fixes

* **auth:** switch Twitch OAuth from PKCE to Device Code Grant Flow ([6d26912](https://github.com/LandminenTester/StreamingBot/commit/6d269128cad56908bd95e50f6fbfd8a809b0864f))
* **auth:** switch Twitch OAuth from PKCE to Device Code Grant Flow ([54c9bdc](https://github.com/LandminenTester/StreamingBot/commit/54c9bdc32f7459004a134f7ee280f2c1d74bc8a4))
