# studio andere koek website

Website van [studio andere koek](https://studioanderekoek.nl/), het bedrijf van Tim van der Putten in Groningen.

Statische site zonder build-stap: plain HTML, CSS en een beetje JavaScript. GitHub Pages serveert de `main`-branch rechtstreeks; elke push naar `main` staat binnen een minuut live.

## Structuur

```
index.html          De pagina (hero, diensten, werkwijze, klanten, over, contact)
404.html            Niet-gevonden-pagina
css/style.css       Alle styling (kleuren staan bovenin als CSS-variabelen)
js/main.js          Jaartal, header, terminal-animatie, contactformulier
img/                Logo en app-icoon
fonts/              Inter (self-hosted, OFL-licentie)
.nojekyll           Zorgt dat GitHub Pages de bestanden ongewijzigd serveert
```

## Lokaal bekijken

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

## Inhoud aanpassen

- **Teksten**: rechtstreeks in `index.html`.
- **Tijdelijke versiekeuze**: `versiebalk.js` toont bovenaan een balk om te wisselen tussen de huidige versie en `voor/` (de versie vóór de design-skills, ook bewaard als git-tag `voor-skills`). Vóór de lancering verwijderen: `versiebalk.js`, de map `voor/` en de `<script>`-regel in `index.html`.
- **Kleuren**: de `:root`-variabelen bovenin `css/style.css`.

## Contactformulier

Het formulier post naar [Web3Forms](https://web3forms.com/), omdat GitHub Pages geen PHP kan draaien. De `access_key` in `index.html` is gekoppeld aan tim@studioanderekoek.nl; berichten komen binnen van `notify@web3forms.com`. Die sleutel mag publiek in de HTML staan: berichten gaan alleen naar het gekoppelde adres.

Tegen spam zit er een verborgen `botcheck`-veld in (honeypot); Web3Forms weigert inzendingen waarin dat veld is ingevuld.

## Bezoekersteller

[GoatCounter](https://www.goatcounter.com/) telt bezoeken zonder cookies, dus er is geen cookiebanner nodig. Het script onderaan `index.html` wijst naar `studioanderekoek.goatcounter.com`; maak een GoatCounter-account met precies die code (of pas de URL aan). Op localhost telt hij niets.

Naast paginabezoeken worden twee events geteld: `klik-mail` (klik op het mailadres) en `bericht-verstuurd` (contactformulier gelukt).

## Eigen domein koppelen

1. Voeg een bestand `CNAME` toe met daarin `studioanderekoek.nl`, of zet in GitHub bij *Settings → Pages → Custom domain* het domein `studioanderekoek.nl`. Zet daarna *Enforce HTTPS* aan.
   Zolang dit niet gebeurd is, staat de site als preview op https://timsak.github.io/studioanderekoek/.
2. Bij je DNS-provider: een `CNAME`-record `www` → `timsak.github.io`, en voor de apex `A`-records naar de GitHub Pages IP's ([docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)).
