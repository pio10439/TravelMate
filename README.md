# TravelMate – Progressive Web App

**TravelMate** to progresywna aplikacja webowa (PWA) do planowania i dokumentowania podróży.
Pozwala dodawać wyprawy, śledzić odwiedzone miejsca na mapie, sprawdzać pogodę w dowolnym mieście na świecie i personalizować wygląd.
Aplikacja działa **offline**, obsługuje **powiadomienia** i **dwa języki (PL / EN)**.

**Wersja online:** [https://tourmaline-vacherin-9003fb.netlify.app](https://tourmaline-vacherin-9003fb.netlify.app)

---

## Funkcjonalności

| Funkcja                        | Opis                                                    |
| ------------------------------ | ------------------------------------------------------- |
| **Dodawanie podróży**          | Nazwa, miasto, opis z punktorami (`·`), zdjęcie, GPS    |
| **Edycja i usuwanie**          | Pełna edycja z podglądem zdjęcia                        |
| **Oznaczanie jako odwiedzone** | Checkbox przy liście podróży                            |
| **Zdjęcia**                    | Z aparatu lub galerii                                   |
| **GPS**                        | Automatyczne wykrywanie miasta                          |
| **Mapa świata**                | Oznaczanie odwiedzonych miejsc na interaktywnej mapie   |
| **Pogoda**                     | Sprawdzanie aktualnej pogody w dowolnym mieście         |
| **Tłumaczenia**                | Polski / Angielski                                      |
| **Tryb ciemny**                | Automatyczny lub ręczny (dark mode)                     |
| **PWA**                        | Działa offline, można zainstalować na telefonie         |
| **Powiadomienia**              | Przypomnienia o podróżach w określonym interwale        |
| **Toast**                      | Estetyczne komunikaty z animacją                        |
| **Responsywność**              | Pełne dostosowanie do urządzeń mobilnych i desktopowych |

---

## Technologie

```
HTML5, CSS3
JavaScript
PWA – Service Worker, Manifest
localStorage – dane offline
Geolocation API – GPS
OpenWeatherMap API – pogoda
Nominatim (OpenStreetMap) – reverse geocoding
Leaflet.js - mapa świata
Netlify – hosting HTTPS
```

---

## Uruchomienie projektu lokalnie

1. **Sklonuj repozytorium:**

   ```bash
   git clone https://github.com/pio10439/TravelMate.git
   cd TravelMate
   ```

2. **Uruchom lokalny serwer** (np. przy użyciu Live Server):

   ```bash
   npx live-server
   ```

   lub otwórz ręcznie plik `index.html` w przeglądarce.

3. **Instalacja jako PWA:**

   - Wejdź na stronę projektu,
   - Kliknij w ikonę `+` w pasku adresu (Chrome / Edge),
   - Wybierz „Zainstaluj aplikację”.

---

## Struktura projektu

```
📁 /
├── index.html
├── add-trip.html
├── map.html
├── weather.html
├── settings.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── main.js
│   ├── add-trip.js
│   ├── map.js
│   ├── weather.js
│   ├── settings.js
│   ├── theme.js
│   ├── toast.js
│   └── utils.js
│
├── translations/
│   ├── translation.js
│   ├── nav-translation.js
│   ├── map-translations.js
│   ├── weather-translations.js
│   └── settings-translations.js
│
├── images/
│   ├── business-trip.png
│   └── travel-bag.png
│
├── manifest.webmanifest
└── sw.js
```

---
