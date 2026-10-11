# PowerLap v13.1 E03 – 11.10.2026

Diese App enthält die gezielten Rechenkern-Korrekturen auf Basis der gesicherten vollständigen v13. Keine Veröffentlichung wurde vorgenommen.

## Start

ZIP entpacken und `index.html` im Browser öffnen. Für den vollständigen PWA-/Offline-Betrieb müssen `index.html`, `sw.js` und `manifest.webmanifest` gemeinsam über HTTPS oder localhost bereitgestellt werden. Lokal am Rechner beispielsweise im entpackten Ordner `python3 -m http.server 8080` ausführen und http://localhost:8080 öffnen. Ein direkt geöffnetes HTML-Dokument kann keinen Service Worker installieren. Screenshot-Erkennung kann weiterhin eine Internetverbindung benötigen. Dies ist eine Web-App, keine APK oder iOS-Installationsdatei.

## Änderungen

- Peakbestätigung nur durch angrenzendes, unauffälliges Intervall im selben Gang; keine Selbstbestätigung einzelner Intervalle.
- Exakte Steigungsgeometrie statt Kleinwinkelnäherung.
- Verständlicher Abbruch bei Rückenwind außerhalb des Aerodynamikmodells.
- Nichtendliche/ungültige Intervallzeiten und Geschwindigkeiten werden im Kern zurückgewiesen.
- Ungültig eingegebener Wind wird nicht mehr stillschweigend zu Windstille. Ein leeres optionales Windfeld bleibt zulässig.
- Eigene neue Cache-Version; Bereinigung beschränkt sich auf Power-Lab-Caches.
- Verlustparameter und bestehende Bedienoberfläche bleiben erhalten. Die Astra-Forschungsoberfläche wurde nicht zusätzlich eingebaut.

## Prüfung und Grenzen

48 automatisierte Rechenkern- und Eingabeprüfungen bestanden, einschließlich der vorhandenen fünf GPS-Reihen als kontrollierte Plausibilitätsszenarien. Diese belegen keine unabhängige PS-Genauigkeit. Der Patch kalibriert keine Parameter auf einzelne Prüfstandswerte.

Der ausführbare Desktop-/Mobil-Browsertest liegt unter `tests/test_browser.cjs`. Er konnte in dieser Umgebung nicht ausgeführt werden: Playwright ist verfügbar, dessen Chromium-Browser jedoch nicht installiert. Deshalb sind mobile Darstellung, komplette UI-Abläufe und Offline-Neuladen hier nicht als bestanden ausgewiesen. Es handelt sich um eine verbesserte Testversion, nicht um eine vollständig freigeprüfte Veröffentlichung.

Tests: `node tests/test_core.cjs`. Browsertest in einer Umgebung mit Playwright und installiertem Chromium: `node tests/test_browser.cjs`.

Der Ordner `tests` enthält technische Forschungs-Fixtures für die interne Prüfung. Bei einer späteren Veröffentlichung nur die drei App-Dateien ausliefern, nicht den Testordner. Die Referenzdatei `tests/baseline.html` ermöglicht den Versionsvergleich. `tests/v13_to_v13_1.patch` dokumentiert den HTML-Patch; Resultate und Hashmanifest sind enthalten.
