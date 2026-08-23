# Verifica protezioni e dati admin

**Data:** 23 agosto 2026

## Controlli autorizzativi runtime

Senza cookie/sessione, le seguenti richieste hanno restituito `401`:

- `GET /api/contacts`
- `GET /api/subscribers`
- `GET /api/candidature`
- `GET /api/admin/backup`
- `GET /api/admin/analytics?period=7d`
- `GET /api/admin/planner/tasks`
- `GET /api/admin/planner/templates`
- `GET /api/admin/drafts/1`
- `POST /api/entries`
- `POST /api/pages`
- `POST /api/articles`
- `PUT /api/coaching`
- `PUT /api/content/home_hero_titolo`
- `DELETE /api/subscribers/999999`
- `PATCH /api/contacts/999999`
- `PATCH /api/candidature/999999`

Le route sensibili controllano `req.session.adminAuthenticated` prima di
leggere o modificare il database. Anche l’export completo è protetto.

## Input invalidi e duplicati

| Scenario | Risultato |
| --- | --- |
| `POST /api/contact` con body vuoto | `400 All fields are required` |
| `POST /api/subscribe` con email invalida | `400 Inserisci un indirizzo email valido.` |
| `POST /api/candidature` con body vuoto | `400` con dettagli Zod |
| Candidatura con contatto non valido | `400` con messaggio sul formato |
| Email newsletter duplicata | `409 Questa email è già iscritta.` tramite vincolo DB |
| ID admin non numerico senza sessione | `401`, perché l’autorizzazione precede la validazione |
| Backup senza sessione | `401 Unauthorized` |

Nessun payload di test valido è stato inviato alle route che creano dati.

## UI e azioni distruttive

La conferma lato interfaccia è presente prima di:

- rimuovere un iscritto;
- eliminare un articolo;
- eliminare un profilo social;
- eliminare uno sponsor;
- eliminare task e template planner;
- applicare una routine planner.

I flussi di cancellazione già aggiornano le query/liste dopo il successo. Il
backup scaricato dall’interfaccia è costruito solo dopo aver verificato status
HTTP e JSON; il server applica `no-store, no-cache` e non espone il backup
pubblicamente.

## Esposizione dati

- `contacts`, `subscribers` e `candidature` sono `401` senza sessione.
- Il backup è `401` senza sessione e contiene dati sensibili solo nel
  download admin autorizzato.
- Le route pubbliche di contenuto (`entries`, `articles`, `pages`, `content`,
  `coaching`, `social`, `sponsors`) non includono le tabelle private di
  contatti, iscritti o candidature.
- Le API rispondono con header `Cache-Control: no-store, no-cache,
  must-revalidate, proxy-revalidate`, `Pragma: no-cache` ed `Expires: 0`.
- Cookie di sessione: `httpOnly`, `sameSite: lax`, `secure` in produzione e
  scadenza di sette giorni.

## Record mancanti nelle cancellazioni

La correzione successiva alla verifica è stata applicata e controllata con una
sessione admin temporanea, senza modificare dati reali:

| DELETE con ID inesistente | Risultato |
| --- | ---: |
| `/api/articles/999999` | `404` |
| `/api/social/999999` | `404` |
| `/api/sponsors/999999` | `404` |
| `/api/admin/planner/extras/999999` | `404` |
| `/api/admin/planner/tasks/999999` | `404` |
| `/api/admin/planner/templates/999999` | `404` |

Gli ID non validi (`0`, testo o numeri misti a testo) restituiscono `400`;
senza sessione le stesse route continuano a restituire `401`. Le route ora
usano il record restituito dalla cancellazione per distinguere un successo da
un elemento già rimosso. L’interfaccia mostra un messaggio esplicito per il
`404` e invalida le liste esclusivamente dopo una cancellazione riuscita.

**Esito:** protezioni, non-esposizione dati, input invalidi, conferme UI e
gestione dei record mancanti PASS.