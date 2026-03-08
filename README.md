# Audiobook Metadata Plugin für Obsidian

Ein Obsidian Community Plugin zum Abrufen und Verwalten von Audiobook-Metadaten mit Unterstützung für mehrere Anbieter.

## ⚠️ Disclaimer

**WICHTIG:** Dieses Plugin wurde unter Verwendung von KI (GitHub Copilot) erstellt. Bitte beachten Sie:

- **Erstellen Sie vor der Verwendung ein vollständiges Backup Ihres Vaults**
- **Nutzung auf eigene Gefahr**
- Das Plugin befindet sich in aktiver Entwicklung und kann Fehler enthalten
- Testen Sie das Plugin zunächst in einem Test-Vault, bevor Sie es produktiv einsetzen

## Features

### 📚 Multi-Provider Unterstützung
- **Audible** (vollständig implementiert - DE, UK, US)
- **Google Books API** (vollständig implementiert)
- **Open Library** (Placeholder, in Entwicklung)
- **iTunes/Apple Books** (Placeholder, in Entwicklung)

### 🎯 Flexible Dateneingabe
- **URL-Import**: Direkt von Provider-URLs
- **Suche**: Suchen Sie nach Titel, Autor oder Stichwort
- **ID-Import**: Über ASIN, ISBN oder Provider-spezifische IDs
- **Manuelle Eingabe**: Offline-Modus für manuelle Dateneingabe

### 🎨 Markdown-Integration
- **YAML Frontmatter**: Strukturierte Metadaten in Frontmatter
- **Audiobook-Karten**: Visuelle Darstellung mit Cover, Rating, Genres
- **Custom Code Blocks**: Verwenden Sie `audiobook` Code-Blöcke für visuelle Karten

### ⚡ Performance-Features
- **Rate Limiting**: Konfigurierbar (1-20 Anfragen/Minute, Standard: 5)
- **Intelligenter Cache**: TTL-basiert mit automatischem Cleanup (1-168h, Standard: 24h)
- **Persistenter Storage**: Cache überlebt Obsidian-Neustarts

### 🖼️ Cover-Management
- **Lokale Speicherung**: Cover als Dateien im Vault (Standard)
- **URL-Modus**: Verwenden Sie externe URLs ohne Download
- **Automatische Organisation**: Covers in `_covers/` Unterordner

### 🛠️ Konfigurierbar
- **Output-Ordner**: Wählbarer Zielordner (Standard: "Audiobooks")
- **Offline-Modus**: Arbeiten Sie ohne API-Zugriff
- **Provider-Auswahl**: Wechseln Sie zwischen verschiedenen Datenquellen
- **Audible-Region**: Wählen Sie zwischen DE, UK, US

## Installation

### Manuell
1. Laden Sie `main.js`, `manifest.json` und `styles.css` aus dem neuesten Release herunter
2. Erstellen Sie einen Ordner: `<Vault>/.obsidian/plugins/audiobook-metadata/`
3. Kopieren Sie die drei Dateien in diesen Ordner
4. Starten Sie Obsidian neu oder laden Sie die Plugins neu
5. Aktivieren Sie das Plugin in **Einstellungen → Community Plugins**

### Aus dem Community Store (geplant)
1. Öffnen Sie **Einstellungen → Community Plugins → Durchsuchen**
2. Suchen Sie nach "Audiobook Metadata"
3. Klicken Sie auf **Installieren** und dann auf **Aktivieren**

## Verwendung

### Commands

Alle Commands sind über die Command Palette verfügbar (Strg/Cmd + P):

| Command | Beschreibung | Shortcut |
|---------|--------------|----------|
| **Add audiobook from URL** | Metadaten von einer Provider-URL abrufen | - |
| **Search and add audiobook** | Nach Audiobüchern suchen und hinzufügen | - |
| **Add audiobook from ID (ASIN/ISBN)** | Direkt über ID importieren | - |
| **Refresh audiobook metadata** | Metadaten für aktuelle Datei aktualisieren | - |
| **Clear audiobook metadata cache** | Cache manuell leeren | - |

### Audiobook-Karten in Markdown

