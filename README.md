# PowerLap – GPS Power Lab (v13.1 E03)

**Privater Quellstand für GitHub.** Enthält die von Astra gesicherte vollständige Web-App vom 11.10.2026 und ihre Tests. Nicht automatisch identisch mit dem Stand der bisher veröffentlichten Website.

## Starten

Die App besteht aus `index.html`, `manifest.webmanifest` und `sw.js`. Für lokale Nutzung (mit Python 3):

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` aufrufen. Für den PWA-Offlinebetrieb im Browser ist localhost oder HTTPS nötig. Der Screenshot-/OCR-Pfad kann Internet benötigen.

## Tests

```bash
node tests/test_core.cjs
```

Erwarteter Stand: **48 bestandene Kern-/Eingabeprüfungen**. Die bereits dokumentierten Tests wurden beim Export erneut ausgeführt. Es sind keine unabhängigen Prüfstands-Genauigkeitsnachweise.

Optionaler Browsertest, benötigt Node.js, npm und Chromium von Playwright:

```bash
npm install
npx playwright install chromium
npm run test:browser
```

GitHub Actions führt die Kernprüfungen bei jedem Push/Pull Request aus. Browsertests sind separat unter **Actions → PowerLap Browser Tests → Run workflow** startbar.

## Versions-/Schutzregeln

- `main` enthält die unveränderte v13.1-E03-App. Verbesserungen nur in einem gesonderten Branch vornehmen.
- Änderungen erst nach erfolgreichen Kern- und Browser-Tests sowie Review integrieren.
- Die unter `tests/baseline.html` gespeicherte v13 ist eine ältere Referenz. `tests/v13_to_v13_1.patch` protokolliert den v13.1-Patch.
- Der Leistungsrechenkern bleibt unverändert zum von Astra gespeicherten Original v13.1 E03. Eine zusätzliche Research-Oberfläche ist hier nicht integriert.
- **Repository auf PRIVATE stellen.** Ein privates GitHub-Repository verhindert das Einsehen durch Fremde, aber JavaScript einer öffentlich zugänglichen Webseite ist für Besucher auslesbar. Für späteren Schutz des Algorithmus ist ein serverseitiger Rechenkern notwendig.
- Forschungstestdaten sind nur intern gedacht. Keine privaten Facebook-Beiträge/Bilder oder Nutzerdaten öffentlich veröffentlichen.
- Es fand **kein Live-Deployment** statt. Browser-/iPhone-/OCR-/Offline-End-to-End-Tests sind bislang nicht vollständig bestätigt.

## Herkunft / Integrität

Die originale `index.html` im GitHub-Paket ist Byte für Byte identisch mit `PowerLap_v13_1_E03.zip`. SHA-256: `7acf3c59ad958cc9995b4af7af10a2492aba831b87926d1815c85c7da5f17694`.

`SHA256_MANIFEST.json` enthält Hashes des originalen Astra-Pakets, das unverändert enthalten ist. Mit `python3 tools/verify_origin.py` prüfen. Die zusätzlichen GitHub-Konfigurationsdateien ändern den App-Code nicht.
