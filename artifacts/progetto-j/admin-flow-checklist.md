# Checklist flussi admin

**Data verifica:** 23 agosto 2026

## Autenticazione e accesso

| Scenario | Risultato | Evidenza |
| --- | --- | --- |
| `GET /api/admin/me` senza cookie | PASS — `200 {"authenticated":false}` | Route e risposta runtime |
| Apertura `/admin` senza sessione | PASS — mostra form Password/Entra | Verifica visuale desktop |
| Login con password errata | PASS — `401 {"error":"Password errata"}` | Richiesta runtime |
| `POST /api/admin/logout` anonimo | PASS — `200 {"authenticated":false}` | Richiesta runtime |
| Login positivo | NON ESEGUIBILE in script | La password è gestita dal secret store e non viene restituita all’agente |

## Verifica per sezione

| Sezione | Lettura | Operazioni previste | Refresh automatico verificato nel codice | Stati vuoti/errore |
| --- | --- | --- | --- | --- |
| Oggi / Diario | `entries`, `entries/latest`, `entries/:numero` | creazione, modifica, eliminazione giorno | PASS — invalidazione entries, summaries, latest e dashboard | PASS — loading, errore, validazione intervalli |
| Pagine | `GET /pages` | creazione, modifica, eliminazione | PASS — invalidazione lista pagine | PASS — form e lista gestiscono loading/errore |
| Articoli | `GET /articles` | creazione, modifica, eliminazione, preview/pubblicazione | PASS — invalidazione lista articoli | PASS — lista vuota, upload e salvataggio fallito comunicati |
| Sito | `GET /content` | modifica contenuti per sezione | PASS — invalidazione contenuti | PASS — loading/errore con retry |
| Social | `GET /social` | creazione, modifica, eliminazione | PASS — invalidazione social | PASS — lista vuota e feedback mutation presenti |
| Sponsor | `GET /sponsors` | creazione, modifica, eliminazione | PASS — invalidazione sponsor | PASS — lista vuota e feedback mutation presenti |
| Coaching | `GET /coaching` | modifica e visibilità pagina | PASS — invalidazione coaching | PASS — loading/errore con retry, successo/errore salvataggio |
| Contatti | `GET /contacts` | cambio stato nuova/letta/gestita | PASS — invalidazione contatti | PASS — loading/errore con retry, ricerca vuota |
| Candidature | `GET /candidature` | aggiornamento stato | PASS — invalidazione candidature | PASS — loading/errore con retry, lista vuota |
| Iscritti | `GET /subscribers` | eliminazione, export CSV | PASS — invalidazione iscritti | PASS — loading/errore, lista e ricerca vuote |
| Planner | checklist, state, task, template | task/template CRUD, riordino, routine, note | PASS — invalidazioni mirate per lista/stato/template | PASS — loading, errori mutation e conferme distruttive |
| Analytics | `GET /admin/analytics` | filtri periodo e lettura | N/A | PASS — loading/errore con retry |
| Backup | `GET /admin/backup` | download JSON | N/A | PASS — errori HTTP/JSON e feedback conteggio |
| Bulk | `GET/POST /bulk/entries` | export/import testo | PASS — invalidazione dati diario | PASS — loading, validazione e feedback import |

## Protezioni route verificate

Senza sessione, le route di gestione hanno risposto `401` per:

- `GET /api/contacts`, `GET /api/subscribers`, `GET /api/candidature`;
- `POST /api/entries`, `POST /api/pages`, `POST /api/articles`;
- `GET /api/admin/planner/tasks`, `GET /api/admin/planner/templates`;
- `GET /api/admin/analytics?period=7d`.

Le route pubbliche di sola lettura (`entries`, `pages`, `articles`, `sponsors`,
`social`, `coaching`, `content`) hanno risposto `200` dove previsto. Le
risposte `404` ottenute usando il percorso errato `/api/site-content` e
`/api/planner/tasks` non sono regressioni: i percorsi reali sono `/api/content`
e `/api/admin/planner/tasks`.

## Dati non validi e rete

- Login con payload/password errata: `401`, messaggio esplicito.
- Le mutation admin sono protette lato server e le mutation client espongono
  feedback di errore; le sezioni lista hanno retry accessibile.
- I payload vuoti per creazione articoli/pagine senza sessione vengono respinti
  prima della validazione dati con `401`, senza scrivere record.
- Le liste senza risultati mostrano messaggi distinti dalla ricerca senza
  risultati.

## Esito

**PASS con una limitazione operativa:** i flussi che richiedono login positivo
non sono stati eseguiti via script perché il secret store non rende la
password disponibile all’agente. Non sono state eseguite mutation reali su
dati di produzione; la copertura delle operazioni e delle invalidazioni è
stata verificata attraverso componenti e route corrispondenti. Non risultano
regressioni riproducibili.