Fügen Sie eine visuelle Audiobuch-Karte ein, indem Sie einen `audiobook` Code-Block erstellen:

````markdown
```audiobook
title: "Der Name des Windes"
author: "Patrick Rothfuss"
narrator: "Rufus Beck"
duration: "27h 52m"
publisher: "Knaur Hörverlag"
genre: "Fantasy, Epos"
rating: 4.5
cover: "Audiobooks/_covers/Patrick_Rothfuss_-_Der_Name_des_Windes.jpg"
series: "Die Königsmörder-Chronik - Buch 1"
```
````

**Die Karte rendert automatisch mit:**
- 📷 Cover-Bild (falls vorhanden)
- 📖 Titel und Autor
- 🎙️ Sprecher/Narrator
- ⏱️ Dauer
- 📚 Verlag
- ⭐ Sterne-Rating mit numerischem Wert
- 🏷️ Genre-Tags (Pill-Style)
- 📕 Serien-Information (falls zutreffend)

### Beispiel: Vollständiges Audiobook

Nach Import über Command "Add audiobook from URL" erstellt das Plugin automatisch eine Datei wie:

```markdown
---
title: "Der Name des Windes"
subtitle: "Die Königsmörder-Chronik - Erster Tag"
author: "Patrick Rothfuss"
narrator: "Rufus Beck"
publisher: "Knaur Hörverlag"
published: "2021-03-15"
language: "de"
duration: "27h 52m"
genre:
  - "Fantasy"
  - "Epos"
series: "Die Königsmörder-Chronik"
series_position: "1"
rating: 4.5
rating_count: 12543
cover: "Audiobooks/_covers/Patrick_Rothfuss_-_Der_Name_des_Windes.jpg"
isbn: "9783426522783"
asin: "B08XYZ123"
provider: "googlebooks"
source_url: "https://books.google.com/books?id=..."
retrieved_at: "2024-03-08T11:30:45.123Z"
---

# Der Name des Windes
*Die Königsmörder-Chronik - Erster Tag*

```audiobook
title: "Der Name des Windes"
author: "Patrick Rothfuss"
narrator: "Rufus Beck"
duration: "27h 52m"
publisher: "Knaur Hörverlag"
genre: "Fantasy, Epos"
rating: 4.5
cover: "Audiobooks/_covers/Patrick_Rothfuss_-_Der_Name_des_Windes.jpg"
series: "Die Königsmörder-Chronik - Buch 1"
```

## Description

[API-Beschreibung wird hier eingefügt]

## Notes

<!-- Add your notes here -->
```

### Workflow-Beispiele

#### 1. Import von Google Books URL
```
1. Kopieren Sie die URL: https://books.google.com/books?id=abc123
2. Öffnen Sie Command Palette (Cmd/Ctrl + P)
3. Wählen Sie "Add audiobook from URL"
4. Tab "URL" ist bereits aktiv
5. Fügen Sie die URL ein → "Fetch Metadata"
6. Datei wird automatisch erstellt und geöffnet
```

#### 2. Suche nach Titel
```
1. Command Palette → "Search and add audiobook"
2. Wechseln Sie zum Tab "Search"
3. Geben Sie ein: "Harry Potter"
4. Klicken Sie "Search"
5. Wählen Sie aus den Suchergebnissen
6. Datei wird erstellt
```

#### 3. Offline/Manuelle Eingabe
```
1. Aktivieren Sie "Offline Mode" in Settings
2. Command Palette → "Add audiobook from URL"
3. Tab "Manual" wird automatisch gewählt
4. Füllen Sie Felder aus (Titel erforderlich)
5. Klicken Sie "Create"
```

## Einstellungen

### General Settings

**Default Output Folder**
- Standard: `Audiobooks`
- Zielordner für neue Audiobook-Dateien

### API Provider

**API Provider**
- **Audible** (Standard): Audiobook-spezifisch mit vollständigen Metadaten (Sprecher, Serien, etc.)
- **Google Books**: Sofort einsatzbereit, umfangreiche Bibliothek (aber weniger Audiobook-Daten)
- **Open Library**: Freie Bibliothek, in Entwicklung  
- **iTunes/Apple Books**: Apple Ökosystem, in Entwicklung

