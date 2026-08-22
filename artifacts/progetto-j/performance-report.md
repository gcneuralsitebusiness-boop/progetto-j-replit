# Verifica velocità Progetto J

**Data:** 23 agosto 2026  
**Ambiente:** workflow web/API di sviluppo, percorso `/progetto-j`, proxy Replit

## Metodo e soglie

Le route sono state richieste tre volte consecutivamente con `curl`; i tempi sono
quindi indicativi del server e del proxy, non sostitutivi di un Lighthouse su
rete mobile reale. Le soglie di regressione usate per questa verifica sono:

- HTML iniziale: warning oltre 500 ms TTFB o 1 s di risposta completa.
- API pubbliche: warning oltre 500 ms o payload oltre 250 kB per singola
  richiesta.
- Bundle iniziale JavaScript: warning oltre 350 kB compresso/grossolanamente
  oltre 1 MB non compresso; le route secondarie devono rimanere lazy.
- Nessuna soglia viene applicata alle immagini remote senza una misura di rete
  reale; le immagini restano il principale elemento da controllare in
  produzione.

## Risultati HTTP ripetibili

| Scenario | Run 1 | Run 2 | Run 3 | Esito |
| --- | ---: | ---: | ---: | --- |
| Homepage `/` | 79 ms | 42 ms | 26 ms | OK |
| Journaling `/journaling` | 24 ms | 22 ms | 24 ms | OK |
| Statistiche `/statistiche` | 21 ms | 22 ms | 25 ms | OK |
| Admin `/admin` | 23 ms | 24 ms | 26 ms | OK |

Le risposte HTML sono risultate `200`, con 72 267 byte ciascuna. La prima
richiesta alla homepage è più lenta per il warm-up del proxy; le richieste
successive sono stabili.

## API pubbliche

| Endpoint | Status | Payload | Tempo completo |
| --- | ---: | ---: | ---: |
| `/api/content` | 200 | 2 028 B | 30 ms |
| `/api/entries/latest` | 200 | 2 221 B | 21 ms |
| `/api/entries` | 200 | 142 756 B | 35 ms |
| `/api/entries/summary` | 200 | 93 790 B | 22 ms |
| `/api/pages` | 200 | 2 B | 20 ms |

Tutte le API misurate restano sotto le soglie. Il payload completo di
`/api/entries` è il più grande, ma non supera il limite operativo definito.

## Bundle e caricamento interno

La build Vite produce **52 file / 1 420 019 byte** di asset statici:

- JavaScript totale: **1 197 422 byte**.
- CSS totale: **222 597 byte**.
- Entry JavaScript: **288 889 byte**.
- Homepage lazy chunk: **14 096 byte**.
- Journaling lazy chunk: **17 606 byte**.
- Statistiche lazy chunk: **28 531 byte**.
- Admin lazy chunk: **175 180 byte**.
- Analytics admin lazy chunk: **11 657 byte**.
- Chunk più grande: grafici `LineChart`, **392 985 byte**, caricato
  separatamente.

La navigazione interna non richiede un nuovo documento HTML: React mantiene
l'entrypoint e carica il chunk della route. Journaling, Statistiche e Admin
sono quindi separati dal caricamento iniziale; Analytics viene caricato solo
quando serve. Il ritorno su una route già visitata beneficia della cache del
browser e della configurazione React Query (`staleTime` 60 secondi e nessun
refetch sul focus).

## Verifica visuale dei percorsi

Sono state controllate le route a viewport desktop 1440×900 e mobile
390×844. Homepage e Admin sono leggibili su desktop; Journaling e Statistiche
mantengono layout, menu mobile e contenuti visibili su mobile. La console
browser ha mostrato solo i messaggi attesi di Vite/React DevTools, senza errori
applicativi.

## Limitazioni e residui

Il proxy di sviluppo riscrive le richieste dirette agli asset restituendo
l'entrypoint HTML; pertanto i byte di rete degli asset non sono stati usati per
stimare il bundle. I pesi sopra provengono dalla directory `dist/public`,
mentre i tempi HTML/API provengono da richieste ripetute al proxy/workflow.
Una misura Lighthouse/WebPageTest su deployment pubblico e rete mobile reale
resta il controllo successivo consigliato, soprattutto per immagini,
font-loading e Core Web Vitals.

**Esito:** nessuna regressione misurabile oltre le soglie definite in questa
verifica.