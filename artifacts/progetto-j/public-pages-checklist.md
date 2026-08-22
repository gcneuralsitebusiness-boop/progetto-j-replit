# Verifica pagine pubbliche

**Data:** 23 agosto 2026

## Route e dati

Le route SPA principali hanno risposto `200` tramite il proxy:

- `/`, `/journaling`, `/statistiche`, `/chi-sono`, `/articoli`;
- `/coaching`, `/social`, `/sponsor`, `/privacy`, `/termini`, `/grazie`;
- `/giorno/104`, `/card/104`, `/card/104/reel`,
  `/card/104/reel-minimal`.

Le API pubbliche collegate hanno risposto correttamente:

| Endpoint | Status | Dati |
| --- | ---: | --- |
| `/api/content` | 200 | contenuti homepage e sezioni |
| `/api/entries` | 200 | 104 giorni |
| `/api/entries/latest` | 200 | 3 record |
| `/api/entries/summary` | 200 | 104 riepiloghi |
| `/api/articles` | 200 | 13 articoli |
| `/api/coaching` | 200 | contenuto coaching |
| `/api/pages` | 200 | lista vuota gestita dalla pagina |
| `/api/social` | 200 | lista vuota gestita dalla pagina |
| `/api/sponsors` | 200 | lista vuota gestita dalla pagina |

Sono stati verificati anche `/api/entries/1` e `/api/entries/104` (`200`).
Un giorno inesistente (`/api/entries/999`) viene respinto con `400` dalla
validazione del parametro e non causa una query non valida.

## Link e contenuti

- La navbar contiene esclusivamente Chi sono, Journaling, Statistiche,
  Articoli e Richiedi accesso; il menu mobile apre, riceve focus e può essere
  chiuso con Escape.
- L’ultimo checkpoint di Journaling collega a `/giorno/104`.
- Le card articolo usano `/a/:slug`; è stato verificato lo slug reale
  `il-colpo-piu-debole-vince-i-combattimenti`.
- Il dettaglio giorno collega gli articoli per data tramite
  `LinkedArticles` e usa link `/a/:slug`.
- L’articolo collega indietro al giorno tramite `/giorno/:numero` quando la
  data corrisponde.
- Il dettaglio giorno supporta HTML sanitizzato tramite
  `containsDiaryHtml`/`sanitizeDiaryHtml`, mantenendo il fallback per testo
  semplice.
- Le immagini usano `getPhotoUrl` e hanno fallback visivo quando assenti.
  Nel dataset sono presenti immagini su 88 dei 104 giorni; il giorno 104
  visualizzato senza immagine mostra correttamente lo stato “nessuna
  immagine”.
- Le card `/card/104` e le varianti reel sono renderizzate senza navbar, come
  richiesto dal canvas social.

## Verifica visuale

Controllate tramite preview:

- Homepage desktop 1440×900.
- Journaling desktop 1440×900 e mobile 390×844.
- Statistiche desktop 1440×900 e mobile 390×844.
- Articoli desktop 1440×900.
- Articolo reale mobile 390×844, con immagine e titolo.
- Dettaglio giorno 104 mobile 390×844.
- Card giorno 104 mobile 390×844.
- Admin separato, già coperto dalla verifica dei flussi admin.

Il layout resta leggibile, la navbar desktop è presente dove previsto, il
menu mobile è disponibile sulle pagine responsive e non sono comparsi errori
applicativi nella console browser. I warning osservati sugli asset font
preload sono warning di caricamento e non hanno impedito il rendering.

## Stati vuoti ed errori

- Journaling e giorno usano `DataErrorState` quando il caricamento API fallisce.
- Articolo inesistente mostra il contenuto 404 dell’interfaccia.
- Statistiche mostra lo stato di caricamento e l’errore con footer.
- Liste vuote di articoli, pagine, social e sponsor hanno rendering dedicato o
  non mostrano sezioni vuote.
- Un’immagine mancante non rompe il layout: vengono mostrate le informazioni
  del giorno senza il blocco immagine.

**Esito:** PASS. Nessuna regressione riproducibile su route, dati, link,
HTML diario, immagini, card o layout responsive.