**Audible Country** (nur sichtbar wenn Audible gewählt)
- DE: Deutschland
- UK: Vereinigtes Königreich
- US: Vereinigte Staaten

**Offline Mode**
- Deaktiviert (Standard): Alle Online-Features verfügbar
- Aktiviert: Nur manuelle Eingabe, keine API-Calls

### Performance Settings

**Rate Limiting**
- **Enabled**: Schützt vor zu vielen API-Anfragen (empfohlen)
- **Requests per Minute**: 1-20 (Standard: 5)
  - Niedrigere Werte = konservativer
  - Höhere Werte = schneller, aber riskanter
  - Pro Provider: Separate Rate Limiter für jeden Anbieter

**Caching**
- **Enabled**: Reduziert API-Aufrufe deutlich (empfohlen)
- **Cache Duration (hours)**: 1-168 (Standard: 24)
  - Wie lange Metadaten im Cache bleiben
  - Automatisches Cleanup alle 24h
  - Manuelles Löschen via Command möglich

### Cover Settings

**Cover Storage**
- **Local** (Standard): Downloads nach `<Output-Ordner>/_covers/`
  - Funktioniert offline
  - Keine externen Dependencies
  - Verbraucht Vault-Speicher
- **URL**: Verwendet externe Links
  - Kein Download
  - Benötigt Internet-Verbindung zum Anzeigen
  - Spart Speicherplatz

## Technische Details

### Projektstruktur

```
obsidian-book-metadata/
├── src/
│   ├── main.ts                           # Plugin Entry Point
│   ├── settings.ts                       # Settings UI & Typen
│   ├── models/
│   │   └── AudiobookMetadata.ts         # Zentrale Datenmodelle
│   ├── services/
│   │   ├── IMetadataProvider.ts         # Provider-Interface
│   │   ├── MetadataProviderFactory.ts   # Provider-Verwaltung
│   │   ├── GoogleBooksApiService.ts     # Google Books ✓
│   │   ├── AudibleApiService.ts         # Placeholder
│   │   ├── OpenLibraryApiService.ts     # Placeholder
│   │   ├── ITunesApiService.ts          # Placeholder
│   │   ├── MarkdownGenerator.ts         # Frontmatter Generator
│   │   ├── FileCreator.ts               # Vault Operationen
│   │   ├── ImageDownloadService.ts      # Cover-Download
│   │   └── cache/
│   │       ├── CacheService.ts          # TTL-Cache
│   │       └── CacheCleanup.ts          # Auto-Cleanup
│   ├── ui/
│   │   ├── AudiobookCardRenderer.ts     # Code Block Renderer
│   │   └── AudiobookInputModal.ts       # 4-Tab Modal
│   ├── commands/
│   │   └── AudiobookCommands.ts         # Command Handler
│   └── utils/
│       └── RateLimiter.ts               # Token-Bucket
├── styles.css                            # Plugin-Styles
├── manifest.json                         # Plugin-Manifest
├── main.js                               # Gebündelter Output
└── README.md                             # Diese Datei
```

### Architektur-Prinzipien

**Modular & Erweiterbar**
- Interface-basierte Provider (IMetadataProvider)
- Decorator Pattern für Rate Limiting & Caching
- Factory Pattern für Provider-Instanziierung
- Einfaches Hinzufügen neuer Provider

**Performance-Optimiert**
- Token-Bucket Rate Limiter für gleichmäßige API-Auslastung
- TTL-basierter Cache mit automatischer Invalidierung
- Lazy Loading von Services
- Persistenter Cache überlebt Plugin-Neustarts

**Obsidian Best Practices**
- Native Settings API
- Sichere Vault API Nutzung
- Modal API für konsistente UX
- Markdown Post Processor für Code Blocks
- Proper Cleanup in onunload

### Datenmodell

