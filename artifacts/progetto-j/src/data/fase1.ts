export type StatNumber = { value: number; decimals?: number; prefix?: string; suffix?: string };
export type StatSegment = { kind: "number"; number: StatNumber } | { kind: "text"; text: string };
export type Stat = { id: string; segments: StatSegment[]; label: string; note?: string; red?: boolean };
export type Section = { id: string; title: string; stats: Stat[] };

const n = (value: number, opts: Omit<StatNumber, "value"> = {}): StatSegment => ({ kind: "number", number: { value, ...opts } });
const t = (text: string): StatSegment => ({ kind: "text", text });

export const FASE1_DATA = {
  route: "/fase-1",
  homeButton: "FASE 1 · I DATI COMPLETI",
  metadata: {
    title: "Fase 1 · I dati completi — Project J",
    description: "180 giorni documentati in pubblico: allenamento, lavoro, social, cadute. Tutti i numeri della fase 1.",
    canonical: "https://projectj180day.com/fase-1",
  },
  header: {
    label: "PROJECT J · FASE 1",
    title: "180 GIORNI. I NUMERI VERI.",
    intro: "Sei mesi documentati in pubblico, ogni giorno. Qui ci sono tutti i numeri, compresi quelli che non fanno bene.",
  },
  body: {
    title: "IL CORPO",
    timeline: [
      { label: "450 GIORNI FA", value: 130, decimals: 0, unit: "KG" },
      { label: "GIORNO 1", value: 87.3, decimals: 1, unit: "KG" },
      { label: "GIORNO 180", value: 82.4, decimals: 1, unit: "KG" },
    ],
    note: "Il peso l'ho perso prima. In questi 180 giorni ho imparato a non tornare indietro.",
  },
  sections: [
    {
      id: "allenamento",
      title: "L'ALLENAMENTO",
      stats: [
        { id: "round", segments: [n(531)], label: "ROUND", note: "Circa un terzo sparring, un terzo pao, un terzo tecnica (K1, BJJ, boxe, grappling). Divisione stimata." },
        { id: "sparring", segments: [n(20)], label: "SPARRING PARTNER" },
        { id: "flessioni", segments: [n(10562)], label: "FLESSIONI" },
        { id: "addominali", segments: [n(9562)], label: "ADDOMINALI" },
        { id: "km", segments: [n(281.6, { decimals: 1 })], label: "KM DI CORSA", note: "In 37 corse." },
        { id: "ore", segments: [n(127)], label: "ORE DI ALLENAMENTO REGISTRATE", note: "Solo nei giorni in cui ho segnato la durata." },
      ],
    },
    {
      id: "vita",
      title: "LA VITA",
      stats: [
        { id: "giorni", segments: [n(180)], label: "GIORNI IN PUBBLICO" },
        { id: "sveglie", segments: [n(100)], label: "SVEGLIE ALLE 5", note: "50 alle 6, 30 alle 8." },
        { id: "lavoro", segments: [n(1000, { suffix: "+" })], label: "ORE DI LAVORO" },
        { id: "paesi", segments: [n(4)], label: "PAESI VISITATI" },
        { id: "sonno", segments: [n(6), t(" H "), n(20)], label: "SONNO MEDIO A NOTTE" },
      ],
    },
    {
      id: "social",
      title: "I SOCIAL",
      stats: [
        { id: "video", segments: [n(140)], label: "VIDEO PUBBLICATI" },
        { id: "views", segments: [n(2000000, { suffix: "+" })], label: "VISUALIZZAZIONI SU INSTAGRAM", note: "Più 50.000 su YouTube, circa 20.000 su TikTok, 7.000 visite al sito." },
        { id: "follower", segments: [n(325, { prefix: "+", suffix: "%" })], label: "FOLLOWER", note: "Da 400 a 1.700." },
      ],
    },
    {
      id: "scomodo",
      title: "QUELLO CHE NON FA BENE",
      stats: [
        { id: "weekend", red: true, segments: [n(71, { suffix: "%" }), t(" / "), n(38, { suffix: "%" })], label: "GIORNI DI ALLENAMENTO IN SETTIMANA / NEL WEEKEND", note: "Nel weekend mi alleno la metà. È il punto da sistemare nella fase 2." },
        { id: "alcol", red: true, segments: [n(17)], label: "GIORNI CON ALCOL", note: "Quelli che ho scritto nel diario. Quelli veri sono di più." },
      ],
    },
  ] as Section[],
  closing: {
    quote: "Quando esco da questo periodo di merda, divento un fighter di MMA.",
    caption: "Dal mio diario, a 130\u00a0kg.",
    text: "Dal giorno 181 si ricomincia. Corpo, soldi, testa.",
    finalLine: "IC XC NIKA",
    backLink: "← TORNA ALLA HOME",
  },
} as const;
