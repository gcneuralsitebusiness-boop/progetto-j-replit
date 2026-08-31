export type StatoTappa = "pianificato" | "visitato";

export interface PaeseVisitato {
  iso: string;
  nome: string;
}

export interface TappaViaggio {
  id: string;
  ordine: number;
  paese: string;
  iso: string;
  coloraPaese: boolean;
  citta: string;
  lat: number;
  lng: number;
  disciplina: string;
  palestra: string;
  partenza: string;
  partenzaDa: string;
  ritorno: string;
  ritornoDa: string;
  durataGiorni: number;
  stato: StatoTappa;
}

export const VISITATI: PaeseVisitato[] = [
  { iso: "ITA", nome: "Italia" },
  { iso: "AUT", nome: "Austria" },
  { iso: "CZE", nome: "Cechia" },
  { iso: "DEU", nome: "Germania" },
  { iso: "ALB", nome: "Albania" },
  { iso: "LTU", nome: "Lituania" },
  { iso: "POL", nome: "Polonia" },
  { iso: "BLR", nome: "Bielorussia" },
];

export const TAPPE: TappaViaggio[] = [
  {
    id: "thailandia",
    ordine: 1,
    paese: "Thailandia",
    iso: "THA",
    coloraPaese: true,
    citta: "Chalong, Phuket",
    lat: 7.8412,
    lng: 98.3383,
    disciplina: "Muay Thai",
    palestra: "Nak Suu Muay Thai Camp",
    partenza: "2027-02-14T06:35",
    partenzaDa: "Bologna BLQ",
    ritorno: "2027-03-14T23:50",
    ritornoDa: "Phuket HKT",
    durataGiorni: 28,
    stato: "pianificato",
  },
  {
    id: "dagestan",
    ordine: 2,
    paese: "Dagestan",
    iso: "RUS",
    coloraPaese: false,
    citta: "Makhachkala",
    lat: 42.9849,
    lng: 47.5047,
    disciplina: "Lotta",
    palestra: "Gortsy Wrestling Club",
    partenza: "2027-08-16T05:20",
    partenzaDa: "Bologna BLQ",
    ritorno: "2027-09-06T21:15",
    ritornoDa: "Makhachkala MCX",
    durataGiorni: 21,
    stato: "pianificato",
  },
  {
    id: "olanda",
    ordine: 3,
    paese: "Olanda",
    iso: "NLD",
    coloraPaese: true,
    citta: "Amsterdam",
    lat: 52.3676,
    lng: 4.9041,
    disciplina: "K1",
    palestra: "Zwarte Kooi Gym",
    partenza: "2028-02-12T07:10",
    partenzaDa: "Bologna BLQ",
    ritorno: "2028-03-04T19:40",
    ritornoDa: "Amsterdam AMS",
    durataGiorni: 21,
    stato: "pianificato",
  },
  {
    id: "brasile",
    ordine: 4,
    paese: "Brasile",
    iso: "BRA",
    coloraPaese: false,
    citta: "Rio de Janeiro",
    lat: -22.9068,
    lng: -43.1729,
    disciplina: "BJJ",
    palestra: "Academia Fundo Azul",
    partenza: "2028-08-21T09:45",
    partenzaDa: "Bologna BLQ",
    ritorno: "2028-09-25T22:30",
    ritornoDa: "Rio GIG",
    durataGiorni: 35,
    stato: "pianificato",
  },
];