```typescript
interface AudiobookMetadata {
  id: string;
  provider: string;
  
  // Basics
  title: string;
  subtitle?: string;
  author?: string[];
  narrator?: string[];
  
  // Details
  publisher?: string;
  publishedDate?: string;
  language?: string;
  duration?: string;
  description?: string;
  genre?: string[];
  
  // Series
  series?: string;
  seriesPosition?: string;
  
  // Ratings
  rating?: number;
  ratingCount?: number;
  
  // Cover
  coverUrl?: string;
  coverLocalPath?: string;
  
  // IDs
  isbn?: string;
  isbn13?: string;
  asin?: string;
  
  // Meta
  retrievedAt?: string;
  url?: string;
}
```

## Entwicklung

### Voraussetzungen
- Node.js 18+ (LTS empfohlen)
- npm 9+
- Git

### Setup

```bash
# Repository klonen
git clone https://github.com/yourusername/obsidian-audiobook-metadata.git
cd obsidian-audiobook-metadata

# Dependencies installieren
npm install

# Development Build (mit Watch-Modus)
npm run dev

# Production Build
npm run build

# Linting
npm run lint
```

### Testen im Vault

```bash
# Option 1: Symlink (empfohlen für Development)
ln -s $(pwd) /path/to/vault/.obsidian/plugins/audiobook-metadata

# Option 2: Kopieren
cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/audiobook-metadata/
```

Nach Änderungen:
1. Plugin in Obsidian neu laden (Cmd/Ctrl + R in Developer Mode)
2. Oder: Plugin deaktivieren/aktivieren in Settings

### Neuen Provider hinzufügen

1. **Service erstellen** in `src/services/`
```typescript
export class MyProviderApiService implements IMetadataProvider {
  getProviderId(): string { return 'myprovider'; }
  
  supportsUrl(url: string): boolean {
    return url.includes('myprovider.com');
  }
  
  async fetchById(id: string): Promise<AudiobookMetadata | null> {
    // Implementation
  }
  
  // ... weitere Methoden
}
```

2. **Factory erweitern** in `MetadataProviderFactory.ts`
```typescript
case 'myprovider':
  return new MyProviderApiService();
```

3. **Settings aktualisieren** in `settings.ts`
```typescript
export type ApiProvider = "audible" | "googlebooks" | "openlibrary" | "itunes" | "myprovider";
```

## Fehlerbehebung

### Plugin lädt nicht
- Prüfen Sie, ob alle drei Dateien vorhanden sind: `main.js`, `manifest.json`, `styles.css`
- Starten Sie Obsidian neu
- Prüfen Sie die Developer Console (Cmd/Ctrl + Shift + I) auf Fehler

### "No results found" bei Suche
- Google Books API hat möglicherweise keine Treffer
- Versuchen Sie verschiedene Suchbegriffe
- Prüfen Sie Ihre Internetverbindung
- Rate Limit könnte erreicht sein (warten Sie 1 Minute)

### Cover wird nicht angezeigt
- Prüfen Sie, ob Cover lokal gespeichert wurde in `<Ordner>/_covers/`
- Bei URL-Modus: Internet-Verbindung erforderlich
- Cover-URL könnte ungültig sein
- Prüfen Sie Dateiberechtigungen im Vault

### Cache-Probleme
- Löschen Sie Cache manuell: Command "Clear audiobook metadata cache"
- Cache-Datei: `.obsidian/plugins/audiobook-metadata/data.json`
- Reduzieren Sie Cache Duration in Settings

## Roadmap

### v0.2.0 - Provider-Erweiterung
- [x] Vollständige Audible API Integration
- [ ] Open Library API Integration  
- [ ] iTunes API Integration
- [ ] Cover-Größen-Optimierung
- [ ] Export-Templates für andere Formate

### v0.3.0 - Erweiterte Features
- [ ] Batch-Import (mehrere Bücher auf einmal)
- [ ] Automatische Metadaten-Aktualisierung
- [ ] Benutzerdefinierte Frontmatter-Templates
- [ ] ISBN-Scanner (Mobile mit Kamera)

### v0.4.0 - Integration
- [ ] Dataview-Integration
- [ ] Book Notes Templates
- [ ] Reading Progress Tracker
- [ ] Goodreads-Sync
- [ ] Custom Provider API (für eigene Quellen)

