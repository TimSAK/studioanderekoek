# studio andere koek website

Website van [studio andere koek](https://studioanderekoek.nl/), het bedrijf van Tim van der Putten in Groningen.

Statische site zonder build-stap: plain HTML, CSS en een beetje JavaScript. GitHub Pages serveert de `main`-branch rechtstreeks; elke push naar `main` staat binnen een minuut live.

## Structuur

```
index.html          De pagina (hero, diensten, werkwijze, klanten, over, contact, afsluiting)
404.html            Niet-gevonden-pagina ("Deze pagina is uitgevlogen.")
css/style.css       Alle styling; kleuren, lettermaten en bewegingscurves staan bovenin als CSS-variabelen
js/main.js          Binnenkomst bij scrollen, de kolibrie, contactformulier
img/kolibrie.svg    De kolibrie uit het logo als vector (13 driehoeken, uit de originele Illustrator-PDF)
img/                Verder: logo (voor social media), app-icoon, klant- en partnerlogo's
fonts/              Big Shoulders en Public Sans, zelf gehost (zie fonts/LICENTIES.md)
.nojekyll           Zorgt dat GitHub Pages de bestanden ongewijzigd serveert
```

## Ontwerp

"Software bouwen is andere koek." De naam van de studio is de zin bovenaan, met de kolibrie uit het logo
erin als een woord en "andere" in de zes kleuren van het logo. De lichte versie heeft een lichte grond met
petrol tekst en cyaan knoppen; de donkere versie petrol als grond en goud voor de tekst.
Elke sectie volgt hetzelfde raster: kop links (kolom 1–4), inhoud rechts (kolom 5–12).

- **Illustraties** bij de diensten en de werkwijze zijn origami-tekeningen in de kleuren van het logo, inline in
  `index.html` (kaart met route, gestapelde blokken, vinkje, papieren vliegtuigje, enzovoort). Er staan geen
  foto's op de site. Bij "Wat levert het je op?" staan zes vinkjes, elk in een van de zes logokleuren.
- **Het bosje** rechts in de hero is een origami-palmbosje in (lichte tinten van) de logoblauwen, inline in
  `index.html` (`.grove`). Het staat alleen op schermen vanaf 900px breed, blijft onder de eerste regel van de
  zin en groeit op brede schermen ernaast. De bladeren wiegen traag en ritselen als de kolibrie vertrekt of
  landt. De tekening komt uit een klein Python-script (palmen, varens en struiken als driehoeken); pas je
  hem met de hand aan, houd dan de `style="fill:var(--g1..g4)"`-kleuren aan zodat licht en donker blijven werken.
- **De kolibrie** (`js/main.js`) begint in het bosje (op grote schermen) en vliegt van daar de zin in; op
  kleinere schermen begint hij in de zin. Na een paar seconden vliegt hij eruit. Tijdens het
  scrollen blijft hij zitten. Eén seconde nadat het scrollen stopt, vliegt hij naar een plek in beeld als zijn
  eigen plek uit beeld is. Wie 5–9 seconden niet scrolt, ziet hem naar een andere willekeurige plek in beeld
  vliegen: nooit over tekst heen, het liefst niet dwars over een alinea, binnen de paginamarges, en niet
  tijdens typen in het formulier. Staat de zin in beeld, dan kan hij er ook weer in terugvliegen.
  Een klik op de vogel zet hem stil, een tweede klik laat hem weer vliegen (dat wordt onthouden in
  `localStorage` onder `sak-kolibrie`). Hij heeft één
  vaste maat (7% van de schermbreedte, 64–104px); alleen in de zin bovenaan (`data-fit`) is hij zo groot als
  een woord. De plekken zijn de `<span ... data-perch>`-elementen in `index.html`; verplaats of voeg er een
  toe om hem ergens anders te laten landen. Met "beweging beperken" aan, of zonder JavaScript, staat hij stil
  in de zin.
- **Licht en donker** volgen de instelling van het besturingssysteem (`prefers-color-scheme`); beide
  kleursets staan bovenin `css/style.css`. De werkwijze is in beide een donkere band met goud; de secties
  daaromheen wisselen tussen de grondkleur en een cyaan (licht) of petrol (donker) vlak.

## Lokaal bekijken

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

## Inhoud aanpassen

- **Teksten**: rechtstreeks in `index.html`.
- **Kleuren**: de `:root`-variabelen bovenin `css/style.css`.

## Contactformulier

Het formulier post naar [Web3Forms](https://web3forms.com/), omdat GitHub Pages geen PHP kan draaien. De `access_key` in `index.html` is gekoppeld aan tim@studioanderekoek.nl; berichten komen binnen van `notify@web3forms.com`. Die sleutel mag publiek in de HTML staan: berichten gaan alleen naar het gekoppelde adres.

Tegen spam zit er een verborgen `botcheck`-veld in (honeypot); Web3Forms weigert inzendingen waarin dat veld is ingevuld.

## Bezoekersteller

[GoatCounter](https://www.goatcounter.com/) telt bezoeken zonder cookies, dus er is geen cookiebanner nodig. Het script onderaan `index.html` wijst naar `studioanderekoek.goatcounter.com`; maak een GoatCounter-account met precies die code (of pas de URL aan). Op localhost telt hij niets.

Naast paginabezoeken worden twee events geteld: `klik-mail` (klik op het mailadres) en `bericht-verstuurd` (contactformulier gelukt).

## Eigen domein

De site draait op https://studioanderekoek.nl/ via het bestand `CNAME`. De DNS staat bij TransIP:

- apex `studioanderekoek.nl`: `A`-records naar de GitHub Pages IP's `185.199.108.153`, `185.199.109.153`, `185.199.110.153` en `185.199.111.153` (en eventueel `AAAA` naar `2606:50c0:8000::153` t/m `8003::153`);
- `www`: `CNAME` naar `timsak.github.io`;
- de `MX`- en `TXT`-records van Fastmail blijven ongemoeid, anders stopt de mail.

`404.html` gebruikt paden vanaf de root (`/css/style.css`), omdat hij op elke URL getoond kan worden.
