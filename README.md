# 🗺️ Projekt Pokedex

Ein interaktiver, webbasierter Pokédex, der Daten über verschiedene Pokémon-Typen sammelt und anzeigt. Das Projekt besticht durch ein modernes Design, dynamische Typen-Farben und maßgeschneiderte CSS-Animationen.

## 🚀 Features

* **Umfangreiche Übersicht:** Darstellung von Pokémon-Daten direkt im Browser.
* **Modernes UI:** Dynamische Anpassung an die bekannten Pokémon-Elementartypen (Feuer, Wasser, Elektro, Pflanze, etc.).
* **Herzschlag-Ladeanimation:** Ein optimierter SVG-Spinner, der im Takt der Pokémon-Typen wie ein Herz pulsiert – komplett transparent und ohne störende Schatten.

## 🛠️ Technologien

* **HTML5:** Strukturierung der Applikation.
* **CSS3:** Modernes Layouting und flüssige `@keyframes`-Herzschlag-Animationen.
* **JavaScript:** Dynamisches Nachladen und Verarbeiten der Pokémon-Daten.

## 📁 Projektstruktur

```text
Projekt_Pokedex/
├── assets/         # Bilder, SVGs und Icons
├── scripts/        # JavaScript-Module
├── styles/         # CSS-Dateien (inkl. Lade-Spinner)
├── index.html      # Hauptseite
├── script.js       # Globales Skript
└── style.css       # Globale Stile
```

## ⚙️ Installation & Nutzung

1. Klone das Repository:
   ```bash
   git clone https://github.com
   ```
2. Öffne die `index.html` direkt in deinem bevorzugten Webbrowser.

## 🎨 Der Herzschlag-Spinner (CSS-Vorschau)

Falls du die Animation in Aktion sehen möchtest, sorgt dieser CSS-Code im Projekt für die charakteristische Pulsierung:

```css
@keyframes loadingSpinner {
    0%   { transform: scale(1); }
    5.5% { transform: scale(1.25); } /* 1. Schlag */
    11%  { transform: scale(1.1); }  /* Kurzes Sinken */
    16.5%{ transform: scale(1.35); } /* 2. Hauptschlag */
    22%  { transform: scale(1); }    /* Ruhephase */
    /* ... wiederholt sich für alle Pokémon-Typen ... */
}
```

## 📄 Lizenz

Dieses Projekt ist für Bildungszwecke gedacht. Alle Pokémon-Rechte liegen bei Nintendo, Game Freak und Creatures.