### Langfristig
- [ ] Mobile Optimierung
- [ ] Audiobook-Player Integration
- [ ] Hörbuch-Bibliothek Ansicht
- [ ] Tags & Collections
- [ ] Import aus Calibre/Audiobookshelf

## Bekannte Einschränkungen

1. **Audible API**
   - Verwendet Audnex API (Third-Party) für Metadaten
   - Offizielle Audible API für Suche
   - Rate Limits beachten (daher Rate Limiter implementiert)
   - Nur DE, UK, US Regionen verfügbar

2. **Google Books API**
   - Nicht alle Bücher haben Audiobook-spezifische Daten (Narrator, Duration)
   - Rate Limits gelten (daher Rate Limiter implementiert)
   - Manche Regionen haben eingeschränkten Zugriff

3. **Open Library/iTunes**
   - Aktuell nur Placeholder
   - Werden in zukünftigen Versionen implementiert

3. **Cover-Download**
   - Funktioniert nur bei verfügbaren Cover-URLs
   - Bildqualität abhängig von Provider
   - Keine automatische Skalierung

4. **Offline-Modus**
   - Keine API-Features verfügbar
   - Nur manuelle Eingabe möglich
   - Cover-URLs funktionieren nicht

## Beiträge

Contributions sind herzlich willkommen! 

### Wie Sie beitragen können

1. **Bug Reports**: [GitHub Issues](https://github.com/yourusername/obsidian-audiobook-metadata/issues)
2. **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/obsidian-audiobook-metadata/discussions)
3. **Pull Requests**:
   ```bash
   git checkout -b feature/AmazingFeature
   git commit -m 'Add AmazingFeature'
   git push origin feature/AmazingFeature
   ```
4. **Dokumentation**: Verbesserungen an README, Code-Kommentaren
5. **Testing**: Testen Sie neue Features, melden Sie Bugs

### Code Style
- TypeScript mit `strict: true`
- ESLint für Code-Qualität
- Kommentare auf Englisch im Code
- User-facing Strings auf Deutsch

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/obsidian-audiobook-metadata/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/obsidian-audiobook-metadata/discussions)
- **Obsidian Forum**: [Plugin-Thread](https://forum.obsidian.md)

## Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## Danksagungen

- **Obsidian Team** für die hervorragende Plugin-API und Dokumentation
- **Google Books** für die kostenfreie API
- **Community** für Feedback, Testing und Beiträge
- **GitHub Copilot** für Unterstützung bei der Entwicklung

## Changelog

### v0.1.1 (2024-03-08) - Audible Integration
- ✨ **Audible API vollständig implementiert**
  - ASIN-basierte Suche via Audnex API
  - URL-Import von Audible-Links
  - Textsuche via offizielle Audible API
  - Multi-Region Support (DE, UK, US)
- 🎙️ **Audiobook-spezifische Metadaten**
  - Narrator/Sprecher-Informationen
  - Präzise Dauer-Angaben
  - Serien-Support (Primary & Secondary)
  - Genre-Filtering (echte Genres vs. Tags)
- 🔧 **Datenverarbeitung**
  - Automatische Serien-Position-Bereinigung
  - Duration Formatting (Minuten → lesbar)
  - ASIN-Validierung
- 🌍 **Region-spezifische URLs** für Audible.de/.co.uk/.com

### v0.1.0 (2024-03-08) - Initial Release
- ✨ Multi-Provider Architektur
- ✅ Google Books API vollständig implementiert
- 🎨 Visuelle Audiobook-Karten via Code Blocks
- 📝 Automatische Frontmatter-Generierung
- ⚡ Rate Limiting & Caching
- 🖼️ Cover-Download mit lokaler Speicherung
- 🛠️ 4-Tab Input Modal (URL/Search/ID/Manual)
- 📱 Offline-Modus
- 🎛️ Vollständige Settings-Integration
- 🔧 5 Commands für verschiedene Workflows

---

**Version**: 0.1.1  
**Status**: Beta  
**Letztes Update**: 8. März 2024  
**Compatibility**: Obsidian 0.15.0+
