--
-- PostgreSQL database dump
--

\restrict PoCbbbePlakOZBJHF4YgbVZMLT3akNSV79m1YEyIGce4kZgFw03bs0Bcco1OGTL

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_sessions (
    sid character varying(255) NOT NULL,
    sess json NOT NULL,
    expire timestamp with time zone NOT NULL
);


--
-- Name: articoli; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articoli (
    id integer NOT NULL,
    slug text NOT NULL,
    titolo text NOT NULL,
    categoria text DEFAULT 'Generale'::text NOT NULL,
    contenuto text DEFAULT ''::text NOT NULL,
    immagine text,
    pubblicato boolean DEFAULT false NOT NULL,
    data date DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    card_titolo text,
    card_sottotitolo text,
    card_immagine text,
    card_overlay integer,
    card_mostra_parole boolean
);


--
-- Name: articoli_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.articoli_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: articoli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.articoli_id_seq OWNED BY public.articoli.id;


--
-- Name: bozze; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bozze (
    numero integer NOT NULL,
    dati jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: candidature; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidature (
    id integer NOT NULL,
    nome text NOT NULL,
    contatto text NOT NULL,
    progetto text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    stato text DEFAULT 'nuova'::text NOT NULL
);


--
-- Name: candidature_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.candidature_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: candidature_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.candidature_id_seq OWNED BY public.candidature.id;


--
-- Name: coaching; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coaching (
    id integer NOT NULL,
    hero_titolo text DEFAULT 'PROTOCOLLO COACHING'::text NOT NULL,
    hero_sottotitolo text DEFAULT 'Dimagrimento. Disciplina. Dati.'::text NOT NULL,
    descrizione text DEFAULT ''::text NOT NULL,
    community_cta text DEFAULT 'Entra nella community italiana e trova gente con la tua stessa fame.'::text NOT NULL,
    community_url text DEFAULT '#'::text NOT NULL,
    email text DEFAULT 'contatto@projectj180day.com'::text NOT NULL,
    visibile boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coaching_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coaching_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coaching_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coaching_id_seq OWNED BY public.coaching.id;


--
-- Name: contatti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contatti (
    id integer NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    tipo text NOT NULL,
    messaggio text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    stato text DEFAULT 'nuova'::text NOT NULL
);


--
-- Name: contatti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contatti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contatti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contatti_id_seq OWNED BY public.contatti.id;


--
-- Name: contenuti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contenuti (
    chiave text NOT NULL,
    valore text NOT NULL,
    aggiornato_a timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: giorni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.giorni (
    id integer NOT NULL,
    numero integer NOT NULL,
    data date NOT NULL,
    kcal integer,
    sonno real,
    flessioni integer,
    addominali integer,
    round integer,
    km real,
    peso real,
    battito integer,
    testo text,
    foto text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    entrate real,
    uscite real,
    sintesi text,
    card_titolo text,
    card_sottotitolo text,
    card_immagine text,
    card_overlay integer,
    card_mostra_parole boolean,
    pasti integer,
    alcol boolean,
    acqua real,
    tipo_allenamento text,
    durata real,
    intensita integer,
    tipo_giorno text,
    routine_completata boolean,
    routine_flessioni text,
    routine_trazioni text,
    routine_squat text,
    plank integer,
    collo boolean,
    mobilita boolean,
    sollevamento_gamba text,
    grappling_vuoto boolean,
    energia integer,
    note_allenamento text,
    routine_forza boolean,
    acqua_allenamento real,
    attrito text,
    fatto text,
    non_fatto text,
    card_feed text,
    card_story text
);


--
-- Name: giorni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.giorni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: giorni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.giorni_id_seq OWNED BY public.giorni.id;


--
-- Name: iscritti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iscritti (
    id integer NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iscritti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iscritti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iscritti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iscritti_id_seq OWNED BY public.iscritti.id;


--
-- Name: obiettivi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.obiettivi (
    id integer NOT NULL,
    ciclo integer DEFAULT 1 NOT NULL,
    posizione integer NOT NULL,
    area text NOT NULL,
    titolo text NOT NULL,
    previsto integer NOT NULL,
    giorno_limite integer DEFAULT 180 NOT NULL,
    prova text,
    stato text DEFAULT 'attivo'::text NOT NULL
);


--
-- Name: obiettivi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.obiettivi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: obiettivi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.obiettivi_id_seq OWNED BY public.obiettivi.id;


--
-- Name: pageviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pageviews (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    path text NOT NULL,
    referrer text,
    device text DEFAULT 'desktop'::text NOT NULL,
    country text,
    duration_sec integer,
    scroll_depth integer,
    session_id text,
    closed integer DEFAULT 0 NOT NULL,
    last_seen timestamp with time zone DEFAULT now() NOT NULL,
    view_id text
);


--
-- Name: pageviews_daily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pageviews_daily (
    id integer NOT NULL,
    date date NOT NULL,
    path text NOT NULL,
    device text DEFAULT 'desktop'::text NOT NULL,
    source text DEFAULT 'Diretto'::text NOT NULL,
    country text DEFAULT ''::text NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    duration_sum integer DEFAULT 0 NOT NULL,
    duration_count integer DEFAULT 0 NOT NULL,
    scroll_sum integer DEFAULT 0 NOT NULL,
    scroll_count integer DEFAULT 0 NOT NULL,
    completed_count integer DEFAULT 0 NOT NULL
);


--
-- Name: pageviews_daily_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pageviews_daily_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pageviews_daily_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pageviews_daily_id_seq OWNED BY public.pageviews_daily.id;


--
-- Name: pageviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pageviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pageviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pageviews_id_seq OWNED BY public.pageviews.id;


--
-- Name: pagine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagine (
    id integer NOT NULL,
    slug text NOT NULL,
    titolo text NOT NULL,
    contenuto text DEFAULT ''::text NOT NULL,
    pubblicata boolean DEFAULT false NOT NULL,
    ordine integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pagine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagine_id_seq OWNED BY public.pagine.id;


--
-- Name: planner_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_notes (
    id integer NOT NULL,
    data date,
    tipo text DEFAULT 'daily'::text NOT NULL,
    testo text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: planner_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planner_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: planner_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planner_notes_id_seq OWNED BY public.planner_notes.id;


--
-- Name: social; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social (
    id integer NOT NULL,
    nome text NOT NULL,
    url text NOT NULL,
    icona text DEFAULT 'Instagram'::text NOT NULL,
    descrizione text DEFAULT ''::text NOT NULL,
    ordine integer DEFAULT 0 NOT NULL,
    visibile boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: social_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_id_seq OWNED BY public.social.id;


--
-- Name: sponsor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sponsor (
    id integer NOT NULL,
    nome text NOT NULL,
    descrizione text DEFAULT ''::text NOT NULL,
    url text DEFAULT ''::text NOT NULL,
    logo text,
    livello text DEFAULT 'Bronze'::text NOT NULL,
    ordine integer DEFAULT 0 NOT NULL,
    visibile boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sponsor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sponsor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sponsor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sponsor_id_seq OWNED BY public.sponsor.id;


--
-- Name: tappe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tappe (
    id integer NOT NULL,
    ciclo integer DEFAULT 1 NOT NULL,
    numero integer NOT NULL,
    giorno_inizio integer NOT NULL,
    giorno_fine integer NOT NULL,
    chiusa boolean DEFAULT false NOT NULL,
    nota text
);


--
-- Name: tappe_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tappe_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tappe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tappe_id_seq OWNED BY public.tappe.id;


--
-- Name: task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task (
    id integer NOT NULL,
    obiettivo_id integer NOT NULL,
    tappa_id integer NOT NULL,
    testo text NOT NULL,
    giorno_completato integer,
    saltato boolean DEFAULT false NOT NULL,
    ordine integer DEFAULT 0 NOT NULL
);


--
-- Name: task_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_id_seq OWNED BY public.task.id;


--
-- Name: task_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_templates (
    id integer NOT NULL,
    testo text NOT NULL,
    tipo text DEFAULT 'ALTRO'::text NOT NULL,
    priorita integer DEFAULT 2 NOT NULL,
    ordine integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_templates_id_seq OWNED BY public.task_templates.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    data date NOT NULL,
    testo text NOT NULL,
    tipo text DEFAULT 'ALTRO'::text NOT NULL,
    stato text DEFAULT 'DA FARE'::text NOT NULL,
    priorita integer DEFAULT 2 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ordine integer DEFAULT 0 NOT NULL
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: articoli id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articoli ALTER COLUMN id SET DEFAULT nextval('public.articoli_id_seq'::regclass);


--
-- Name: candidature id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidature ALTER COLUMN id SET DEFAULT nextval('public.candidature_id_seq'::regclass);


--
-- Name: coaching id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching ALTER COLUMN id SET DEFAULT nextval('public.coaching_id_seq'::regclass);


--
-- Name: contatti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contatti ALTER COLUMN id SET DEFAULT nextval('public.contatti_id_seq'::regclass);


--
-- Name: giorni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giorni ALTER COLUMN id SET DEFAULT nextval('public.giorni_id_seq'::regclass);


--
-- Name: iscritti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iscritti ALTER COLUMN id SET DEFAULT nextval('public.iscritti_id_seq'::regclass);


--
-- Name: obiettivi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obiettivi ALTER COLUMN id SET DEFAULT nextval('public.obiettivi_id_seq'::regclass);


--
-- Name: pageviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pageviews ALTER COLUMN id SET DEFAULT nextval('public.pageviews_id_seq'::regclass);


--
-- Name: pageviews_daily id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pageviews_daily ALTER COLUMN id SET DEFAULT nextval('public.pageviews_daily_id_seq'::regclass);


--
-- Name: pagine id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagine ALTER COLUMN id SET DEFAULT nextval('public.pagine_id_seq'::regclass);


--
-- Name: planner_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_notes ALTER COLUMN id SET DEFAULT nextval('public.planner_notes_id_seq'::regclass);


--
-- Name: social id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social ALTER COLUMN id SET DEFAULT nextval('public.social_id_seq'::regclass);


--
-- Name: sponsor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsor ALTER COLUMN id SET DEFAULT nextval('public.sponsor_id_seq'::regclass);


--
-- Name: tappe id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tappe ALTER COLUMN id SET DEFAULT nextval('public.tappe_id_seq'::regclass);


--
-- Name: task id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task ALTER COLUMN id SET DEFAULT nextval('public.task_id_seq'::regclass);


--
-- Name: task_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_templates ALTER COLUMN id SET DEFAULT nextval('public.task_templates_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_sessions (sid, sess, expire) FROM stdin;
sFGTSLAByxMgzTEPZ4KGdOHcCujpYsCx	{"cookie":{"originalMaxAge":604800000,"expires":"2026-10-20T05:19:26.806Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"adminAuthenticated":true}	2026-10-20 05:19:31.262+00
yXXv4w1v05b0B0PwOQx2Z11jH2oPeTCK	{"cookie":{"originalMaxAge":604800000,"expires":"2026-10-20T05:20:14.796Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"adminAuthenticated":true}	2026-10-20 05:20:17.759+00
wQWtzDInpJCV_soPk-IP1Hi9vijf1ENF	{"cookie":{"originalMaxAge":604800000,"expires":"2026-10-20T05:23:54.405Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"adminAuthenticated":true}	2026-10-20 05:24:13.998+00
iuUgQoQhbFz1uI5t07ayT3YrlfNo9oQU	{"cookie":{"originalMaxAge":604800000,"expires":"2026-10-20T05:20:58.253Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"adminAuthenticated":true}	2026-10-20 05:21:13.234+00
\.


--
-- Data for Name: articoli; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articoli (id, slug, titolo, categoria, contenuto, immagine, pubblicato, data, created_at, updated_at, card_titolo, card_sottotitolo, card_immagine, card_overlay, card_mostra_parole) FROM stdin;
4	Stoi	COME SUPERARE LA MORTE	LA FEDE	<h1>La morte non si discute, si guarda</h1>\n\n<p>Il primo funerale a cui vai da adulto ti insegna una cosa sola: il corpo che c'era ieri oggi non c'è. Non c'è filosofia in quel momento. C'è solo l'assenza.</p>\n\n<p>Ho perso un amico e una persona a cui tenevo. Quello che è arrivato dopo non è stato dolore pulito. È stata una malinconia lunga, sporca, che si è mangiata il senso di tutto. Se finisce così, allora niente conta. E se niente conta, tanto vale prendere quello che puoi finché puoi. Nichilismo di mattina, edonismo di sera. Le due facce della stessa moneta vuota.</p>\n\n<h2>Il materialismo non regge il peso</h2>\n\n<p>Il materialismo nichilista è onesto su un punto: la biologia finisce. Ma non ti dice come vivere fino a lì. Ti lascia in mano una verità e nessuno strumento. Ho vissuto mesi con quella verità in tasca e le mani vuote.</p>\n\n<h2>Epicuro: la prima crepa</h2>\n\n<p>Il tetrafarmaco è la prima risposta che ho trovato che non fosse una consolazione. Quattro righe, secche come un protocollo: non temere Dio, non temere la morte, il bene è raggiungibile, il male è sopportabile. E la frase che spacca: la morte non è nulla per noi, perché quando ci siamo noi lei non c'è, e quando c'è lei noi non ci siamo.</p>\n\n<p>È logica pura. Funziona sulla carta. Il problema è che spegne la paura togliendo di mezzo la domanda. Non ti dice cosa fare del tempo che resta. Mi ha tolto il terrore. Non mi ha dato una direzione.</p>\n\n<h2>Marco Aurelio e Seneca: la direzione</h2>\n\n<p>Gli stoici prendono lo stesso fatto e lo girano dall'altra parte. Marco Aurelio non ti dice di non pensarci: ti dice di non disprezzare la morte, ma di accoglierla, perché è una delle cose che la natura vuole. Seneca va più a fondo: per tutta la vita bisogna imparare a morire.</p>\n\n<p>Qui la morte smette di essere un muro e diventa uno strumento di misura. Se ho un tempo finito, ogni ora ha un prezzo. Seneca scrive che tutto ci è stato prestato, solo il tempo è nostro. Da lì ho iniziato a trattare le giornate come si tratta un conto: entrate, uscite, sprechi.</p>\n\n<p>Ma anche qui c'è un limite. Lo stoico accetta. Non spera.</p>\n\n<h2>Il Vangelo: il ribaltamento</h2>\n\n<p>Il chicco di grano che non muore resta solo. Se muore, porta molto frutto. Non è una metafora consolatoria: è la stessa logica dell'allenamento. Nessuna crescita senza rottura. Il Vangelo non spiega la morte, la attraversa.</p>\n\n<h2>I padri del deserto: la pratica quotidiana</h2>\n\n<p>Poi ho trovato la parte operativa. Ai padri del deserto non interessava la teoria: praticavano la memoria della morte, quella che i greci chiamano <em>mnéme thanátou</em>. Sant'Antonio diceva di svegliarsi ogni mattina come se dovesse morire quel giorno. Non per angoscia. Per pulizia. Chi si aspetta di morire oggi non ha tempo di litigare per niente, non ha tempo di rimandare, non ha tempo di mentire.</p>\n\n<p>un anno fa pesavo 130 chili. Oggi 80. Il primo motore non è stata la vanità. È stato capire che stavo spendendo un capitale che non si ricarica.</p>\n\n<p>Non ho vinto la paura della morte. Ho smesso di negoziare con lei.</p>\n\n<p>IC XC NIKA</p>\n\n<ul class="fonti">\n  <li>Epicuro, <em>Lettera a Meneceo</em>; il tetrafarmaco è tramandato da Filodemo di Gadara</li>\n  <li>Marco Aurelio, <em>Colloqui con se stesso</em>, IX, 3</li>\n  <li>Seneca, <em>De brevitate vitae</em>, VII; <em>Epistulae ad Lucilium</em>, 1</li>\n  <li>Vangelo di Giovanni 12, 24</li>\n  <li><em>Detti dei padri del deserto</em> (Apophthegmata Patrum), Antonio il Grande</li>\n  <li>Giovanni Climaco, <em>Scala del Paradiso</em>, gradino VI: "Il ricordo della morte"</li>\n</ul>\n	/objects/uploads/fe490b22-430e-43c0-b3d2-ea1cbc130b8d	t	2026-08-05	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
5	ho-guardato-temptation-island-e-ho-parlato-con-una-ragazza	Ho guardato Temptation Island e ho parlato con una ragazza	LA MENTE	<h1>Ho guardato Temptation Island e ho parlato con una ragazza</h1>\n\n<p>Due episodi. Mi pento di ogni minuto. Il tempo sulla terra è limitato e ne ho buttati quaranta a guardare gente che non sa stare da sola far finta di essere in coppia.</p>\n\n<p>Ma la cosa interessante non è stata lo schermo. È stata la conversazione dopo.</p>\n\n<h2>La tesi</h2>\n\n<p>Una ragazza mi ha detto che la monogamia è stata inventata dall'uomo per tenere intrappolata la donna. Che una donna deve essere libera di cercare altri contatti senza sentirsi in colpa verso chi è venuto prima. Che nessuno dovrebbe essere obbligato a restare con qualcuno solo perché lo ha conosciuto per primo.</p>\n\n<p>Lo diceva con convinzione. Come se fosse una cosa ovvia che finalmente qualcuno aveva il coraggio di dire.</p>\n\n<h2>La domanda che le ho fatto</h2>\n\n<p>Le ho chiesto: se funziona così — se una donna può andare con qualcuno che ritiene meglio perché l'opzione migliore merita una possibilità — allora un uomo che lascia la moglie che invecchia per una più giovane non sta facendo niente di male. Sta applicando la stessa regola. L'opzione migliore merita una possibilità.</p>\n\n<p>Non ha risposto.</p>\n\n<p>Perché la regola funziona solo in una direzione. Quando la giri dall'altra parte diventa crudeltà, abbandono, mancanza di rispetto. Ma il meccanismo è identico.</p>\n\n<h2>Non puoi volere entrambe le cose</h2>\n\n<p>Se restare con qualcuno per dovere è solo pietà, allora ogni matrimonio lungo è pietà. Ogni uomo che resta quando potrebbe andarsene con una più giovane è patetico, non fedele.</p>\n\n<p>Se invece restare è una scelta che ha valore — e ce l'ha — allora vale in entrambe le direzioni. Non puoi chiamarla libertà quando esci tu e crudeltà quando esce l'altro.</p>\n\n<p>O la monogamia è una trappola per tutti e due, o è un accordo per tutti e due. Non è una trappola per te e un dovere per lui.</p>\n\n<h2>Quello che stanno vendendo</h2>\n\n<p>Quello che vedo non è liberazione. È ipergamia venduta come emancipazione.</p>\n\n<p>La libertà sessuale non è il problema. Il problema è quando la travesti da progresso per giustificare una cosa che esiste da sempre: cercare di meglio tenendo il vecchio come rete di sicurezza. Quello non è libertà. È assicurazione.</p>\n\n<p>Temptation Island non è un programma sui sentimenti. È un manuale su come normalizzare il fatto che un accordo si rompe quando una delle due parti trova qualcosa di più comodo. E lo guardano milioni di persone pensando che sia intrattenimento.</p>\n\n<h2>Cosa penso davvero</h2>\n\n<p>Non ho la competenza per parlare di donne. Parlo da uomo, di uomini.</p>\n\n<p>Un uomo che resta con una donna perché ha dato la parola non resta per pietà. Resta perché la parola data è l'unica cosa che ha. Se la parola non tiene quando arriva qualcosa di meglio, non era una parola. Era un'intenzione.</p>\n\n<p>E le intenzioni non costano niente. Per quello ne hanno tutti.</p>\n\n<p>La monogamia non è una trappola. È la cosa più difficile che due persone possano fare insieme. Ed è difficile per tutti e due, non per uno solo.</p>\n\n<p>IC XC NIKA</p>\n	\N	t	2026-08-11	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
9	impara-a-essere-pericoloso	IMPARA A ESSERE PERICOLOSO	IL CORPO	<h1>Il pacifico e l'innocuo non sono la stessa cosa</h1>\n\n<p>Un uomo che non ha mai imparato a fare male a nessuno non è pacifico. È solo innocuo. La differenza è enorme e si vede una volta sola nella vita, di solito nel momento peggiore.</p>\n\n<p>L'innocuo non fa del male perché non sa come si fa. La sua bontà non è una scelta: è una mancanza di opzioni. Il pacifico invece sa esattamente cosa può fare, e sceglie di non farlo. La stessa condotta esteriore, due uomini opposti. Il primo scoprirà chi è nel momento in cui servirà, e sarà tardi.</p>\n\n<h2>Il male parla una lingua sola</h2>\n\n<p>Puoi discutere con un uomo ragionevole. Puoi trattare con un uomo interessato. Ma chi è entrato in casa tua alle tre di notte non è né ragionevole né interessato a trattare: ha già deciso, e ha deciso partendo dal presupposto che tu non possa fermarlo.</p>\n\n<p>C'è una sola lingua che ogni uomo capisce senza traduzione, senza cultura, senza educazione. È il dolore. È l'unica grammatica che nessuno deve imparare, perché la conosciamo prima delle parole. Chi usa la violenza per prendere si aspetta di incontrare solo persone che quella lingua non la parlano. È su questa aspettativa che si regge tutto il suo mestiere.</p>\n\n<p>Il momento in cui scopre di avere davanti qualcuno che la parla è il momento in cui la sua matematica salta.</p>\n\n<h2>L'aiuto arriva dopo</h2>\n\n<p>La polizia arriva. Arriva sempre. Arriva in otto minuti, in dodici, in venti, e fa il suo lavoro con serietà. Ma quello che succede in una stanza succede in undici secondi. Il resto è la ricostruzione dei fatti.</p>\n\n<p>Questo non è un attacco a nessuno. È aritmetica. Nessuno può essere ovunque. Il primo soccorritore in qualunque emergenza è sempre la persona che è già lì. Quella persona sei tu, e nessuno ti ha chiesto se eri pronto.</p>\n\n<h2>Dio non si distrae</h2>\n\n<p>Si dice che in certi momenti Dio non guardi. Non credo sia così, ed è una scusa comoda.</p>\n\n<p>La tradizione dei padri parla di sinergia: Dio non fa al posto tuo, fa insieme a te. La grazia non sostituisce la mano, muove la mano che c'è. Se in quella stanza non c'è nessuno capace di fermare quello che sta succedendo, non è che Dio si è voltato. È che nessuno si era preparato a essere lo strumento.</p>\n\n<p>La preghiera che chiede protezione senza fare niente per esserne capace non è fede. È delega.</p>\n\n<h2>Capacità superiore, vincolo superiore</h2>\n\n<p>Qui sta il punto che rovina tutto se lo si sbaglia.</p>\n\n<p>Chi protegge deve essere più capace di violenza di chi aggredisce. Se è meno capace, non protegge niente: fa da vittima con più coraggio, che è solo una vittima più lenta a cadere. Su questo non c'è dibattito, è la struttura del problema.</p>\n\n<p>Ma la capacità superiore da sola non fa un protettore. Un uomo buono più feroce del cattivo, senza freno, non è un uomo buono con un vantaggio. È un cattivo con una giustificazione migliore, che è la categoria peggiore che esista, perché non si vede arrivare.</p>\n\n<p>Quello che separa i due non è la potenza. È il vincolo. Quando si comincia, quando si smette, per cosa, e la capacità di fermarsi nell'esatto secondo in cui la minaccia finisce, che è la cosa più difficile di tutte. La ferocia si allena in due anni. Il freno si allena per tutta la vita, e si allena da sobri, da lucidi, quando nessuno ti sta minacciando.</p>\n\n<h2>Per questo si va in palestra</h2>\n\n<p>Il tatami è il posto dove impari entrambe le cose insieme. Impari a fare male, e nella stessa ora impari a lasciare la presa quando l'altro batte. Nessun libro te lo insegna. Nessuna intenzione buona te lo sostituisce.</p>\n\n<p>Chi non ha mai combattuto crede che il pericolo sia diventare violento. Chi combatte da un po' sa che succede il contrario: più diventi capace, meno hai bisogno di dimostrarlo. La calma vera non viene dalla bontà. Viene dal sapere.</p>\n\n<p>Il mondo non si difende con le buone intenzioni. Si difende con uomini capaci di cose terribili che hanno deciso di non farle.</p>\n\n<p>Impara a essere pericoloso. Poi passa la vita a non esserlo.</p>\n\n<p>IC XC NIKA</p>\n\n<ul class="fonti">\n  <li>Aristotele, <em>Etica Nicomachea</em>, III — il coraggio come medio tra viltà e temerarietà</li>\n  <li>Tommaso d'Aquino, <em>Summa Theologiae</em>, II-II, q. 64 a. 7 — la legittima difesa e il duplice effetto</li>\n  <li>Sulla sinergia tra grazia e volontà umana: tradizione patristica greca, in particolare Massimo il Confessore</li>\n</ul>\n	/objects/uploads/bb83d69d-387b-44fb-8aa6-e18eae84f15b	t	2026-08-06	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
10	la-droga-dell-illusione	LA DROGA DELL’ ILLUSIONE	LA MENTE	<h1>La droga dell'illusione</h1>\n\n<p>Non conosco nessuno che si sia rovinato la vita con l'erba. È esattamente il problema.</p>\n\n<h2>Non parlo per teoria</h2>\n\n<p>Ho passato degli anni in cui non succedeva niente. Nessun crollo, nessun avviso, nessuno preoccupato. Mi alzavo, facevo le mie cose, tornavo, fumavo. Il giorno dopo uguale. Quegli anni non li so raccontare, perché non ci sono dentro fatti da raccontare.</p>\n\n<p>Poi ho conosciuto altre cose, e quelle il conto lo hanno presentato in fretta. Su quello che è successo lì non scrivo. Ma so cosa significa che la realtà entri in una stanza e non se ne vada più finché non rispondi.</p>\n\n<p>La differenza tra le due stagioni non è quale fosse più grave. È che una mi ha costretto. L'altra mi avrebbe lasciato lì per quindici anni.</p>\n\n<h2>Non stai facendo niente di male</h2>\n\n<p>Chi si brucia in fretta arriva a un punto in cui non può più raccontarsela. È brutale, ma è leggibile: succede un fatto, e il fatto pretende una risposta. Chi non tocca mai quel punto non risponde mai a niente.</p>\n\n<p>L'erba ti lascia in piedi. Vai al lavoro, paghi l'affitto, non rubi niente a nessuno. Nessuno ti dice niente perché oggettivamente non stai facendo niente di male.</p>\n\n<p>È vero. Non stai facendo niente di male. Non stai facendo niente.</p>\n\n<h2>La sensazione è il danno</h2>\n\n<p>C'è un rapper americano che ha detto la cosa più precisa che ho sentito su questa roba: è la droga che ti fa sentire come se avessi fatto qualcosa di buono. Giornata intera tra divano, PlayStation e cibo, e ti alzi con la sensazione di aver concluso.</p>\n\n<p>Quella sensazione è il danno. Non i polmoni, non la memoria, non le statistiche che ti tirano dietro a scuola. La sensazione di aver vissuto una giornata piena quando non hai vissuto niente.</p>\n\n<h2>Il potenziale non fa rumore quando se ne va</h2>\n\n<p>Chi perde soldi, casa, lavoro, persone, perde cose che si contano. Sono perdite che fanno rumore e obbligano a una decisione.</p>\n\n<p>Con l'erba non perdi niente di contabile. Perdi solo tutto quello che avresti potuto fare. E il potenziale non ti manda un preavviso, non ti fa finire in ospedale, non ti fa chiedere soldi in prestito alle due di notte. Si scarica in silenzio, un pomeriggio alla volta, per anni. Poi hai trentacinque anni, la stessa stanza, la stessa paga, gli stessi discorsi, e non riesci a indicare il giorno in cui è andata storta. Perché non è andata storta in un giorno.</p>\n\n<p>La chiamo droga dell'illusione per questo. Non ti illude di stare bene. Ti illude che non ci sia niente da cui uscire.</p>\n\n<h2>Serve qualcosa che ti costringa</h2>\n\n<p>Ogni persona che conosco che ha cambiato qualcosa di serio l'ha fatto dopo un momento in cui la realtà è diventata insostenibile. Non dopo un buon consiglio. Non dopo aver letto qualcosa.</p>\n\n<p>Il fondo non è una punizione. È l'unica informazione che il corpo accetta davvero.</p>\n\n<p>Non sto dicendo che sia meglio farsi di cose peggiori — chi lo pensa non ha idea di cosa stia dicendo, e c'è gente che non è tornata indietro a raccontarlo. Sto dicendo il contrario: la sostanza che non ti fa mai sbattere è quella che ha più tempo per prendersi tutto, e se lo prende senza che nessuno alzi la voce.</p>\n\n<h2>Adesso</h2>\n\n<p>Peso 81 chili e mi sveglio alle cinque. Due anni fa ne pesavo 130 e avevo trovato un modo per stare male senza mai stare abbastanza male da dover fare qualcosa.</p>\n\n<p>Non ho paura di una notte storta. Ho paura di una stagione tranquilla.</p>\n\n<p>La domanda non è se l'erba fa male. È quanti anni sei disposto a stare a galla prima che qualcosa ti costringa a guardarti.</p>\n\n<p>IC XC NIKA</p>\n	/objects/uploads/fe4941cf-7c6f-44ba-b6d8-a0ff427c8d14	t	2026-08-05	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
11	non-mi-sono-fermato	NON MI SONO FERMATO 	LA FEDE	<h1>Non mi sono fermato</h1>\n\n<p>Un anno fa la mia vita era finita e non lo sapevo ancora. Centotrenta chili. Dipendente. Nessun lavoro, nessun corpo, nessuna direzione. Un muro da fissare e un calendario da guardare passare.</p>\n\n<p>Non scrivo questo per farmi compatire. Lo scrivo perché se sei nella posizione in cui ero io, devi sapere una cosa: il punto più basso non è una condanna. È un indirizzo. Ci stai, oppure te ne vai.</p>\n\n<h2>Quello che ho fatto in un anno</h2>\n\n<p>Ho smesso di colpo. Senza clinica, senza scalare, senza nessuno che mi dicesse come si fa. Su quello che è successo lì non scrivo — chi c'è passato sa, chi non c'è passato non può capire da un articolo.</p>\n\n<p>Ho perso cinquanta chili. Non con un programma, non con un coach, non con un piano. Con la sveglia alle cinque, la bilancia ogni mattina, e la scelta di non mentirmi più.</p>\n\n<p>Ho trovato un lavoro. Salgo sui tralicci a trenta metri da terra e monto antenne. Il weekend faccio detailing su camion e macchine, per conto mio, con i miei soldi. Ho portato la mia famiglia dall'altra parte dell'Europa. Ho fatto sparring con un fighter professionista in un paese dove non conoscevo nessuno.</p>\n\n<p>E ho aperto tutto al pubblico. Peso, battito, sonno, soldi — ogni giorno, anche quando fanno schifo. Perché se lo tengo solo nei giorni puliti non serve a niente.</p>\n\n<h2>Non sono fiero di essere disciplinato</h2>\n\n<p>Sono fiero di non essermi fermato.</p>\n\n<p>La disciplina è la cosa che tutti vedono e che tutti vogliono copiare. Ma la disciplina non è il motore. Il motore è quello che c'era prima — il muro, il calendario, il tempo perso da ragazzino nella droga, nell'alcool, nelle cose che non servono a niente. Quella roba non mi è mai uscita dalla testa. Non credo che mi uscirà mai.</p>\n\n<p>Dove ero prima ho pregato per tutto questo. Quando non potevo fare niente, quando non potevo andare in giro, quando perdevo il tempo a fissare un muro. Ho pregato per avere un corpo che funziona, un lavoro, una giornata piena. Adesso ce l'ho e non mi basta. Non mi basterà mai. Probabilmente è un dono. Probabilmente è una condanna. Probabilmente sono la stessa cosa.</p>\n\n<h2>Ho più problemi che talenti</h2>\n\n<p>Non sono capace di divertirmi. Non lo riesco a concepire — passare del tempo cazzeggiando. Mi sembra di perdere tempo. Non ci riesco a meno che non delego alle sostanze il mio benessere. Altrimenti in due ore mi annoio.</p>\n\n<p>Non sono capace di dormire più di sei ore senza sentirmi in colpa. Non sono capace di saltare un allenamento senza stare male. Non sono capace di essere felice delle piccole cose, e quelle grandi le banalizzo.</p>\n\n<p>Questo bisogno di fare sempre qualcosa ha rischiato di bruciarmi relazioni importanti con chi amo. Distruggere la mia salute. Niente in questo mondo viene senza il male. Il male non viene mai senza il bene.</p>\n\n<h2>Guardati intorno</h2>\n\n<p>A ventun anni la maggior parte dei ragazzi non ha mai emesso una fattura. Non ha mai pubblicato niente con il proprio nome sopra. Non ha mai messo piede in una palestra con l'intenzione di combattere. Non ha mai ammesso in pubblico le cose che io scrivo ogni giorno.</p>\n\n<p>Non lo dico per giudicarli. Lo dico perché ci sono stato. So cosa significa passare le giornate a non fare niente e sentirsi come se avessi fatto qualcosa. So cosa significa svegliarsi a mezzogiorno e andare a dormire senza aver spostato niente. È la trappola più silenziosa che esista e nessuno te la fa vedere perché chi ci sta dentro ha bisogno di credere che vada bene così.</p>\n\n<h2>La cosa che nessuno ti dice</h2>\n\n<p>Nessuno ti dice che ce la puoi fare partendo dal punto in cui stai. Ti dicono che ti serve un piano, un coach, un mentor, una svolta. Ti dicono che prima devi capire cosa vuoi. Ti dicono che prima devi stare bene.</p>\n\n<p>Io non avevo niente di tutto questo. Non sapevo cosa volevo. Non stavo bene. Non avevo un piano. Avevo solo la certezza che dove stavo non ci potevo restare.</p>\n\n<p>A volte basta quello. Non sapere dove andare, ma sapere che lì non si resta.</p>\n\n<h2>A novembre salgo in gabbia</h2>\n\n<p>Non sono pronto. Lo so. Ma nessuno è mai stato pronto il giorno in cui ha deciso.</p>\n\n<p>Poi la Thailandia. Poi il Daghestan. Poi il resto. Me lo pago da solo, con le ferie che ho e i soldi che guadagno salendo sui tralicci.</p>\n\n<p>Se sei qui dal giorno zero, sai da dove sono partito. Se sei arrivato adesso, i dati sono tutti lì — pubblici, ogni giorno, anche quelli di merda.</p>\n\n<p>Non mi sono fermato. Non perché sono forte. Perché fermarmi mi fa più paura di qualsiasi cosa mi aspetti davanti.</p>\n\n<p>Che Dio possa proteggerti.</p>\n\n<p>IC XC NIKA</p>	\N	t	2026-08-14	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
6	identira-liquida	IDENTIRA LIQUIDA	LA MENTE	<h1>Sei acqua</h1>\n\n<p>L'acqua non ha una forma sua. Prendi lo stesso identico litro e mettilo in un bicchiere: diventa il bicchiere. Mettilo in una bottiglia: diventa la bottiglia. Versalo per terra: diventa una pozza che va dove pende il pavimento.</p>\n\n<p>Non cambia la sostanza. Cambia solo cosa la contiene.</p>\n\n<h2>Nessuno sceglie di essere una pozza</h2>\n\n<p>Qui c'è la parte che di solito si salta. Se non costruisci tu il contenitore, non è che resti senza forma. Il contenitore lo costruisce qualcun altro: la casa in cui stai, le persone che frequenti, il divano, la routine che non hai scelto ma che hai accettato. L'acqua non discute. Prende la forma di quello che trova e non se ne accorge.</p>\n\n<p>Nessuno decide di diventare quello che passa i pomeriggi a fare niente. Semplicemente nessuno ha mai costruito un contenitore diverso, e la stanza ne aveva già uno pronto.</p>\n\n<h2>Lo stato dipende dall'energia, non dalle intenzioni</h2>\n\n<p>L'acqua ha tre stati e non li sceglie. Sotto zero è ghiaccio: duro, fermo, tiene una forma anche fuori dal contenitore. A temperatura normale è liquida: si adatta a tutto, non oppone resistenza a niente. Sopra i cento è vapore: si espande ovunque, occupa tutto lo spazio, e non pesa più niente.</p>\n\n<p>Quello che determina lo stato è una cosa sola: quanta energia c'è dentro. Non l'intenzione dell'acqua. Non quello che l'acqua pensa di sé.</p>\n\n<p>È esattamente il punto. Puoi ripeterti tutti i giorni che sei disciplinato. Se l'energia che ci metti è quella di sempre, resti liquido, e prendi la forma di qualunque stanza ti capiti. Lo stato non si dichiara. Si misura.</p>\n\n<h2>Il mismatch</h2>\n\n<p>C'è una distanza tra come uno si descrive e come uno si comporta, e quella distanza è la cosa più dolorosa da guardare che conosca.</p>\n\n<p>Uno si dice fighter e si allena due volte al mese. Uno si dice imprenditore e non ha mai emesso una fattura. Uno si dice studente e non apre un libro da marzo. Nessuno di questi sta mentendo agli altri per convenienza. Ci credono. È peggio.</p>\n\n<p>Perché finché la storia che ti racconti regge, non hai nessun motivo di cambiare niente. La bugia funziona come anestetico: non risolve, ma toglie il dolore che ti servirebbe per muoverti.</p>\n\n<h2>Il contenitore sono le azioni</h2>\n\n<p>Non esiste un modo di sapere chi sei che non passi da quello che fai. L'identità non è quello che dichiari, è la forma che le tue giornate hanno preso.</p>\n\n<p>Ed è una buona notizia, non una condanna. Perché un contenitore si può costruire. Le sveglie, gli orari, le persone che frequenti, il posto dove passi le sere, quello che tieni in casa e quello che non tieni. Sono pareti. Metti le pareti e l'acqua prende quella forma, che tu ci creda o no.</p>\n\n<p>Io peso 81 chili e mi sveglio alle cinque. Non perché sia diventato un altro. Perché ho cambiato il contenitore, e l'acqua ha fatto quello che l'acqua fa sempre.</p>\n\n<p>Smetti di dire chi sei. Guarda che forma hai preso.</p>\n\n<p>IC XC NIKA</p>\n	\N	t	2026-08-06	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
7	identita-liquida	IDENTITÀ LIQUIDA	LA MENTE	<h1>Sei acqua</h1>\n\n<p>L'acqua non ha una forma sua. Prendi lo stesso identico litro e mettilo in un bicchiere: diventa il bicchiere. Mettilo in una bottiglia: diventa la bottiglia. Versalo per terra: diventa una pozza che va dove pende il pavimento.</p>\n\n<p>Non cambia la sostanza. Cambia solo cosa la contiene.</p>\n\n<h2>Nessuno sceglie di essere una pozza</h2>\n\n<p>Qui c'è la parte che di solito si salta. Se non costruisci tu il contenitore, non è che resti senza forma. Il contenitore lo costruisce qualcun altro: la casa in cui stai, le persone che frequenti, il divano, la routine che non hai scelto ma che hai accettato. L'acqua non discute. Prende la forma di quello che trova e non se ne accorge.</p>\n\n<p>Nessuno decide di diventare quello che passa i pomeriggi a fare niente. Semplicemente nessuno ha mai costruito un contenitore diverso, e la stanza ne aveva già uno pronto.</p>\n\n<h2>Lo stato dipende dall'energia, non dalle intenzioni</h2>\n\n<p>L'acqua ha tre stati e non li sceglie. Sotto zero è ghiaccio: duro, fermo, tiene una forma anche fuori dal contenitore. A temperatura normale è liquida: si adatta a tutto, non oppone resistenza a niente. Sopra i cento è vapore: si espande ovunque, occupa tutto lo spazio, e non pesa più niente.</p>\n\n<p>Quello che determina lo stato è una cosa sola: quanta energia c'è dentro. Non l'intenzione dell'acqua. Non quello che l'acqua pensa di sé.</p>\n\n<p>È esattamente il punto. Puoi ripeterti tutti i giorni che sei disciplinato. Se l'energia che ci metti è quella di sempre, resti liquido, e prendi la forma di qualunque stanza ti capiti. Lo stato non si dichiara. Si misura.</p>\n\n<h2>Il mismatch</h2>\n\n<p>C'è una distanza tra come uno si descrive e come uno si comporta, e quella distanza è la cosa più dolorosa da guardare che conosca.</p>\n\n<p>Uno si dice fighter e si allena due volte al mese. Uno si dice imprenditore e non ha mai emesso una fattura. Uno si dice studente e non apre un libro da marzo. Nessuno di questi sta mentendo agli altri per convenienza. Ci credono. È peggio.</p>\n\n<p>Perché finché la storia che ti racconti regge, non hai nessun motivo di cambiare niente. La bugia funziona come anestetico: non risolve, ma toglie il dolore che ti servirebbe per muoverti.</p>\n\n<h2>Il contenitore sono le azioni</h2>\n\n<p>Non esiste un modo di sapere chi sei che non passi da quello che fai. L'identità non è quello che dichiari, è la forma che le tue giornate hanno preso.</p>\n\n<p>Ed è una buona notizia, non una condanna. Perché un contenitore si può costruire. Le sveglie, gli orari, le persone che frequenti, il posto dove passi le sere, quello che tieni in casa e quello che non tieni. Sono pareti. Metti le pareti e l'acqua prende quella forma, che tu ci creda o no.</p>\n\n<p>Io peso 81 chili e mi sveglio alle cinque. Non perché sia diventato un altro. Perché ho cambiato il contenitore, e l'acqua ha fatto quello che l'acqua fa sempre.</p>\n\n<p>Smetti di dire chi sei. Guarda che forma hai preso.</p>\n\n<p>IC XC NIKA</p>\n	\N	f	2026-08-06	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
8	il-colpo-piu-debole-vince-i-combattimenti	IL COLPO PIÙ DEBOLE VINCE I COMBATTIMENTI	IL CORPO	\n\nIl primo giorno che sono entrato in palestra cercavo il colpo che spegne la luce. Tutti lo cerchiamo. Il montante che ribalta, il gancio che fa girare la testa, il calcio che finisce nelle clip che guardi la sera. E intanto, round dopo round, prendevo jab in faccia senza capire perché stavo perdendo contro gente che sembrava fare meno di me.\n\nIl jab non fa male. È il colpo più leggero che hai nell’arsenale. Ed è esattamente per questo che lo sottovaluti — e per questo ti frega ogni volta.\n\nLascia che ti spieghi perché il colpo più debole è quello che decide chi vince.\n\nIl jab è il colpo più vicino al bersaglio. Parte dalla mano avanzata e viaggia in linea retta, la distanza più breve possibile. Questo lo rende il colpo più veloce che esista: arriva prima che il tuo occhio lo veda partire. Non deve ferirti. Deve arrivare. E arriva sempre.\n\nMa la velocità è solo la metà. Il vero lavoro del jab è quello che nessuno vede.\n\nMisura la distanza. Ogni volta che lo tiri, stai leggendo esattamente quanto sei lontano dall’avversario — è il tuo metro, il tuo radar. Interrompe il pensiero. Un jab in faccia, anche leggero, resetta quello che l’altro stava per fare: non puoi costruire un attacco mentre qualcosa continua a toccarti il viso. E apre la strada. Il colpo pesante che sogni non arriva mai da solo — arriva dietro un jab che ha creato lo spazio, distratto la guardia, spostato l’attenzione.\n\nIl jab è un esploratore, non un cecchino. Prepara il terreno perché qualcun altro faccia il lavoro sporco.\n\nGuarda ogni grande fighter della storia. Non sono costruiti sul KO. Sono costruiti sul jab. Il KO è la conseguenza, non la causa. È l’ultima tessera di una sequenza che il jab ha iniziato tre secondi prima.\n\nEd è qui che il combattimento smette di parlare solo di combattimento.\n\nI fondamentali sembrano noiosi. Il jab, il footwork, la guardia, il respiro — roba che non fa spettacolo, che nessuno filma, che non prende like. Per questo la gente li salta e va a cercare la tecnica speciale, la mossa segreta, la scorciatoia. E per questo la gente perde. Non solo sul ring.\n\nNel lavoro, nel corpo, nella vita: tutti cercano il colpo che chiude tutto in un momento. Il colpo di fortuna, l’occasione, la svolta. E intanto trascurano le mille ripetizioni piccole e leggere che costruiscono davvero qualcosa.\n\nSmetti di cercare il KO. Impara a piazzare il jab mille volte, finché esce senza pensarci. Il colpo che chiude arriva dopo — sulla strada che i fondamentali hanno aperto	/objects/uploads/7dc8811c-d6fe-4adc-8fc0-018f9bb42020	t	2026-08-04	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
12	non-sei-chi-sei	NON SEI CHI SEI 	LA MENTE	<h1>Non sono niente di quello che dico di essere</h1>\n\n<p>Se mi chiedi cosa faccio ti do una risposta breve. Elettricista. Fighter. Detailing. Content. Sono tutte vere e non sono io.</p>\n\n<p>Sono etichette che servono per andare avanti nella conversazione. Il problema comincia quando smetto di usarle per rispondere agli altri e comincio a usarle per rispondere a me stesso.</p>\n\n<h2>Il corpo non ti aspetta</h2>\n\n<p>C'è un dato che mi ha cambiato il modo di guardare la faccenda. In un lavoro del 2021 pubblicato su PNAS, Sender e Milo hanno stimato che nel corpo di un uomo adulto vengano sostituite circa 330 miliardi di cellule al giorno, quasi l'uno per cento del totale. Ogni giorno. Mentre dormi, mentre lavori, mentre pensi di essere una cosa sola.</p>\n\n<p>Il sangue si rinnova, la pelle si rinnova, l'intestino si rifà quasi da capo ogni settimana. Il materiale con cui pensavi di essere fatto non è lo stesso di un anno fa.</p>\n\n<p>Sul cervello la scienza litiga ancora. Un gruppo di ricercatori sostiene di aver trovato neuroni nuovi nell'ippocampo anche in persone anziane. Un altro gruppo, nello stesso anno, sostiene che dopo l'infanzia non se ne formino praticamente più. La disputa è aperta e chi ti dice il contrario sta semplificando.</p>\n\n<p>Ma su una cosa nessuno litiga: le connessioni cambiano. Ogni cosa che ripeti rinforza una strada, ogni cosa che smetti di fare ne lascia una a seccarsi. Il cervello non conserva chi sei. Registra cosa fai.</p>\n\n<h2>L'etichetta è comoda perché ti solleva</h2>\n\n<p>Dire "io sono un fighter" sembra un impegno. In realtà è il contrario: è un modo per aver già vinto. Se sono un fighter, allora la settimana che salto è un'eccezione, non un dato. L'identità dichiarata assorbe i fallimenti e li rende irrilevanti.</p>\n\n<p>Funziona anche al negativo, ed è lì che diventa pericolosa davvero. Uno che si dice pigro ha un alibi permanente. Uno che si dice sfortunato non deve provare più niente. Chi si dice tossico ha già smesso di doversi giustificare, ed è la cosa che lo tiene lì più della sostanza stessa.</p>\n\n<p>L'etichetta è un posto dove appoggiarsi. Per questo la gente ci si aggrappa proprio nei momenti in cui dovrebbe muoversi.</p>\n\n<h2>Tra tre anni potrei essere un'altra cosa</h2>\n\n<p>Non lo dico per posa. Tra tre anni potrei aver mollato tutto e essere entrato in monastero. Potrei fare un lavoro che oggi non so nemmeno nominare. Potrei anche essere finito male: quella strada non si chiude mai, resta aperta esattamente come le altre, e chi dice di averla superata per sempre non ha capito come funziona.</p>\n\n<p>Il punto non è che tutto è possibile. Il punto è che nessuna di queste cose è già decisa, in nessuna direzione. Non sono salvo perché mi alzo alle cinque adesso. Non ero perduto quando pesavo 130 chili. Ero un uomo che stava facendo certe cose, e adesso sono un uomo che ne fa altre.</p>\n\n<h2>Divenire non vuol dire essere trascinati</h2>\n\n<p>C'è un errore facile qui, e voglio dirlo chiaro perché è quello che rende la questione seria invece che consolatoria.</p>\n\n<p>Se cambio comunque, uno potrebbe concluderne che tanto vale lasciarsi portare. È falso. Il cambiamento è garantito, la direzione no. Le cellule si rifanno da sole, le connessioni si riscrivono da sole, l'acqua prende la forma del contenitore da sola. Quello che non succede da solo è la scelta di che forma dargli.</p>\n\n<p>La tradizione ortodossa ha una parola per questo processo, e non è una parola morbida. La <em>metánoia</em> non è il pentimento inteso come rimorso: è il cambiamento della mente, un giro di centottanta gradi. Non un evento, uno stato permanente. I padri non parlavano mai di uomini arrivati. Parlavano di uomini che ricominciano ogni mattina, e i più vecchi lo dicevano dei più vecchi.</p>\n\n<p>Nessuno è mai finito. È la parte spaventosa e anche l'unica ragione per cui vale la pena provarci.</p>\n\n<h2>Quello che resta</h2>\n\n<p>Se tutto si rinnova, se le etichette non tengono, se tra tre anni potrei essere irriconoscibile, cosa resta a fare da centro?</p>\n\n<p>Non un mestiere. Non un corpo, che è cambiato due volte da quando ho memoria. Resta una cosa sola, ed è quella che ogni mattina decide dove va la giornata.</p>\n\n<p>Non sono un fighter. Non sono un elettricista. Sono uno che questa mattina ha scelto, e domani mattina dovrà scegliere di nuovo, e non ha nessun credito accumulato che gli permetta di saltare il turno.</p>\n\n<p>Non chiederti chi sei. Chiediti cosa stai per fare.</p>\n\n<p>IC XC NIKA</p>\n\n<ul class="fonti">\n  <li>Sender R., Milo R., <em>The distribution of cellular turnover in the human body</em>, Nature Medicine / PNAS, 2021 — stima del ricambio cellulare giornaliero</li>\n  <li>Boldrini M. et al., <em>Human Hippocampal Neurogenesis Persists throughout Aging</em>, Cell Stem Cell, 2018</li>\n  <li>Sorrells S.F. et al., <em>Human hippocampal neurogenesis drops sharply in children to undetectable levels in adults</em>, Nature, 2018</li>\n  <li>Sul concetto di <em>metánoia</em> e sul ricominciare quotidiano: tradizione ascetica greca, <em>Apophthegmata Patrum</em></li>\n</ul>\n	/objects/uploads/445b92d9-9cf3-4257-a960-0513dc960360	t	2026-08-06	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
13	non-ti-pentirai-mai-di-essere-lucido	Non ti pentirai mai di essere LUCIDO	LA MENTE	<h1>Non ti pentirai mai di essere lucido</h1>\n\n<p>Ieri sera ero a casa di un'amica a Minsk. Shisha, bottiglie, gente. Mi sono svegliato alle sei di sera del giorno dopo a camminare per una città che non riconoscevo, senza sapere dove stavo andando. Ho buttato una giornata intera in un paese dove resterò tre settimane.</p>\n\n<p>E stamattina ho preso una decisione.</p>\n\n<h2>Il conto della sera prima</h2>\n\n<p>Qualsiasi serata. Qualsiasi posto. Qualsiasi gente. Se eri lucido, la mattina dopo non hai niente da ricostruire. Non ti svegli con i postumi. Non ti svegli a chiederti cosa hai detto. Non ti svegli con il corpo che ti dice che gli hai tolto qualcosa e non sa quando glielo ridai.</p>\n\n<p>Da otto mesi mi sveglio alle cinque. Ieri mi sono svegliato alle sei di sera. Sono ventitré ore di differenza e non le recupero.</p>\n\n<h2>Pensa a una serata bella</h2>\n\n<p>Se eri lucido te la ricordi intera. Le facce, le parole, il momento esatto in cui hai riso per qualcosa di vero.</p>\n\n<p>Se non eri lucido te ne ricordi pezzi. Era bella davvero o era il filtro a renderla bella? Non lo saprai mai, perché eri altrove mentre succedeva.</p>\n\n<p>Una serata di merda da lucido la capisci e domani sai cosa fare. Una serata di merda da ubriaco è tempo perso due volte: la prima mentre la vivevi, la seconda il giorno dopo mentre cercavi di metterla insieme.</p>\n\n<h2>Non è il divertimento il problema</h2>\n\n<p>Ti dicono che non sai divertirti. Che sei noioso. Che devi rilassarti.</p>\n\n<p>La domanda non è se ti stai divertendo. È se riesci a farlo senza qualcosa di esterno. Perché se la risposta è no, non ti stai divertendo. Stai pagando per sembrare uno che si diverte. Poi l'effetto finisce e quello che resta sei tu, meno lucido, meno presente, meno capace di quello che eri dodici ore prima.</p>\n\n<p>La persona che vorresti essere guardando indietro tra dieci anni non è quella che ha bisogno di qualcosa per stare bene in una stanza. È quella che ci sta bene da sola.</p>\n\n<h2>Il tempo non si ricarica</h2>\n\n<p>Ho un numero limitato di mattine a Minsk. Ne ho buttata una ieri. Mentre dormivo fino alle sei di sera, fuori c'era un mercato che volevo vedere, un allenamento che dovevo fare, un articolo che dovevo scrivere. Niente di tutto questo è successo perché avevo deciso che la sera prima valeva di più.</p>\n\n<p>Non valeva di più. Non me la ricordo nemmeno tutta.</p>\n\n<p>Funziona così anche quando non sei in viaggio. Hai un numero limitato di mattine e basta. Ogni mattina che ti svegli a metà servizio è una mattina che hai regalato alla sera prima, e la sera prima non te la restituisce.</p>\n\n<h2>Lo so perché ci sono stato dentro</h2>\n\n<p>Ho passato anni a svegliarmi senza sapere quanto della notte prima fosse reale. A ricostruire conversazioni. A dire che mi ero divertito perché l'alternativa era ammettere che avevo sprecato un'altra notte.</p>\n\n<p>Adesso mi sveglio e la prima cosa che sento è che sono intero. Tutto quello che ho — la testa, il corpo, la giornata — è disponibile. Nessun pezzo mancante. Non è spettacolare. È solo che funziona.</p>\n\n<p>Da oggi, se faccio serata, la faccio lucido. Non per virtù. Perché ho visto entrambe le versioni e so quale delle due si pente la mattina dopo.</p>\n\n<p>IC XC NIKA</p>\n	/objects/uploads/ed8bf578-eb87-448c-871c-a42e7342b04e	t	2026-08-12	2026-08-18 00:26:57.212926+00	2026-08-18 00:26:57.212926+00	\N	\N	\N	\N	\N
14	non-tutti-hanno-diritto-di-parlarti	NON TUTTI HANNO DIRITTO DI PARLARTI	LA MENTE	\n\n<p>Un tizio che non si allena da sei anni mi ha spiegato che il mio metodo di allenamento è sbagliato. Uno che non ha mai emesso una fattura mi ha detto che il detailing non è un business serio. Nessuno dei due mi stava attaccando. Erano convinti di aiutarmi.</p>\n\n<p>È così che funziona quasi sempre: i consigli peggiori arrivano da persone che ti vogliono bene.</p>\n\n<h2>Il criterio non è chi sei, è cosa hai fatto</h2>\n\n<p>Qui si sbaglia facilmente e voglio essere preciso, perché è una cosa su cui ho un interesse personale.</p>\n\n<p>Il criterio non è la reputazione. Non è la categoria in cui una persona rientra. Non è quanto è messa bene adesso. È una cosa sola: ha attraversato quello di cui parla, oppure no.</p>\n\n<p>Cambia tutto. Uno rispettabile che non ha mai costruito niente non ha nessuna informazione da darti sul costruire. Uno che sembra un disastro ma è uscito da un buco profondo ha in mano la cosa più preziosa che esista su come si esce, e nessuno gliela chiede mai perché non ha l'aspetto giusto.</p>\n\n<p>Io da un anno sto ricostruendo una vita da capo. Se applicassi il criterio della rispettabilità a me stesso, dovrei tacere. Applico quello dell'esperienza, e allora c'è una cosa sola di cui posso parlare con qualche autorità: come si sta là sotto, e cosa serve per venirne fuori. Su tutto il resto sto imparando come chiunque altro.</p>\n\n<h2>Le tre domande</h2>\n\n<p>Prima di prendere sul serio un consiglio, tre domande. Sono veloci e non sbagliano quasi mai.</p>\n\n<p>Uno: <strong>l'ha fatto?</strong> Non l'ha studiato, non l'ha visto fare, non ne ha letto. L'ha fatto con il proprio corpo, i propri soldi, il proprio tempo.</p>\n\n<p>Due: <strong>lo sta facendo adesso?</strong> Chi ha smesso dieci anni fa ti parla di un mondo che non esiste più, e spesso non lo sa. Vale per il business e vale per la palestra.</p>\n\n<p>Tre: <strong>ha pagato un prezzo?</strong> Chi ha solo vinto non sa perché ha vinto. Chi ha perso qualcosa e poi ha capito, sa dove sta il pericolo. È il consiglio più utile che esista, e arriva sempre da chi ha sbattuto.</p>\n\n<h2>Non chiedere a chi sta ancora dentro come si esce</h2>\n\n<p>Questa è la regola che mi è costata di più imparare.</p>\n\n<p>Chi è nel mezzo di una cosa non può darti indicazioni su quella cosa. Non perché sia stupido o in malafede: perché per stare lì dentro ha bisogno di una versione dei fatti che regga, e quella versione te la passerà senza accorgersene. Non ti sta mentendo. Ti sta ripetendo quello che dice a sé stesso per andare avanti.</p>\n\n<p>Chi non si allena ti spiegherà che l'allenamento serio è eccessivo. Chi non ha mai rischiato niente ti spiegherà che rischiare è da incoscienti. Chi sta fermo ti dirà che stai correndo troppo. Ogni volta, quello che ti stanno dando non è un'analisi della tua situazione. È la giustificazione della loro.</p>\n\n<h2>Il problema vero non sono i consigli</h2>\n\n<p>I consigli si possono ignorare. Le persone intorno no.</p>\n\n<p>Diventi la media di chi ti sta vicino, e non succede attraverso i discorsi. Succede attraverso quello che ti sembra normale. Se tutti quelli intorno a te si alzano a mezzogiorno, alzarsi alle cinque diventa una stranezza da giustificare. Se nessuno costruisce niente, costruire qualcosa sembra presunzione. Nessuno ti dice niente di esplicito. Si abbassa solo l'asticella di cosa è ovvio.</p>\n\n<p>Per questo la scelta delle persone conta più della disciplina. La disciplina la applichi con la testa, ogni giorno, e ti costa. L'ambiente lavora da solo, ventiquattro ore su ventiquattro, in una direzione o nell'altra.</p>\n\n<h2>Circondati di chi sei diretto a diventare</h2>\n\n<p>Non di chi sei adesso. Di chi vuoi essere.</p>\n\n<p>Significa stare nella stanza dove sei il meno bravo, che è scomodo e umiliante e funziona. In palestra con gente che ti mette sotto. Vicino a chi ha un'azienda vera invece che a chi parla di aprirla. Vicino a chi la fede l'ha studiata per una vita, non a chi ha letto tre citazioni.</p>\n\n<p>Non serve tagliare fuori nessuno. Nessuno deve smettere di essere tuo amico. Ma se ti stai giocando qualcosa di serio, guarda a chi la stai chiedendo prima di chiedere.</p>\n\n<p>Non chiedere la strada a chi non c'è mai arrivato.</p>\n\n<p>IC XC NIKA</p>\n	/objects/uploads/ceaaeeb7-b002-47df-ba99-c0aa7db5d273	t	2026-08-11	2026-08-18 00:26:57.464547+00	2026-08-18 00:26:57.464547+00	\N	\N	\N	\N	\N
15	pronto-a-tutto	PRONTO A TUTTO 	IL CORPO	<h1>Fai i compiti a casa</h1>\n\n<p>Un uomo entra in casa tua alle tre di notte. Non è un'ipotesi filosofica, è una cosa che succede ogni notte a qualcuno in questo paese. La domanda non è se ti capiterà. È cosa fai nei primi tre secondi, e quei tre secondi sono già decisi adesso, mentre leggi.</p>\n\n<h2>Gli stoici avevano un esercizio</h2>\n\n<p>Si chiama <em>praemeditatio malorum</em>, la premeditazione dei mali. Seneca lo raccomandava a chiunque: dedicare del tempo, a mente fredda, a immaginare in dettaglio quello che può andare storto. L'esilio. La malattia. La morte di chi ami. La tua.</p>\n\n<p>Non per masochismo. Il ragionamento è meccanico: quello che ti distrugge non è la disgrazia, è la sorpresa. Chi non ha mai contemplato una possibilità, quando arriva, perde i primi minuti a chiedersi se sta succedendo davvero. Quei minuti sono spesso tutto quello che avevi.</p>\n\n<p>La versione moderna esiste e ha un nome clinico: inoculazione da stress. Ti esponi in dosi controllate a quello che temi, e il sistema smette di andare in tilt quando lo incontra intero. È lo stesso principio del vaccino. È anche lo stesso principio dello sparring.</p>\n\n<h2>Elenco, senza addolcire</h2>\n\n<p>Se giri in certi posti: puoi essere accoltellato. Puoi essere pestato in cinque contro uno. Ti possono entrare in casa mentre dormi. Possono farlo ai tuoi amici e tu essere lì a guardare senza poter fare niente.</p>\n\n<p>Se non giri in nessun posto strano: un'auto ti prende in pieno e non cammini più. Cadi da un palo e non ti rialzi. Ti trovano una massa dove non doveva esserci. Un genitore muore all'improvviso e devi occuparti di tutto tu, subito, mentre non riesci a stare in piedi.</p>\n\n<p>Nessuno di questi scenari è raro. Sono tutti già successi oggi a qualcuno che stamattina pensava di essere al sicuro come lo pensi tu.</p>\n\n<h2>Come si fa, senza avvelenarsi</h2>\n\n<p>Questo è il punto dove la maggior parte della gente sbaglia e trasforma un esercizio utile in ansia pura.</p>\n\n<p>La premeditazione stoica non è rimuginare. Ha una struttura precisa e finisce sempre allo stesso modo: non con l'immagine del disastro, ma con la tua risposta. Se ti fermi allo scenario e non arrivi all'azione, non ti stai preparando. Ti stai solo facendo del male.</p>\n\n<p>Quindi: dieci minuti, non un'ora. Uno scenario alla volta. Lo porti fino in fondo, e poi rispondi a una sola domanda — cosa faccio, esattamente, nei primi trenta secondi. Se non hai una risposta, quella è la tua lista dei compiti. Poi chiudi e vai a fare altro.</p>\n\n<p>Fatto così, dopo qualche settimana lo scenario perde il potere di paralizzarti. Fatto male, diventa la cosa a cui pensi alle tre di notte.</p>\n\n<h2>I compiti sono noiosi e servono</h2>\n\n<p>La preparazione non è drammatica. Sono cose banali, che nessuno fa perché non danno soddisfazione: saper mettere una mano in mezzo prima che il colpo parta, che si impara solo prendendole in palestra. Saper fermare un'emorragia. Avere dei soldi da parte per il mese in cui non lavori. Sapere dove sono le uscite del posto in cui entri, cosa che ti costa due secondi. Aver detto alle persone quello che gli devi dire, prima e non dopo.</p>\n\n<p>Niente di eroico. Roba da fare in una domenica pomeriggio.</p>\n\n<p>La ferocia, quando serve, non si inventa in quel momento. Esce solo se qualcosa c'era già. Chi non ha mai fatto i compiti, sotto pressione non diventa spietato: diventa lento. Si blocca, chiede se è tutto vero, aspetta che qualcuno gli dica cosa fare. È la reazione più comune che esista e non ha niente a che vedere con il coraggio.</p>\n\n<h2>Prego, e non conto su quello</h2>\n\n<p>Prego che a te non succeda niente. Lo penso davvero.</p>\n\n<p>Ma la fede non è un'assicurazione, e chi la usa così prima o poi resta in mano con niente. La tradizione che seguo non ha mai promesso a nessuno che sarebbe stato risparmiato — gli uomini che ammiro di più in quella tradizione sono finiti quasi tutti male, e lo sapevano. La grazia non sostituisce la mano. Muove la mano che c'è.</p>\n\n<p>Quindi prega. E poi allenati come se non ti rispondesse nessuno.</p>\n\n<p>Meglio aver fatto i compiti che trovarsi nudo nella tormenta.</p>\n\n<p>IC XC NIKA</p>\n\n<ul class="fonti">\n  <li>Seneca, <em>Epistulae ad Lucilium</em>, 91 e 107 — sulla premeditazione dei mali</li>\n  <li>Marco Aurelio, <em>Colloqui con se stesso</em>, II, 1 — l'esercizio del mattino</li>\n  <li>Meichenbaum D., <em>Stress Inoculation Training</em>, 1985 — la formulazione clinica dell'esposizione gradata</li>\n</ul>\n	/objects/uploads/b29999da-c837-497b-8517-8d9d93bea662	t	2026-08-07	2026-08-18 00:26:57.464547+00	2026-08-18 00:26:57.464547+00	\N	\N	\N	\N	\N
16	riflessioni-a-30-metri-da-terra	RIFLESSIONI A 30 METRI DA TERRA	LA FEDE	<h1>Riflessioni a trenta metri da terra</h1>\n\n<p>C'è un momento, la mattina presto, in cui il traliccio è ancora freddo sotto i guanti e il resto del mondo dorme. Sali il primo tratto e non è niente. Sali il secondo e la città comincia ad abbassarsi. Al terzo, le macchine sotto di te sono diventate giocattoli e il rumore del traffico arriva ovattato, come se qualcuno avesse abbassato il volume alla vita normale.</p>\n\n<p>Poi arrivi in cima. E lì succede una cosa che a terra non succede mai.</p>\n\n<h2>A terra puoi mentire</h2>\n\n<p>A terra puoi mentire a te stesso. Puoi rimandare, distrarti, riempire il vuoto con il telefono, raccontarti che va tutto bene. A trenta metri no. Sei tu, il metallo, il moschettone, il vento che ti spinge di lato e ti ricorda a ogni raffica che sei un peso appeso a una struttura d'acciaio. Non c'è spazio per il rumore mentale. C'è solo il gesto: la mano che cerca l'appiglio giusto, il piede che si assicura, il respiro che rallenta perché deve.</p>\n\n<p>È la forma di presenza più pura che conosco. I monaci la cercano per anni nel silenzio. Io la trovo ogni mattina in cima a un palo delle telecomunicazioni, perché lassù la mente non ha scelta: o sei qui, adesso, in questo esatto secondo, o cadi. La gravità è un maestro che non accetta scuse.</p>\n\n<h2>Perché certi uomini hanno sempre voluto salire</h2>\n\n<p>Da lassù il paesaggio si apre in un modo che chi resta a terra non vedrà mai. I tetti diventano una mappa. I campi si allineano fino all'orizzonte. Il sole taglia la nebbia bassa e per un attimo — un attimo solo, prima che ricominci il lavoro — capisci perché certi uomini hanno sempre voluto salire. Non per dominare quello che vedono. Per sentirsi vivi nel modo in cui solo il rischio ti fa sentire.</p>\n\n<p>Poi torni al lavoro. Cavi, connettori, antenne. Le mani si sporcano, la schiena tira, le ore passano appeso in tensione e ogni muscolo lo sa. È fatica vera, di quella che non finisce in nessun video e che nessuno applaude. Ma è anche la cosa che paga tutto il resto — l'allenamento, il progetto, il viaggio che voglio fare per la mia famiglia. Ogni antenna montata è un mattone.</p>\n\n<h2>La corda</h2>\n\n<p>E c'è una lezione che il traliccio mi ha insegnato meglio di qualsiasi libro: per salire in alto, prima devi imparare a fidarti della corda. Devi accettare di dipendere da qualcosa — il moschettone, l'imbrago, il nodo che hai controllato tre volte — e poi lasciare andare la paura. Chi non si fida resta a terra. Chi si fida ciecamente cade. La verità sta nel mezzo: controlli tutto quello che puoi controllare, e poi ti affidi.</p>\n\n<p>Non è diverso dalla vita. Non è diverso dalla fede.</p>\n\n<p>Ogni sera scendo con le mani rovinate e la faccia bruciata dal vento. E ogni mattina risalgo. Perché lassù, per qualche ora, sono esattamente dove devo essere — senza distrazioni, senza bugie, solo io e l'altezza.</p>\n\n<p>Il mondo, visto da trenta metri, si fa onesto. E ti chiede di esserlo anche tu.</p>\n\n<p>IC XC NIKA</p>\n	/objects/uploads/9b62705f-fa54-48f6-bdba-40b09da5688b	t	2026-08-05	2026-08-18 00:26:57.464547+00	2026-08-18 00:26:57.464547+00	\N	\N	\N	\N	\N
17	sei-troppo-debole-non-ce-la-farai-mai	SEI TROPPO DEBOLE, NON CE LA FARAI MAI 	LA FEDE	<h1>Non so nemmeno il suo cognome</h1>\n\n<p>La persona che mi ha aiutato di più, nel momento peggiore, non era un prete. Non era uno psicologo. Non era un medico.</p>\n\n<p>Era un ragazzo che aveva fatto una rapina andata male e stava scontando sette anni.</p>\n\n<h2>Non mi ha mai detto niente di piacevole</h2>\n\n<p>Ci abbiamo parlato ogni giorno per tre o quattro mesi. In tutto quel tempo non mi ha detto una frase morbida. Nemmeno una.</p>\n\n<p>Mi ha detto che stavo sbagliando tutto. Che il mondo che stavo inseguendo avrebbe portato problemi a me e a chiunque mi stesse intorno. Che quello che chiamavo medicina mi stava distruggendo, e stava distruggendo tutto quello che sarei potuto diventare.</p>\n\n<p>Nessuno prima di lui me lo aveva detto così. Tutti gli altri erano gentili.</p>\n\n<h2>Lo aveva fatto a secco</h2>\n\n<p>Anche lui era stato dipendente. Ne era uscito senza niente: nessuna terapia, nessuna sostituzione, nessuno scalaggio. A secco, sentendo tutto — il dolore fisico e quello nella testa — in carcere, d'estate.</p>\n\n<p>Ha guardato i suoi demoni negli occhi nel posto peggiore in cui potesse trovarsi e gli ha detto: o muoio io o morite voi.</p>\n\n<p>Questo non è un metodo e non lo consiglio a nessuno. È quello che ha fatto lui. Ma è per questo che quando parlava non c'era niente da controbattere. Non stava riportando qualcosa che aveva letto.</p>\n\n<h2>Quello che mi ha detto di fare</h2>\n\n<p>Quando è venuto il momento di andarmene, la lista era chiara. Tornare a casa. Allenarmi tutti i giorni. Buttare giù cinquanta chili. Lasciare stare la criminalità. Lasciare stare le droghe. Affrontare le mie dipendenze col sangue.</p>\n\n<p>Mi ha fatto iniziare a fare boxe quando non riuscivo a tenere su i guantoni per trenta secondi.</p>\n\n<p>E l'ultima cosa che mi ha detto, prima che me ne andassi, ridendo in faccia:</p>\n\n<p><strong>Sei troppo debole, non ce la farai mai.</strong></p>\n\n<h2>È la cosa che mi ha salvato</h2>\n\n<p>Ogni volta che stavo per mollare — e il dolore era insopportabile, non sto usando una parola grossa — sentivo la sua voce che diceva che non ce l'avrei fatta.</p>\n\n<p>E mi ripetevo la sua frase. O muoio io o morite voi.</p>\n\n<p>Non so se lo abbia detto per crudeltà o perché sapeva esattamente cosa stava facendo. Propendo per la seconda. Sapeva che le parole gentili non mi avrebbero tenuto in piedi, e che quella frase invece mi sarebbe rimasta addosso per anni.</p>\n\n<p>Aveva ragione.</p>\n\n<h2>L'ho cercato</h2>\n\n<p>Ho provato a contattarlo. Non so dove sia finito. Non so nemmeno il suo cognome.</p>\n\n<p>So solo che tutto quello che mi ha detto di fare, l'ho fatto. Cinquanta chili in meno. Le droghe, finite. La palestra, tutti i giorni. Quella strada, chiusa.</p>\n\n<p>Se qualcuno si chiede perché scrivo che il criterio non è la rispettabilità di una persona ma se ha attraversato quello di cui parla, la risposta è questa. L'uomo che mi ha salvato la vita stava scontando sette anni. Nessuno gli avrebbe dato la parola su niente.</p>\n\n<p>Ti voglio bene, fratello. Mi hai dato speranza e rivalsa.</p>\n\n<p>IC XC NIKA</p>	/objects/uploads/421f6f0a-e416-4e16-af04-e56f75713d55	t	2026-08-08	2026-08-18 00:26:57.464547+00	2026-08-18 00:26:57.464547+00	\N	\N	\N	\N	\N
\.


--
-- Data for Name: bozze; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bozze (numero, dati, updated_at) FROM stdin;
\.


--
-- Data for Name: candidature; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.candidature (id, nome, contatto, progetto, created_at, stato) FROM stdin;
\.


--
-- Data for Name: coaching; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coaching (id, hero_titolo, hero_sottotitolo, descrizione, community_cta, community_url, email, visibile, updated_at) FROM stdin;
\.


--
-- Data for Name: contatti; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contatti (id, nome, email, tipo, messaggio, created_at, stato) FROM stdin;
\.


--
-- Data for Name: contenuti; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contenuti (chiave, valore, aggiornato_a) FROM stdin;
chi_sono_bio	\n\nCHI SONO\n\nMi chiamo J, ho 21 anni, vivo a Bologna. Due anni fa pesavo 130 chili ed ero dipendente. Non avevo una direzione, solo il giorno dopo. Ho toccato il fondo. Poi ho deciso di smettere di fuggire e iniziare a costruire.\n\n	2026-07-04 07:50:34.884+00
chi_sono_foto	/objects/uploads/73da81cf-21a1-4189-8636-6d462b6bc55d	2026-08-18 00:26:57.738087+00
chi_sono_il_progetto	\nQuesto è il mio diario crudo e senza filtri. Per 180 giorni documento ogni aspetto della mia ricostruzione. Niente motivazione vuota, niente estetica finta per i social. Solo numeri, sudore, e le riflessioni che arrivano quando resti solo con te stesso. Se inciampo, lo vedete. I dati sono reali perché la trasformazione è reale.\n	2026-08-18 00:26:57.738087+00
chi_sono_la_motivazione	\nVoglio dimostrare, prima a me stesso, che il cambiamento nasce dalla disciplina, non dall'ispirazione di un momento. Il corpo e lo spirito sono legati: forgiando uno, sollevi l'altro. Lo sport da combattimento mi ha insegnato che il corpo regge più di quanto la mente creda. La fede mi ha dato una ragione per continuare quando il corpo non bastava.	2026-08-18 00:26:57.738087+00
chi_sono_la_promessa	\nNon so chi sarò al giorno 180. So che sarò onesto nel raccontarlo. Se fallisco, resterà documentato. Ma ogni mattina mi sveglio con una sola certezza: il lavoro va fatto, senza scuse.\n	2026-08-18 00:26:57.738087+00
journaling_intro	Tutto ciò che misuri migliora.\nSegnare dati ti da disciplina.\nI dati sono informazione.\nInformazione e disciplina portano miglioramenti sempre\n	2026-08-18 00:26:57.738087+00
\.


--
-- Data for Name: giorni; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.giorni (id, numero, data, kcal, sonno, flessioni, addominali, round, km, peso, battito, testo, foto, created_at, entrate, uscite, sintesi, card_titolo, card_sottotitolo, card_immagine, card_overlay, card_mostra_parole, pasti, alcol, acqua, tipo_allenamento, durata, intensita, tipo_giorno, routine_completata, routine_flessioni, routine_trazioni, routine_squat, plank, collo, mobilita, sollevamento_gamba, grappling_vuoto, energia, note_allenamento, routine_forza, acqua_allenamento, attrito, fatto, non_fatto, card_feed, card_story) FROM stdin;
212	100	2026-08-19	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-20 20:51:42.758576+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
213	101	2026-08-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-20 20:51:42.765106+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
214	102	2026-08-21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-22 12:41:04.315806+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
215	103	2026-08-22	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-22 12:41:04.33862+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
216	104	2026-08-23	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-22 22:00:00.363223+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	2	2026-05-03	2000	7	200	200	7	10	86.4	77	179 giorni rimanenti. Sonno settato su 7 ore. Costole leggermente incrinate, ma il lavoro non si ferma, si adatta. 10 km di corsa su strada. Flessioni e addominali sull'erba e sull'asfalto. Sparring in giardino: 5 round di Thai, calci, schivate e incassi. Chiusura con un sacco rudimentale legato a un albero: 200 combinazioni di calci e 100 ginocchiate. La palestra non serve se hai la fame giusta. I conti si fanno alla fine, i numeri girano.	/objects/uploads/c248f07e-7b0e-4991-baae-60678fd57b2a	2026-07-05 11:11:45.883417+00	40	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
51	54	2026-06-23	2500	6.5	\N	\N	0	\N	83.7	67	GIORNO 54\n\nZero allenamento sul tatami oggi. Non per mancanza di voglia — per gestione.\n\nIl Lavoro\nIl turno in quota sui tralicci è stato massacrante. Stare appesi in tensione continua è già calistenia pura. Aggiungere altro stress sarebbe stato controproducente.\n\nIl Business\nRientrato dal cantiere, focus su Apex Detailing e su nuovi modi per monetizzare. La sera a scrivere post e strutturare contenuti.\n\nCome le MMA sono la somma di tutte le arti marziali, la vita reale funziona allo stesso modo: devi saperti muovere in qualsiasi contesto.\n\n126 giorni rimasti.	/objects/uploads/45477826-80d5-4069-83de-9fb1f5a4b9a8	2026-07-12 11:38:54.168871+00	110	10.11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
217	105	2026-08-24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-23 22:00:00.533832+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
218	106	2026-08-25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-25 14:31:21.942644+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
219	107	2026-08-26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-26 20:32:24.241038+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
220	108	2026-08-27	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-29 09:45:25.217876+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
221	109	2026-08-28	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-29 09:45:25.340523+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
222	110	2026-08-29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-29 09:45:25.347129+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
223	111	2026-08-30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-31 07:45:59.384257+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
224	112	2026-08-31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-31 07:45:59.392852+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
225	113	2026-09-01	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-02 11:21:52.628718+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
226	114	2026-09-02	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-02 11:21:52.641733+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
227	115	2026-09-03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-05 20:21:04.518148+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
228	116	2026-09-04	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-05 20:21:04.528216+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
229	117	2026-09-05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-05 20:21:04.534577+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
230	118	2026-09-06	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.922945+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
231	119	2026-09-07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.931641+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
232	120	2026-09-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.940996+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
233	121	2026-09-09	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.945627+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
234	122	2026-09-10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.950462+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
235	123	2026-09-11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.954999+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
236	124	2026-09-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.959326+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
237	125	2026-09-13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.963117+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
238	126	2026-09-14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.967218+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
239	127	2026-09-15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.971238+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
240	128	2026-09-16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.974889+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
241	129	2026-09-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.978806+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
242	130	2026-09-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.982362+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
243	131	2026-09-19	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.986392+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
244	132	2026-09-20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-20 16:57:15.990156+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
245	133	2026-09-21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.489803+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
246	134	2026-09-22	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.627589+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
247	135	2026-09-23	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.637314+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
248	136	2026-09-24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.641884+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
249	137	2026-09-25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.64703+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
250	138	2026-09-26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.651499+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
251	139	2026-09-27	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.655226+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
252	140	2026-09-28	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.659473+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
253	141	2026-09-29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.662975+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
254	142	2026-09-30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.666354+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
255	143	2026-10-01	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.671032+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
256	144	2026-10-02	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.674983+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
257	145	2026-10-03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.67884+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
258	146	2026-10-04	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.685469+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
259	147	2026-10-05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.690377+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
260	148	2026-10-06	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.694355+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
261	149	2026-10-07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.698141+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
262	150	2026-10-08	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.701975+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
263	151	2026-10-09	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.705452+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
264	152	2026-10-10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.709068+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
265	153	2026-10-11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.712929+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
266	154	2026-10-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-12 09:04:59.718638+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
267	155	2026-10-13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-13 05:18:07.742137+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
269	156	2026-10-14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-15 19:29:08.759857+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
270	157	2026-10-15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-15 19:29:08.792285+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
271	158	2026-10-16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-16 13:29:41.722867+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
10	10	2026-05-11	1850	6	200	238	6	\N	86.1	74	GIORNO 10\n\nSveglia. Il corpo chiede riposo, il piano impone l'esecuzione. 100 flessioni, 100 addominali, 100 squat e Thai shadow boxing prima ancora che il resto del mondo apra gli occhi.\n\nGiornata sui tralicci, 8 ore in quota. Il rischio caduta non è un concetto astratto, è una statistica con cui convivi ogni volta che agganci il moschettone. Richiede una lucidità che non puoi permetterti di perdere. Sceso da lì, il cantiere si è spostato in palestra: un'ora e quaranta di condizionamento brutale e sparring di boxe. Il corpo viene demolito e ricostruito quotidianamente.\n\nIl tracciamento è totale, la matematica non mente mai. 1850 kcal esatte, calcolate per sostenere l'impatto mantenendo il peso sotto controllo, lavate da 5 litri d'acqua.\n\nEntrate +70€, spese -39€, mercati (XAU) -20€. I mercati fluttuano, l'infrastruttura fisica e mentale che sto costruendo no.\n\nNon sto cercando di impressionare nessuno. Sto documentando in tempo reale cosa serve, meccanicamente e spietatamente, per cambiare vita.\n\n170 GIORNI ALLA FINE	/objects/uploads/62f2cd4c-20e4-490d-9848-7679d2e707bd	2026-07-05 12:18:58.837031+00	39	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
11	11	2026-05-12	1950	6	200	200	7	4	85.9	72	GIORNO 11\n\nIl furgone parte alle 6. Il mondo fuori è ancora spento, ma i tralicci non si scalano da soli.\n\nIl Lavoro\nTurno pieno in quota. Dal sedile di guida guardo il furgone e penso a quando ne avrò due. Chi scala il metallo impara a scalare tutto il resto.\n\nIl Corpo\nPausa pranzo in un parcheggio industriale. Giacca da lavoro tolta, pantaloni sporchi del cantiere, 4 round di shadow boxing sull'asfalto. La sera direttamente sul tatami per 3 round di grappling.\n\nLa motivazione non c'era. Il sistema è andato avanti lo stesso.\n\n169 giorni rimasti.	/objects/uploads/7480b26b-8c2b-430f-b3d7-6d10b6a8848f	2026-07-05 12:22:38.457988+00	69.91	34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
12	12	2026-05-13	2650	5.5	\N	\N	\N	\N	85.9	74	GIORNO 12\n\nIeri ho spinto oltre il limite. Il corpo ha presentato il conto cedendo prima della mente.\n\nIl Corpo\nInfortunio da sovraccarico. Rest day attivo — non ci si ferma, si sposta la direzione dell'impatto. Se un fronte è bloccato, l'attacco va sugli altri due.\n\nIl Business\n4 ore in quota completate. Poi ricerca attrezzature professionali per J Detailing. L'azienda avanza mentre il telaio si ripara.\n\nNon mi alleno per l'estetica. Prendo pugni in bocca — e questo richiede una struttura solida.\n\n168 giorni rimasti.	/objects/uploads/d2bbcb5f-5bd3-406b-9378-95993a2ffcef	2026-07-05 12:26:31.606545+00	85	25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
22	22	2026-05-23	1120	6.5	100	100	1	\N	84.5	67	GIORNO 22\n\nNon sei una macchina. Se giri fuori giri per 180 giorni senza mai alzare il piede, il motore fonde.\n\nIl Corpo\n100 flessioni e 100 addominali a freddo. Poi nuoto, un concerto, decompressione. Primo giorno umano dall'inizio del progetto.\n\nIl Business\n63€ per un paio di guanti da MMA da 8 once — investimento diretto verso il ring. 23€ di spesa per mia madre. Quella non è un'uscita. Quello è il motivo per cui l'intero Progetto J esiste.\n\nLa decompressione è finita. Domani si torna al volume pieno.\n\n158 giorni rimasti.	/objects/uploads/ba0dce59-5514-4624-a3b3-7d8be41f44b5	2026-07-05 13:08:15.54236+00	0	86	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
24	24	2026-05-25	2572	6	200	200	8	0	84.7	68	GIORNO 24\n\nNessun dramma. Solo lavoro in quota a Castel San Pietro e tatami la sera.\n\nIl Corpo\n200 flessioni, 200 addominali, 3 circuiti, 5 round di sparring, 3 di shadow, 30 minuti di sacco Thai libero.\n\nLa Mente\nLa falla nel carburante dei giorni scorsi è stata sigillata: proteine ripristinate sopra la soglia. La macchina avanza.\n\n156 giorni rimasti.	/objects/uploads/1c800301-2bd2-4d36-82ae-7362579bbd7d	2026-07-05 17:36:21.749685+00	72	19.34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
26	26	2026-05-27	2800	4.5	100	100	10	\N	84.9	68	GIORNO 26\n\nCostruzione silenziosa.\n\nIl Lavoro\nGiornata in quota sui pali. Poi dritto in palestra per 2 ore e mezza: riscaldamento, vuoto, 10 round intensi di pao, circuito, isometria, plank, addominali.\n\nIl Business\n90€ di uscita — ma non è una spesa. È l'abbonamento di kickboxing. Carburante diretto verso il match di novembre. Da oggi ogni sessione ha costo zero.\n\n154 giorni rimasti.	/objects/uploads/0b3cf15d-4e58-44df-bab2-08dd29e46f9a	2026-07-05 17:51:04.872855+00	0.05	90	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
27	27	2026-05-28	2796	6	100	100	5	\N	84.3	68	GIORNO 27\n\nIl focus non cambia. Lavoro in quota, poi tatami.\n\nIl Corpo\n2 ore nette sul tappeto: vuoto, grappling e sparring di kickboxing. Zero esercizi a corpo libero — la priorità è l'attrito reale.\n\n12 ore di sonno totali negli ultimi due giorni. Il primo vero stacco dall'inizio del progetto. Il corpo si ripara.\n\n153 giorni rimasti.	/objects/uploads/5b3446bf-0a0e-4623-a64d-c47f91a8dc25	2026-07-05 17:52:21.419149+00	200	1.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
29	29	2026-05-30	2500	8	\N	\N	\N	\N	85	67	GIORNO 29\n\nNessun video. Secondo giorno in malattia.\n\nIl Corpo\nIl corpo è fermo ma il focus non si spegne. Stretching, mobilità articolare, 8 ore di sonno per rimettere in asse la struttura.\n\nNessun dramma. È solo attrito imprevisto nel percorso.\n\n151 giorni rimasti.	/objects/uploads/c1a488d1-d36f-4a6b-b087-64e92fc13e0b	2026-07-05 17:57:00.399072+00	72	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
25	25	2026-05-26	3168	6	\N	\N	5	\N	84.7	68	GIORNO 25\n\nGiornata più leggera, ma il gioco non si ferma.\n\nIl Corpo\nZero calistenia. Spazio al lavoro tecnico: un'ora e mezza di grappling e lotta, poi 30 minuti di sacco Thai.\n\nIl Lavoro\n5 salite e discese a 30 metri con carico e attrezzi. L'attrito nel mondo reale si gestisce in quota.\n\nAllarme rosso: proteine crollate a 99g. Insufficiente per questo volume di stress. Da correggere.\n\n155 giorni rimasti.	/objects/uploads/8f551b79-8832-4ae1-91d3-1ada90067785	2026-07-05 17:44:37.834116+00	72	23	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
31	31	2026-06-01	2000	6	102	100	10	\N	84.3	68	GIORNO 31\n\nPrimo giorno del Mese 2. Rientro operativo.\n\nIl Lavoro\nSveglia alle 5:00. Ritorno in quota dopo i problemi di salute.\n\nIl Corpo\nLa sera sul tatami: 100 flessioni, 100 addominali e 10 round da 5 minuti di grappling.\n\nLa Mente\nIl Mese 1 ha generato 100.000 views. Il Mese 2 inizia da 2€ netti. Sto sviluppando un'idea per generare entrate a budget zero e sto studiando la creazione video con l'intelligenza artificiale — strumenti che un mese fa ignoravo.\n\nLa macchina è ripartita.\n\n149 giorni rimasti.	/objects/uploads/ad9f65aa-2762-47d0-bffa-7cc15c49432e	2026-07-05 17:57:03.319459+00	72	70	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
32	32	2026-06-02	1800	10	\N	\N	\N	\N	83.9	67	GIORNO 32\n\nPrimo giorno di blocco totale. Operazione e letto di ospedale.\n\nIl Corpo\nZero passi, zero tatami. Il corpo è costretto a fermarsi. Il progetto non si spegne — cambia piano operativo.\n\nIl motore si raffredda per poter ripartire.\n\n148 giorni rimasti.	/objects/uploads/17ff5ede-4bf0-4ae2-976d-b3a61d2f4dcd	2026-07-05 18:22:29.565172+00	72	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
33	36	2026-06-05	1800	6.5	100	100	10	0	85	73	GIORNO 36\n\nLa macchina gira a pieno regime.\n\nIl Corpo\nTest di resistenza totale: 10 round di combattimento, poi tennis. Alimentazione calcolata al millimetro, solo carburante pulito.\n\nIl Business\n30€ guadagnati con il lavoro manuale, 15€ reinvestiti nella boxe. Il focus è assoluto.\n\n144 giorni rimasti.	/objects/uploads/3d2b9551-7372-492c-a18a-b6cc7afb85f8	2026-07-11 14:32:07.454848+00	30	15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
39	42	2026-06-11	2600	7	100	100	2	0	84.2	68	GIORNO 42\n\n100 flessioni e 2 round a vuoto con la costola che non molla. Il dolore c'è, ma l'esecuzione non si ferma.\n\nIl Lavoro\nSu un palo a 50 metri. Sali e scendi, montaggio macchinari. L'attrito quotidiano che non si vede sui social, ma che finanzia e forgia il progetto.\n\nLa Mente\nSul fronte video sto sviluppando competenze nuove: luci, videocamere, fusione tra AI e riprese reali per effetti speciali. Non è perfetto. Ma non lo era nemmeno il mio primo video. Ogni giorno una competenza in più.\n\n138 giorni rimasti..	\N	2026-07-12 10:15:31.006604+00	72	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
40	43	2026-06-12	\N	\N	\N	\N	\N	\N	\N	\N	GIORNO DI RIPOSO	\N	2026-07-12 10:18:47.313552+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
47	50	2026-06-19	2200	5.5	\N	\N	\N	\N	84	67	GIORNO 50\n\nSveglia alle 5:00. Cinquanta giorni. Un quarto del percorso.\n\nIl Lavoro\nSmontaggio cavi su un palo. Poi a Verona: quattro ore di detailing sulla macchina di una cliente. 50€ in cassa.\n\nIl Corpo\nSettimana di scarico. Zero round, zero flessioni. Non è debolezza — chi si brucia non arriva al giorno 180.\n\nIl sito web arriva presto. Lì centralizzerò tutto: dati, diari, numeri finanziari. Chi vuole il percorso completo lo troverà lì.\n\n130 giorni rimasti. IC XC NIKA.	\N	2026-07-12 11:23:49.799545+00	50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
48	51	2026-06-20	1980	6	100	30	12	\N	84	67	GIORNO 51\n\nSveglia alle 5:00. Lavoro sui tetti.\n\nIl Lavoro\nRagno per salire, poi una marea di scale per il montaggio delle alimentazioni. 5 litri d'acqua bevuti. Scarpe antinfortunistiche e pantaloni da lavoro nuovi comprati.\n\nIl Corpo\nLa settimana di scarico è finita. Ritorno sul tatami: un'ora di pao e 30 minuti di sacco libero.\n\nIl Business\nL'orto frutta in modo concreto — sto vendendo una parte della verdura. Apex continua: pulizia tappezzeria. La sera a scrivere e strutturare il sito web.\n\n129 giorni rimasti.	\N	2026-07-12 11:26:08.727922+00	202	57	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
49	52	2026-06-21	2400	6.5	100	100	10	0	84.2	67	GIORNO 52\n\n100 flessioni e 100 addominali a freddo per accendere il sistema.\n\nIl Corpo\nUn'ora e mezza di boxe: mezz'ora di riscaldamento, poi un'ora di lavoro intenso. Il caldo era allucinante, la maglietta completamente impregnata. Il peso scende ma il battito a riposo resta stabile — il motore è abituato.\n\nIl Lavoro\nTurno completato. 85€ in cassa, zero spese.\n\nGiornata tranquilla, centrata solo sull'allenamento. A volte basta così.\n\n128 giorni rimasti.	/objects/uploads/030e394c-c1a1-43f7-bfd8-e240fa0de167	2026-07-12 11:30:08.942463+00	85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
53	56	2026-06-25	2040	6.5	0	0	6	5	83.9	67	GIORNO 56\n\nRimini. Oggi la sabbia è diventata tatami.\n\nIl Corpo\n6 round da 3 minuti di MMA sulla spiaggia — calci, pugni, lotta a terra e grappling. Senza paradenti, gestendo i colpi al viso. Una ginocchiata in piena bocca, ma fa parte del gioco. Poi 2 ore di calcio sulla sabbia e lotta in mare.\n\nLa cosa migliore è stata spiegare ai bagnanti che ci imploravano di smettere che non ci stavamo massacrando — stavamo praticando un fottuto sport.\n\n124 giorni rimasti.	/objects/uploads/b0578e58-0482-49e5-a779-9510bad2b47b	2026-07-12 11:44:34.217053+00	45	130	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
55	58	2026-06-27	2689	8.5	\N	\N	\N	\N	84.5	65	GIORNO 58\n\nStop totale all'allenamento. Dopo il volume di ieri, il sistema nervoso aveva bisogno di resettarsi.\n\nIl Business\nMacchine lavate e detailing fatto — 140€ in cassa. L'azienda respira e prende forma.\n\nLa Mente\nLa sera con la mia ragazza. Mangiato fuori, spento la testa. Dedicare tempo a chi ti sta vicino e godersi un pasto senza bilancino fa parte del recupero mentale. Chi non sa fermarsi, si schianta.\n\n122 giorni rimasti.	/objects/uploads/575f7124-527d-42db-ac4a-7a38febfaa29	2026-07-12 11:52:16.968961+00	140	56	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
59	62	2026-07-01	1800	6	60	0	5	\N	83.7	63	GIORNO 62\n\nFocus sullo striking. Un'ora e mezza di Muay Thai.\n\nIl Corpo\nSparring con un ragazzo forte: calci pesanti, meno pugni. Gli ho mostrato qualche entrata in single leg per l'MMA. Tornato a casa ho costruito un sacco rudimentale — testandolo con un calcio ho quasi rischiato di fottermi un piede.\n\nIl Lavoro\n6-7 ore in quota sui pali. Stare appesi è già un allenamento calistenico massacrante.\n\nLa Mente\nL'upgrade vero è dietro le quinte: a breve il sito web proprietario. Lì dirò quello che mi pare, come mi pare, senza sottostare all'algoritmo di Instagram.\n\n118 giorni rimasti.	/objects/uploads/7f0462ad-ff1e-44e3-9605-abbc90ec254d	2026-07-12 12:03:47.551089+00	75	15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
63	66	2026-07-05	\N	\N	100	\N	\N	\N	\N	\N	GIORNO 66\n\nLa disciplina non si applica solo sui tralicci o sul tappeto — si applica anche alla precisione millimetrica di Apex Detailing.\n\nIl Lavoro\nSessione chirurgica sugli interni: aspirazione profonda, diluizioni calcolate al millilitro, estrattore a fondo. Rimuovere lo sporco radicato dai sedili richiede la stessa ostinazione di uno sparring a terra. L'acqua nera estratta dai tessuti è la prova tangibile del valore premium.\n\nLa Mente\nIl percorso verso la Thailandia non ammette sconti. L'obiettivo di questi 180 giorni non è solo incassare o diventare fisicamente dominanti — è dimostrare ogni giorno che la volontà pura piega gli ostacoli. Che si tratti di sottomettere un avversario sull'erba o di lanciare un'azienda da zero, il principio è identico.\n\n114 giorni rimasti.	/objects/uploads/78973e3d-e9e9-4ccf-adae-eac9194366a8	2026-07-19 10:24:29.265875+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
83	77	2026-07-27	2200	8	0	0	5	0	84	71	Oggi la mole di lavoro fisico è stata pesante. Tennis, 10 km di corsa, 6 round di sparring. Uno dei migliori sparring fatti finora, non perché ho fatto bene — è stata una doccia di umiltà. Ho incassato colpi seri e ho capito che ci sono situazioni che ancora non so gestire. Nessun ego. L’ego non serve a chi vuole davvero migliorare. Negli sport da combattimento servono decenni per diventare bravi, e il doppio per capire se hai talento. Per questo non mi preoccupo, vado avanti. Ogni colpo preso oggi deve insegnarmi qualcosa domani.\n\nNessun aggiornamento su J Detailing oggi.\n\nQuesto è Progetto J, 180 giorni per cambiare vita.\n\n103 GIORNI ALLA FINE\n\nIC XC NIKA	/objects/uploads/bd7ac279-7fdd-49d7-8cc4-37df3881056f	2026-07-26 22:00:08.570238+00	0	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
50	53	2026-06-22	2300	6.5	100	100	7	\N	83.9	66	GIORNO 53\n\nUn round a vuoto per accendere il motore, poi 100 flessioni e 100 addominali. Il corpo sveglio meglio del caffè.\n\nIl Corpo\n6 round a vuoto, 30 minuti al sacco, un'ora e mezza di grappling. Il peso scende gradualmente, il condizionamento migliora.\n\nIl Business\nLavori di detailing per Apex. Controllato l'orto. Registrato un video lungo per YouTube.\n\nPer arrivare a qualunque traguardo non servono gesti eroici casuali. Serve una somma inarrestabile di piccoli miglioramenti applicati ogni giorno.\n\n127 giorni rimasti.	/objects/uploads/dec1b00c-e26a-46f0-9440-428faaa83345	2026-07-12 11:33:27.459855+00	72.04	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
60	63	2026-07-02	2200	8	100	100	4	0	83.9	68	IORNO 63\n\nOggi combatte McGregor. L'energia è quella giusta.\n\nIl Corpo\nScaricata direttamente su un campo. Niente gabbia, solo erba e sparring crudo di MMA. Round da 3 minuti per simulare il match. Double leg pulito, americana chiusa, armbar piazzato. Incassato un calcio al fegato, preso la monta con qualche cazzotto in bocca, e un collo chiuso per un mio errore di difesa. Sulle entrate in single leg devo correggere — l'ho preso troppo frontale.\n\nIl Lavoro\nIl lavoro sui pali non si ferma. È la base che sostiene le finanze e aggiunge carico fisico alla giornata.\n\n117 giorni rimasti.	/objects/uploads/59423ee7-d69d-463a-b507-3e636d54941b	2026-07-12 12:07:28.799477+00	80	60	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
61	64	2026-07-03	1800	6	100	100	7	0	84.7	71	GIORNO 64\n\nNessuna tregua.\n\nIl Lavoro\nIl primo allenamento della giornata è durato 8 ore: lavoro puro in quota, appeso ai tralicci. Condizionamento reale, grezzo.\n\nIl Corpo\nSubito dopo il turno, un'ora e mezza di boxe e 100 flessioni. Entrare in palestra e tirare per 90 minuti dopo essersi spaccati la schiena per 8 ore è il vero filtro di questo percorso.\n\nLa Mente\nOgni giornata produttiva è ossigeno per scalare Apex Detailing e accumulare il budget per la Thailandia. Qui muore la motivazione temporanea. Subentra la disciplina cruda.\n\n116 giorni rimasti.	/objects/uploads/c95aa788-25f9-405e-9a79-e9810854c8b3	2026-07-19 10:21:57.44588+00	72	15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
62	65	2026-07-04	2200	6	0	0	4	0	84.5	69	GIORNO 65\n\nLa visione si allarga. I target diventano chirurgici.\n\nIl Business\nIl piano impone di blindare 3.000€ netti nei prossimi 5 mesi. Calcolare le entrate con freddezza, tagliare le uscite inutili, accelerare Apex Detailing. Non si tratta solo di spaccarsi la schiena — si tratta di alzare il valore del servizio.\n\nLa Mente\nIl progetto non riguarda più solo le performance individuali. Nuova missione: guidare un amico a perdere 30 kg. Dimostrare che la disciplina forgiata in questi giorni può cambiare la vita anche di chi ti sta intorno.\n\n115 giorni rimasti.	/objects/uploads/8b99f47a-9397-4d17-b804-7edc21788169	2026-07-19 10:24:28.902444+00	72	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
70	74	2026-07-15	1450	5.5	60	100	0	0	83.6	74	GIORNO 74\n\nLavoro fisico intenso fin dal mattino. Ore massacranti sui tralicci, testa bassa, macinare senza sosta.\n\nIl Lavoro\nNiente palestra, niente tatami. Il turno in quota ha preso tutto. La disciplina non si è fermata — si è spostata sulla testa e sul lavoro.\n\nIl Business\nLa costruzione dell'infrastruttura tra lavoro in quota e Apex Detailing ha preso la priorità. Non mi lamento — c'è sempre qualcosa da fare e su cui impegnarsi.\n\nIl Progetto\nIl sito è offline. Lo sto ricostruendo per renderlo impeccabile. A breve tornerà con qualcosa che non si è mai visto.\n\n106 giorni rimasti.	/objects/uploads/b463b060-56dc-4143-a98a-63bde01a287c	2026-07-25 20:05:40.656957+00	72	40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
71	75	2026-07-16	\N	\N	\N	\N	\N	\N	\N	\N	\N	/objects/uploads/6868a66a-313b-4f9e-85ef-fe51a9e4cadb	2026-07-25 22:34:10.495211+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
72	76	2026-07-17	2100	5.5	100	100	0	10	83.5	69	GIORNO 76\n\nSi torna a spingere dopo una settimana di reset.\n\nIl Corpo\nIl corpo ha riposato abbastanza. La struttura è pronta per riprendere il volume. Da oggi si ricomincia a macinare sul tatami.\nho corso 10 km in 58 minuti\nIl Lavoro\nTurno completato. La routine non cambia — il cantiere finanzia tutto il resto.\n\nLa Mente\nUna settimana lontano dal progetto mi ha fatto capire una cosa: la macchina non si ferma mai davvero. Anche quando non ti alleni, la testa continua a costruire.\n\n104 giorni rimasti.	/objects/uploads/b46b4504-08a0-4799-82e2-f50fd3991295	2026-07-25 22:34:11.029592+00	72	15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
84	78	2026-07-28	\N	\N	\N	\N	\N	\N	\N	\N	Lavoro Parma \n1600 kcal \n5 ore sonno \nInfo a breve	/objects/uploads/b4cfff93-ea0b-4dc5-8c4d-04c25143f237	2026-07-28 19:19:43.194531+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
85	79	2026-07-28	\N	\N	\N	\N	\N	\N	\N	\N	Sveglia 5.40\n5 ore sonno \n1400 kcal 5 l acqua\n0 allenamento \n8h cantiere	/objects/uploads/6e2f5137-aa14-4cf7-81ff-d08ff8389855	2026-07-28 19:20:16.401869+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
86	80	2026-07-29	\N	\N	\N	\N	\N	\N	\N	\N	\N	/objects/uploads/97bb4b81-e124-4482-9f80-644fd24f165b	2026-07-28 22:00:01.978514+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
87	81	2026-07-30	\N	\N	\N	\N	\N	\N	\N	\N	\N	/objects/uploads/df8e3d9b-df6e-4fc3-a33e-5adcbe191bfb	2026-07-29 22:00:03.319552+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
18	18	2026-05-19	1600	6	100	70	5	\N	85	75	GIORNO 18\n\nC'è un confine netto tra chi parla di lanciare un'azienda e chi lo fa davvero. Quel confine è il momento in cui i soldi escono dal tuo conto per comprare l'infrastruttura fisica.\n\nSveglia alle 5:40. 8 ore di roofwork e carpenteria, 100 flessioni, 70 addominali. Un'ora e mezza di grappling la sera.\n\nL'OODA Loop di oggi si è concentrato sui numeri. Il cruscotto finanziario segna un netto di -200€. Per la mentalità comune è una perdita. Per il Progetto J è il primo vero passo operativo: 202€ investiti nell'acquisto di prodotti professionali. J Detailing non è più un piano su un foglio di carta, ora è un magazzino. Esiste nella realtà. Entrate +72€, uscite -272€.\n\nIl sistema rileva due falle da chiudere subito. La prima è l'alimentazione: 1600 kcal in con 64g di proteine, a fronte di 4400 kcal totali bruciate tra cantiere e tatami. L'apporto proteico è gravemente insufficiente per sostenere la struttura muscolare, il corpo è sotto stress doppio, non ci si può permettere il catabolismo.\n\nLa seconda falla è il tabacco: 24€ bruciati in qualcosa che non costruisce né il corpo né l'azienda. Da domani si taglia.\n\nSi analizza, si corregge, si esegue.\n\n162 GIORNI ALLA FINE	/objects/uploads/0aae51a2-a310-48d0-bbfc-aaf9ae370d9a	2026-07-05 12:53:48.406747+00	72	272	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
35	38	2026-06-07	1750	7.5	100	100	10	\N	84.3	71	GIORNO 38\n\nLa testa dice "non ho fatto niente". I fatti dicono altro.\n\nIl Corpo\nPresentato in palestra alle 6 per un errore di orario. Ora di buco usata per lavorare a vuoto e al sacco sui calci saltati. Poi la lezione vera: 10 round totali, 3 minuti di flessioni, 9 di sacco, addome e squat. Studio delle gomitate in stile thailandese.\n\nIl Lavoro\nTaglio erba e legna. 72€ in cassa.\n\nLa Mente\nLa sensazione di non aver fatto abbastanza non sempre dice la verità. Quello che dice la verità sono i macro: 1.440 calorie e 42g di proteine. Troppo basso. Si sistema domani.\n\n142 giorni rimasti.	/objects/uploads/e0e450ed-4dd9-4a99-88dc-fdc44bec3ea2	2026-07-12 10:01:40.384934+00	72	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
64	68	2026-07-07	2100	6	100	0	1	0	84	69	GIORNO 68\nIl condizionamento non avviene solo in palestra.\nIl Corpo\nSi parte con BJJ improvvisato col cane — rischiando una mano. Poi fai-da-te estremo: costruzione e levigatura di uno strumento in legno per il condizionamento crudo delle tibie. Chiusura con un'ora e mezza di Brazilian Jiu-Jitsu vero, con uno specialista. Un armbar perfetto subìto cambia la prospettiva su questa disciplina. Da venerdì diventa appuntamento fisso — per completare l'arsenale da striker con quello che manca.\nIl Business\nIl Progetto J fa il salto verso la matematica. I video motivazionali non bastano — servono i numeri crudi. Annunciata l'integrazione del Quantified Self nel sito proprietario: calorie, finanze, fatica — tutto pubblico, tutto tracciato. Dimostrare che si può cambiare vita in 180 giorni significa avere controllo assoluto sui propri dati. Non dipendere da nessuno.\n112 giorni rimasti.	/objects/uploads/d61fbb10-f002-4798-bae1-b734715ca2e2	2026-07-19 10:38:49.775305+00	50	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
65	69	2026-07-08	1780	6	100	100	7	\N	84	69	GIORNO 69\n\nSi torna a spingere.\n\nIl Corpo\n2 round di pao per settare il ritmo, poi 5 round di hard sparring K1 con scambi pesanti. Calci, pugni, pressione costante. Il condizionamento si mantiene solo se continui a metterti in situazioni scomode — e oggi era scomodo.\n\nIl Progetto\nQuesto è il giorno in cui il Progetto J cambia categoria. Il sito è live. Tutti i dati, le metriche, le descrizioni dei 69 giorni — centralizzati, pubblici, consultabili. Non è più solo documentazione sui social. È infrastruttura proprietaria, tracciamento totale.\n\nL'Ecosistema\nI topi in allevamento crescono forti. Anche questo è parte del sistema.\n\n111 giorni rimasti.	/objects/uploads/1b78721d-b84e-4fff-b0a2-5fa2c2bfd4a1	2026-07-19 10:59:25.704356+00	0	45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
95	82	2026-08-01	\N	6	0	0	0	10	81.1	69	Stamattina ho lavato una panda \nIl pomeriggio sono andato al Ikea a comprare dei mobili \nLa sera ho lavato una Mazda\nLa sera ho lavorato al project 	/objects/uploads/8d19ae86-d490-4bd6-a124-faf7f874d58f	2026-08-01 16:59:35.019957+00	110	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
96	83	2026-08-02	1900	6.5	0	0	0	0	80.9	74	Giornata incentrata sul detailing\nHo pulito gli interni di un furgone Iveco , veicolo aziendale estremamente sporco\nHo pulito i sedili e rimosso il fango \nNel pomeriggio mi sono fatto un bagno in piscina 	/objects/uploads/a805b838-dc5d-48b2-ab9c-7153ea37c9cf	2026-08-01 22:00:02.185411+00	40	15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
97	84	2026-08-03	1900	5	40	0	0	0	81.1	66	Stamattina mi sono svegliato alle 5.40 ho fatto 40 flessioni e 40 addominali \nPoi sono andato a lavoro \nAbbiamo smontato un palo in bolo centro \nSuccessivamente siamo andati in magazzino a sistemarlo \nAl termine (16) sono andato a fare detailing per mio conto su un camion , igienizzando intera cabina	/objects/uploads/fb51ca16-f43a-483e-9691-196e667d74ae	2026-08-02 22:00:10.497836+00	72	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
98	85	2026-08-04	1890	5	0	0	0	0	81.1	69	Giorno 85\nOggi ho finito un impianto TLC In E-Romagna.\n8h di lavoro con 5 ore di sonno al esterno con 38 gradi celsius e imbracatura non sono una buona combinazione.\nHo preparato il materiale per lavare ultime macchine e aggiornato il sito montando un motore di ricerca per I Giorni.\nQuando sarò in ferie aggiornerò tutto 	/objects/uploads/2f037e54-45f4-4bfb-93a4-04ba32461857	2026-08-03 22:00:02.788495+00	72	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7	7	2026-05-08	2450	6.5	103	100	\N	9.4	86.2	75	GIORNO 7\nLa teoria non serve a niente se non hai il fegato di applicarla dove il rischio è reale. Giornata iniziata con l'addestramento indoor, appesi alle funi in un ambiente controllato. Ma l'uomo olistico non vive nelle simulazioni. Qualche ora dopo ero agganciato a un traliccio delle telecomunicazioni, vuoto sotto i piedi e vento in faccia. È lì che misuri davvero il controllo del tuo sistema nervoso.\nIl lavoro in quota è fatica isometrica pura, 4 ore appeso equivalgono a sessioni infinite di trazioni, sommate alle 4 ore indoor. Nonostante i 9.60 km macinati prima, 100 flessioni e 100 addominali, la giornata non chiudeva al tramonto. Mentre la città dormiva, io ero al parco, nel buio totale, a sferzare l'aria con le battle ropes.\nPeso a 86.2 kg, battito a riposo sceso a 75 bpm. Il telaio si alleggerisce, il motore diventa più efficiente. 2450 kcal assunte contro oltre 2900 basali bruciate.\nEntrate 101.7€, uscite 33€, investite in infrastruttura AI per automatizzare e scalare. Non c'è separazione tra dominare la gravità e dominare il codice.\n173 GIORNI ALLA FINE	/objects/uploads/5eda86e0-8477-4027-9772-8370fe119ebf	2026-07-05 11:48:06.139643+00	101	33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
14	14	2026-05-15	3060	8	100	100	\N	12	85.7	71	GIORNO 14\n\nLa crescita richiede brutale onestà. Oggi i numeri hanno acceso una spia rossa.\n\nLa Mente\n36,50€ bruciati in una sera tra cibo spazzatura e uscite non pianificate. Mentre J Detailing è in fase di lancio, è una contraddizione inaccettabile. Da domani il budget giornaliero è bloccato a 10€ massimi. Zero eccezioni.\n\nIl Corpo\n10 km di corsa chiusi nonostante i crampi. 90 quiz patente eseguiti.\n\nLo scrivo pubblicamente perché i numeri brutti si pubblicano. Soprattutto quelli.\n\n166 giorni rimasti.	/objects/uploads/42f38aaf-c25b-4a6a-903b-be8c26cf1d0a	2026-07-05 12:35:44.676568+00	\N	36	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
21	21	2026-05-22	1730	8	100	100	5	\N	84.9	67	GIORNO 21\n\nC'è una differenza enorme tra fermarsi e spostare il carico.\n\nIl Business\nPrimo accordo intercontinentale del progetto — partnership con un trader. Prossimo step per J Detailing definito. Le reti si costruiscono in silenzio.\n\nIl Corpo\n5 round di sparring Thai sull'erba. Paratibie e impatto reale, niente palestre di lusso.\n\nLa Mente\nIl report alimentare è un disastro: 45 grammi di proteine. Quando i dati mostrano una debolezza, non ci si giustifica. Domani la quota torna sopra i 150g.\n\n159 giorni rimasti.	/objects/uploads/24ff582f-5d29-49c3-a467-864ac1089f9c	2026-07-05 13:04:43.112781+00	72	9.87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
45	48	2026-06-17	2170	6.5	100	0	8	0	84.8	67	La giornata è partita steccando le solite 100 flessioni, per poi passare direttamente al lavoro manuale su un carro a 30 metri da terra. L'attrito non manca, ma il focus rimane operativo e costante. Dal cantiere sono andato dritto ad allenarmi: 2 ore e mezza di sessione chiuse con uno sparring di boxe per testare la struttura e "finirmi di spaccare le costole". Il test sul tatami è andato bene; il corpo incassa e risponde, segno che il recupero sta funzionando.\n\nDietro le quinte, il lavoro di costruzione continua. Sto sbloccando un nuovo livello di conoscenza in ambito social e grafico. Le competenze aumentano, i video migliorano e la visione del business si fa sempre più nitida. Il bilancio della giornata segna 72€ in entrata e 30€ in uscita, mentre i macro sono calcolati con 2170 kcal assunte contro le 1700 bruciate.\n\nC'è un'evoluzione in arrivo per il format: a breve sposterò tutti i dati biometrici e finanziari direttamente sul mio sito web, rendendo il tracciamento ancora più strutturato, pulito e indipendente. Tutto documentato, tutto calcolato, per dimostrare che con impegno e dedizione si può arrivare ovunque.	\N	2026-07-12 11:15:56.39916+00	72.07	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99	86	2026-08-05	3400	6	0	0	0	0	81	67	**Il Lavoro**\nSveglia alle cinque e mezza dopo cinque ore e cinquanta di sonno. Carpi. Giornata piena, mani sporche, niente da raccontare che non sia lavoro fatto.\n\n**Il Corpo**\nCheat meal al Burger King. Poi non mi sono fermato lì: ho continuato a mangiare male anche dopo, senza fame vera, per inerzia. Il primo era previsto. Il secondo no. È così che funziona: non è il pasto libero che ti frega, è quello che viene dopo, quando la giornata è già sbilanciata e ti dici che tanto ormai.\n\n**Il Business**\nDetailing nel pomeriggio. Poi valigia. Domani si parte.\n\n**La Mente**\nIl peso stamattina era il più basso da mesi. Stasera ho fatto il contrario di quello che quel numero mi chiedeva. Nessuna scusa, nessun dramma. Lo scrivo qui perché il diario serve a questo: se lo tengo solo nei giorni puliti non serve a niente.\n\nDomani sveglia presto lo stesso.\n\n94 giorni rimasti.\n\nIC XC NIKA	/objects/uploads/4bc60d7e-e923-4ea5-a8d3-8beef648da8a	2026-08-04 22:00:01.736651+00	73	21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
100	87	2026-08-06	2400	6	0	0	0	0	81.7	71	Il Lavoro\nSveglia alle cinque e mezza. Bologna, sistemazione di un’antenna. Poi sushi, e ho mangiato abbastanza.\n\nIl Corpo\nIl debito di sonno di questo mese ha presentato il conto. Ho dormito nel pomeriggio, cosa che non faccio quasi mai. Non è pigrizia, è aritmetica: quello che togli la notte lo paghi, e decide lui quando.\n\nIl Progetto\nNel pomeriggio ho pubblicato diversi articoli. Sono qui sotto.\n\nDomani si lavora, poi si parte. Direzione Polonia.\n\n93 giorni rimasti.\n\nIC XC NIKA	/objects/uploads/b6b76aa4-0bce-4237-b977-21ace64b51a3	2026-08-07 04:21:09.385682+00	100	25	93 giorni alla fine. Tutto quello che ho fatto oggi è documentato. Nessuno mi paga per farlo.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
101	88	2026-08-07	1900	4	30	30	0	0	81.7	71	Il Lavoro\nQuattro ore di sonno e sveglia lo stesso. Bologna centro, chiuso il progetto di collegamento antenne. Finito presto, salutati i colleghi.\n\nIl Corpo\nDieci giorni senza allenarmi. Lo sento addosso e non lo nascondo. Non è la forma che manca, è il vuoto dove prima c’era l’ora in cui non pensavo a niente. Appena arrivo si ricomincia.\n\nIl Progetto\nPomeriggio a casa, borse organizzate, il braccio progettato.\n\nLa Mente\nScrivo dall’auto, cento chilometri dall’Austria. Nessun condizionatore, agosto. Diciotto ore davanti.\n\nDio è con me.\n\n92 giorni rimasti.	/objects/uploads/7fbeb28f-4a24-4fa5-9dab-3d020cb20082	2026-08-07 04:21:09.39762+00	70	30	Quattro ore di sonno, poi il turno. Dieci giorni senza allenarmi e li sento tutti. Scrivo da un’auto senza aria condizionata, a cento chilometri dall’Austria.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
104	91	2026-08-10	2500	6	0	0	0	0	82.3	74	Il Lavoro\nSim bielorussa sbloccata. Due VPN attive per esportare i dati e tenerli criptati. Non mi fido dell’Italia e non mi fido della Russia. I miei dati restano miei.\n\nIl Corpo\nNel pomeriggio sono entrato in una palestra qui. Ho conosciuto un fighter professionista di MMA. Ci alleneremo insieme. Dieci giorni senza guantoni, si ricomincia dall’altra parte dell’Europa.\n\nIl Business\nSpesa e cambio valuta. I rubli bielorussi sono banconote bellissime — il tipo di soldi che tieni in mano e guardi prima di spendere.\n\nLa Mente\nLa sera Minsk con amici. Siamo stati a parlare fino alle cinque di tutto, di niente, del tipo di conversazioni che non hanno un argomento e non finiscono.\n\nSono innamorato di questo paese.\n\n89 giorni rimasti.\n\nIC XC NIKA	/objects/uploads/7b1a5c3a-e6a6-404b-b069-1bb607256302	2026-08-12 04:07:37.604039+00	0	80	Dieci giorni senza guantoni. Oggi ho trovato un fighter professionista dall’altra parte dell’Europa. Si ricomincia.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
23	23	2026-05-24	2626	5	100	100	8	\N	84.4	68	GIORNO 23\n\nDopo la decompressione, il sistema andava resettato con la violenza.\n\nIl Lavoro\nSveglia alle 5:30, in cantiere con il buio. Scala verticale di 30 metri. Turno spezzato tra mattina e pomeriggio.\n\nIl Corpo\nLa sera, nuova palestra di kickboxing. Un'ora e mezza di Muay Thai: 4 round di pao, 4 round al sacco, poi un circuito di burpees, skip, flessioni e plank. Ho strizzato la maglietta cinque volte. Non era sudore — era acqua che cadeva sul tatami.\n\nNuova palestra. Nuovo livello.\n\n157 giorni rimasti.	/objects/uploads/462f24ab-fed7-4b21-a3c3-90b1b76226ef	2026-07-05 13:10:30.458132+00	370	176	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
37	40	2026-06-09	2150	8	100	100	3	0	83.8	70	GIORNO 40\n\nLa costola si fa sentire. Inutile forzare il telaio.\n\nIl Corpo\n100 flessioni, 100 addominali, 45 minuti di mobilità e stretching. Niente impatto, niente tatami. Il corpo non si spegne — si adatta.                                                                                      \n\nIl Lavoro\nTurno pesante in quota su pali e tralicci. Con il fianco che tira, ogni movimento richiede il doppio della concentrazione.\n\nIl Business\nInventario attrezzatura per Apex Detailing. Invece di comprare a caso, ho svuotato i borsoni e catalogato tutti i pennelli già a disposizione. Ottimizzare le risorse presenti è il primo passo per un business solido.\n\n140 giorni rimasti. IC XC NIKA.	/objects/uploads/4521c5a6-1b02-4849-8862-b95b25caad11	2026-07-12 10:10:03.699057+00	110	1.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
52	55	2026-06-24	2800	7.5	0	0	0	0	84	64	GIORNO 55\n\nI muscoli riposano dalla palestra. L'attrito fisico compensato dal lavoro mentale.\n\nIl Business\nContinuato a spingere sull'azienda e sul detailing. 60€ portati a casa.\n\nLa Mente\nCena fuori in un posto incredibile — candele, atmosfera da film. Ricaricato i carboidrati e riposato la testa.\n\nUna precisazione: smettetela di scrivermi nei DM per chiedermi metodi per fare soldi veloci. L'unico modo per farli in fretta senza sforzo è rischiare il carcere, e non ne vale la pena. Non esistono scorciatoie. Studiate, impegnatevi ogni giorno, mantenete la rotta.\n\n125 giorni rimasti.	/objects/uploads/b755528f-1276-415b-a54f-2df57bf2c552	2026-07-12 11:40:03.420543+00	60	45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
38	41	2026-06-10	2400	6.5	0	0	7	3	83.7	69	GIORNO 41\n\nIl dolore ti costringe a cambiare prospettiva.\n\nIl Corpo\nUn'ora e mezza di lotta romana e 2 round a vuoto. La costola è gestibile se non riceve colpi diretti — niente striking oggi. Le prese e gli sbilanciamenti costringono a usare il core in modo intelligente. 100 flessioni chiudono la giornata.\n\nIl Business\n45€ investiti in laboratorio: test sulle diluizioni chimiche, rapporti tra prodotti su plastiche e tessuti. Apex non sarà un semplice lavaggio — sarà ingegneria delle superfici.\n\n139 giorni rimasti.	/objects/uploads/7691d214-e28c-4379-934c-3059c71b7983	2026-07-12 10:13:01.264423+00	75	45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
42	45	2026-06-14	2100	7	100	\N	\N	9	83.7	68	GIORNO 45\n\nGiornata assurda.\n\nIl Lavoro\nTrasferta a Verona, incidente visto sulla strada. Salito sul palo a 50 metri a montare antenne. Poi a casa della signora a pulire — problemi con gli insetti.\n\nIl Corpo\n100 flessioni. Un'ora di calcetto con gli amici — 9 km corsi, un gol segnato. Il background negli sport da combattimento serve anche per il pallone, ma non sono buono con i piedi.\n\nLa Mente\nOggi mi sono fermato a ragionare su come rendere di più e tagliare gli sprechi. L'ho messo nero su bianco. Non aspetto che le cose migliorino — le smonto, le studio, le rimetto insieme meglio.\n\n135 giorni rimasti.	\N	2026-07-12 11:02:31.369201+00	111.95	25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
66	70	2026-07-11	1700	6	0	0	0	6.1	84.5	68	GIORNO 70\n\nIl telaio ha bisogno di scarico dopo aver spinto al limite.\n\nIl Lavoro\nIl lavoro manuale continua. Il focus fisico si sposta — sessione di tennis con mio fratello invece del solito striking. Non è una pausa, è defaticamento calcolato.\n\nLa Mente\nCena fuori. Stacco dal progetto per ricaricare la testa.\n\nAlternare i carichi non è mollare — è gestione. Chi spinge sempre allo stesso modo si spegne prima del traguardo.\n\n110 giorni rimasti.	/objects/uploads/276456ed-0b88-4c09-bde9-5f565ed0fe8b	2026-07-25 20:05:40.656957+00	290	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67	71	2026-07-12	2099	7	0	0	1	0	84.4	73	GIORNO 71\n\nL'infrastruttura digitale non si prende pause.\n\nIl Progetto\nIl sito web del Progetto J è ufficialmente online. Tutti i dati, le metriche, le descrizioni — centralizzati, pubblici, consultabili. Il codice è in rete. Ora va monitorato, aggiornato e spinto al massimo.\n\nIl Corpo\nIl lavoro manuale continua. Il corpo si riposa dall'impatto ma non si ferma.\n\nIl timer scorre. L'obiettivo non cambia.\n\n109 giorni rimasti.	/objects/uploads/1ddd2eb1-baf6-4813-8bea-aa48bd1a2acf	2026-07-25 20:05:40.656957+00	20	200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
68	72	2026-07-13	\N	\N	\N	\N	\N	\N	\N	\N	GIORNO 72\n\nLa classe di boxe è saltata. L'adattamento è l'unica via.\n\nIl Corpo\n12 round di pao, macinando combinazioni. La mente torna a quando ho iniziato — il telaio pesava 130 chili e il fiato si spezzava alla seconda ripresa. Un minuto di pausa ogni trenta secondi di lavoro, ma l'ordine era continuare a colpire fino alla fine. Oggi quei 12 round li chiudo senza fermarmi.\n\nIl Lavoro\nTurno completato. La mente settata sulle strategie da implementare per il business.\n\nQuesto è il nucleo del Progetto J: un timer di 180 giorni per dimostrare che con volontà e disciplina si può imparare a fare qualunque cosa.\n\n108 giorni rimasti. IC XC NIKA.	/objects/uploads/dbca5385-6fb6-4658-9fc7-3e3c69575a39	2026-07-25 20:05:40.656957+00	72	12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
69	73	2026-07-14	1959	6	42	92	8	0	84.6	71	GIORNO 73\n\nIl corpo incassa ma non si ferma.\n\nIl Corpo\nDue ore di lavoro: mezz'ora di greco-romana, poi sparring all'aperto e chiusura al sacco. Un livido sulla gamba da una botta presa — parte del gioco.\n\nIl Lavoro\nOtto ore in quota. L'infrastruttura avanza mentre il resto gira.\n\nIl Business\nTre chiamate di vendita: una chiusa, due andate a vuoto. Le chiamate a vuoto non rallentano il piano — sono attrito calcolato.\n\nLa Thailandia richiede fondi e disciplina. Testa bassa, si continua.\n\n107 giorni rimasti.	/objects/uploads/5022aebf-5184-4735-a6c4-2bbcfbdb4d21	2026-07-25 20:05:40.656957+00	100.02	25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1	1	2026-05-02	2100	6.5	300	300	13	0	87.3	82	GIORNO 1 DI 180: PUNTO ZERO\n\n\nDieci mesi fa pesavo 130 chili. Bevevo, fumavo, sprecavo l'ossigeno che mi era stato concesso. Oggi la bilancia segna 87 kg. La discesa all'inferno e il ritorno sono completati, ma questo non è il traguardo. Questo è il PUNTO ZERO.\n\nOggi si avvia ufficialmente il timer. Ho esattamente 180 giorni per costruire l'infrastruttura della mia vita. Non si tratta di motivazione, si tratta di pura e spietata ESECUZIONE.\n\nGli obiettivi scolpiti per la fine di questo conto alla rovescia sono tre, non negoziabili:\n\nL'Arena: Salire sull'ottagono per il mio primo match ufficiale di MMA.\n\nL'Impero Fisico: Aprire e fondare ufficialmente l'azienda, scalando J Detailing.\n\nL'Impero Digitale: Raggiungere i 50.000 iscritti per diffondere il messaggio.\n\nNon è un video per fare il fenomeno. È il primo mattone di una cattedrale. È solo costanza, impegno, un giorno dopo l'altro.\n\nMancano 179 giorni. Non c'è niente di difficile se sei disposto a pagare il prezzo.\nDATI OPERATIVI | GIORNO 1\n\nTELAIO E MOTORE: 87 kg | 78 bpm a riposo.\n\nCARBURANTE: 2100 Kcal IN / 3700 Kcal OUT.\n\nCONDIZIONAMENTO: 300 Flessioni | 300 Addominali | 300 Squat.\n\nCOMBATTIMENTO: 6 Round BJJ (5 min) | 5 Round Thai | 2 Round Vuoto.\n\nFLUSSO DI CASSA: Entrate sul campo +120€ | Investimento su me stesso -15€ (BJJ).\n\nIC XC NIKA\n#progettoj #icxcnika	/objects/uploads/4a02c798-eab1-481e-882f-ef197ad6ab18	2026-07-04 07:31:23.410889+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	3	2026-05-04	1930	7	175	150	5	3	87	76	Ho iniziato la giornata correndo fuori sentiero, in mezzo all'erba alta. Quando non hai l'asfalto sotto i piedi la biomeccanica cambia e l'attrito triplica. Ho finito con un crampo muscolare che mi ha costretto a zoppicare, un promemoria fisico che mi ricorda esattamente quanto sono ancora lontano dal traguardo.\n\nMa la disciplina non chiede permesso al dolore. Il dolore è solo telemetria. Quando sei abituato al comfort, un crampo è la scusa perfetta per fermarsi. Quando sei dentro il Progetto, è solo un'informazione in entrata che ti dice che il corpo si sta adattando.\n\nNel log ho segnato questa data come "Giorno di riposo". È un'ironia. Il mio riposo è stato tagliare l'erba sotto il sole per 60 euro, sporcarmi le mani per costruire un orto, chiudere un circuito in soglia anaerobica e farmi 5 round di hard sparring Thai. L'uomo olistico deve saper dominare il suo ambiente: produrre, coltivare, combattere.\n\nNon mi interessa quanti like fate sui social. Mi interessa quanti di voi oggi hanno avuto le PALLE di alzarsi dal divano e fare il lavoro sporco quando nessuno vi guardava.\n\nMancano 177 giorni.	/objects/uploads/32c1f8a7-aa3f-4dce-bde8-6eeed0002085	2026-07-05 11:19:52.102152+00	60	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	4	2026-05-05	1250	5	240	100	\N	4	87	83	GIORNO 4\n\nOre 4:50. Il mondo dorme, il timer corre.\n\nIl Lavoro\nPerugia. Corso per lavori in fune ad alto rischio. Per scalare, prima impari a cadere senza morirci.\n\nIl Corpo\nL'asfalto davanti all'hotel diventa palestra — 4 km in salita, 240 flessioni, 100 addominali, 21 minuti di corda. Zero pause.\n\nIl Business\nIl sedile dell'auto, di notte, diventa sala di comando. Meno di 50 giorni all'apertura ufficiale.\n\nLa società dice di bilanciare vita e lavoro. Io dico di far collassare tutto in un'unica esecuzione brutale. Costruisci nel mondo fisico, scala in quello digitale.\n\nNon c'è orario per chi ha fame.\n\n176 giorni rimasti. IC XC NIKA.	/objects/uploads/3e7995fb-7565-4b90-97df-50aef3d72533	2026-07-05 11:32:34.669216+00	70	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	5	2026-05-06	1310	5	80	\N	\N	4	86	82	GIORNO 5\n\nSveglia alle 5:50, corpo pesante per i postumi dell'hangover. La strada non aspetta che tu ti senta al 100%. Scarpe allacciate, 4 km in salita, tossine spurgate sull'asfalto. Peso 86 kg, battito 82.\n\nGiornata in quota. Esame pratico DPI superato con 26/30, poi 4 ore di addestramento appeso in corda per le manovre di emergenza. L'uomo olistico non deve solo saper colpire, deve saper gestire la fisica del proprio corpo nello spazio, che sia sul ring o a 30 metri da terra.\n\nIl cruscotto oggi segnala rosso: rischio catabolismo. 1310 kcal ingerite a stento dopo 5 ore di sonno. Deficit aggressivo per asciugare la struttura.\n\nEntrate 70, uscite 40. Anche i mercati battono rosso, -20€ su Palantir, ma la speculazione giornaliera è per chi non ha visione. Noi costruiamo per il lungo periodo.\n\nChi gioca si sente al 100% prima di partire. Chi costruisce parte comunque.\n\n175 GIORNI ALLA FINE	/objects/uploads/af07bea2-9086-488b-bda3-f36d4ee15179	2026-07-05 11:37:28.168173+00	70	40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	6	2026-05-07	2200	5.5	150	100	3	5	86.3	79	GIORNO 6\n\nLe nocche sbucciate sull'asfalto non sono un incidente di percorso — sono il timbro di chi sta facendo il lavoro.\n\nIl Corpo\nAddestramento diviso tra suolo e verticalità estrema. Flessioni e shadowboxing all'aperto, poi manovre di sicurezza a 30 metri di altezza. Quando sei appeso a un traliccio non c'è spazio per il rumore mentale — la gravità esige concentrazione assoluta.\n\nIl Lavoro\nDigiuno a pranzo per forzare la lucidità. Il corpo lavora meglio quando ha fame — niente digestione a rallentare il sistema nervoso.\n\nIl Business\nBTC in attivo. Il corpo che incassa colpi è lo stesso che scala strutture di metallo, ed è la stessa mente che muove capitali sui grafici.\n\nO sei olistico e domini ogni dominio, o sei la preda di chi lo fa.\n\n174 giorni rimasti. IC XC NIKA.	/objects/uploads/e876a6a2-0b72-4297-b7a2-0a65195fca04	2026-07-05 11:42:52.65759+00	105	35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8	8	2026-05-09	1950	7	150	100	2	17.6	86	74	GIORNO 8\n\nLa prima settimana è andata. È servita a testare le guarnizioni del motore, a capire quanto attrito il telaio poteva sopportare prima di cedere. Ora si accelera.\n\nOggi in strada una Lamborghini GTO verde acceso. La maggior parte delle persone si ferma a guardarla sperando in un colpo di fortuna. L'uomo olistico sa che quella macchina è solo l'estensione metallica di un mindset che non accetta la mediocrità. Il prezzo per non essere mediocri si paga ogni mattina sull'asfalto, a petto nudo, pompando flessioni quando i muscoli bruciano.\n\n9.6 km di corsa, 8 km di camminata per la città, 2 round a vuoto, 150 flessioni, 100 addominali, calistenia in strada e shadow boxing.\n\nChiusa la prima settimana del Progetto con $526.70 di profitto reale a mercato: +10€ su BTC, -20€ sulle piante dell'orto. Non è fortuna, è la stessa spietata disciplina che applico nel gestire i colpi e il rischio sul ring.\n\nMentre gli altri si fermano a guardare le macchine, io continuo a costruire l'uomo. Il tempo è l'unica risorsa che i mercati non mi faranno ricomprare.\n\n172 GIORNI ALLA FINE	/objects/uploads/f51c747b-65cd-4d98-a278-8a9cddd47965	2026-07-05 12:00:36.834655+00	10	50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9	9	2026-05-10	1448	5	100	\N	6	11	86	74	GIORNO 9\n\nNon esiste zona di comfort quando passi 60 minuti agganciato a scale verticali in quota. Il peso del metallo addosso, la forza di gravità sotto i piedi. L'ambiente non si adatta a te, sei tu che devi dominare l'ambiente.\n\nSceso dal traliccio, non si stacca. 5 km di corsa, 6 km di camminata, 100 flessioni, 100 a vuoto. La preparazione fisica richiede una gestione millimetrica del carburante: 1450 kcal ingerite, 3.6 litri d'acqua per ripulire il sistema. Deficit calcolato, chirurgico, per tagliare il peso in vista del match.\n\nLe chiacchiere stanno a zero. Restano solo i dati, i fatti, il sudore.\n\n171 GIORNI ALLA FINE	/objects/uploads/fda4f2cf-65c4-4276-8f10-3e2c398176e6	2026-07-05 12:14:47.868554+00	70	800	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
146	34	2026-06-03	1700	9	0	0	0	0	\N	\N	Terzo giorno. Comincio a sentire la mancanza dell'allenamento più del dolore. Le mani non sanno dove stare. Ho contato le piastrelle del soffitto: centottantadue.\n\n146 giorni rimasti.	/objects/uploads/bf55a34f-0bef-4754-b731-bf81f27c4a79	2026-08-18 00:26:55.0676+00	50	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
13	13	2026-05-14	1850	6	70	100	\N	16	85.8	71	GIORNO 13\nUn carrello della spesa pieno. -200€ sul conto. La maggior parte delle persone vede solo una spesa, io vedo esattamente l'investimento necessario per tenere in piedi la macchina. Il cibo non è un premio, è carburante tattico. 200g di carboidrati, 100g di proteine, 400g di verdure per un totale di 1850 kcal millimetriche.\nLa giornata ha richiesto ogni singola caloria. Sul lavoro ho chiuso 3 salite e 3 discese tecniche su un traliccio a 8 metri di altezza, sforzo fisico puro unito al controllo mentale. Sceso dal metallo, ho macinato sull'asfalto: 10 km di corsa a passo 6:02/km, altri 6 km di camminata tattica, condizionamento a terra con 70 flessioni e 100 addominali.\nIl cruscotto a fine giornata segna 3000 kcal bruciate totali, di cui 1500 solo dalle attività, deficit netto di circa 650 kcal. Peso sceso a 85.8 kg, cuore più efficiente a 72 bpm.\nSpendi i tuoi soldi per intossicarti nel weekend o li investi per forgiare l'armatura? La scelta definisce chi sei.\n167 GIORNI ALLA FINE	/objects/uploads/84e6c05a-8415-46f0-b7fb-d7c1dc7b6ea5	2026-07-05 12:30:37.844519+00	85	206	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
15	15	2026-05-16	1800	10	\N	\N	\N	10	85.5	71	GIORNO 15\n\nNon tutti i giorni sono fatti per distruggere il corpo. Alcuni sono fatti per costruire la macchina sotto.\n\nIl Corpo\n10 ore e mezza di sonno. Il corpo ha presentato il conto dopo 30 km in tre giorni e si è preso esattamente il riposo che serviva.\n\nIl Business\nOre al computer per strutturare l'ecosistema digitale del progetto. Prima uscita finanziaria netta registrata. Il problema: zero azioni concrete per il lancio di J Detailing. Costruire strumenti non deve diventare una scusa per evitare il lavoro sporco.\n\nDomani sveglia alle 5:30. Non è negoziabile.\n\n165 giorni rimasti.	/objects/uploads/8adfa881-869e-48e3-bde4-c3c71efe4859	2026-07-05 12:38:12.769346+00	\N	23	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
16	16	2026-05-17	1390	6	100	73	\N	10	85	69	GIORNO 16\n\nSveglia alle 5:30. 100 flessioni, 70 addominali. Poi il cantiere.\n\nIl Lavoro\n10 ore di carpenteria e lavoro in quota. L'istinto biologico ordina di fermarsi dopo un turno del genere. Ho allacciato le scarpe e ho corso 10 km. Crampi ogni due chilometri. Finita lo stesso.\n\nIl Business\nPer la prima volta dall'inizio del progetto, i mercati hanno generato profitto. Il sudore finanzia, gli investimenti moltiplicano.\n\nHo saltato il pranzo per ottimizzare i tempi — errore. Il deficit che ne è uscito ha causato i crampi. Da correggere.\n\n164 giorni rimasti.	/objects/uploads/20952af6-89a4-4653-aae8-6171334c647d	2026-07-05 12:41:12.4001+00	162	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
17	17	2026-05-18	2500	5.5	400	270	9	\N	85.2	69	GIORNO 17\n\nIl giorno più denso dall'inizio del percorso.\n\nIl Lavoro\nSveglia all'alba. Trasferta a Imola. 9 ore di cantiere e carpenteria. Carico, scarico, montaggio, sudore sul metallo.\n\nIl Corpo\nNessun riposo al rientro. Direttamente in palestra: 300 flessioni, 200 addominali, shadow boxing e 6 round di sparring duro. Il corpo ha bruciato quasi 4000 calorie.\n\nIl Business\nIl saldo netto chiude in positivo. Dopo la palestra, editing e costruzione digitale di J Detailing.\n\nNessuno vede questi giorni. Non ci sono applausi alle 6 del mattino o sotto i colpi dello sparring. Ma sono questi i giorni che costruiscono l'impero.\n\n163 giorni rimasti.	/objects/uploads/d3cc9e53-786e-4741-9158-5c4291147812	2026-07-05 12:51:48.880095+00	87	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
19	19	2026-05-20	2490	6	200	200	14	\N	85	69	GIORNO 19\n\nUn obiettivo scritto su un foglio è un'allucinazione finché non inizi a sanguinare per raggiungerlo. Oggi il match di MMA ha smesso di essere teoria ed è diventato una realtà fisica sul tatami. Primo allenamento ufficiale di Muay Thai del Progetto.\n\nSveglia alle 5:30. 100 flessioni e 100 addominali a freddo per imporre il ritmo. Poi 9 ore di cantiere a Bologna centro, a scaricare materiale e gestire il magazzino. La stanchezza ha colpito duro nel pomeriggio. Ho dormito su una panchina pubblica.\n\nL'analisi dell'OODA Loop su questo evento è chiara: addormentarsi su una panchina non è un segnale di debolezza, è cruda gestione delle risorse. Il telaio era in riserva, il corpo ha preso l'ossigeno e il recupero che gli serviva esattamente nel tempo e nello spazio a disposizione, pur di garantire la lucidità per l'allenamento serale.\n\nIn palestra il motore è stato spinto al massimo: altro condizionamento a terra, sacco, corsa, 7 round di pao e 3 di colpitori. 200 flessioni e 200 addominali totali, 9 minuti di corsa, 9 minuti di sacco.\n\nIl cruscotto rileva un saldo finanziario positivo, +48.80€ netti (entrate +72€, uscite -23.20€), ma evidenzia una falla critica nel carburante: 90 grammi di proteine sono insufficienti per compensare un dispendio di quasi 3000 calorie. 2490 kcal in, 2970 out. Il muscolo rischia di cannibalizzarsi. La decisione è già presa: ricalibrazione macro-nutrizionale obbligatoria da domani.\n\nSi documenta, si corregge, si esegue.\n\n161 GIORNI ALLA FINE	/objects/uploads/804719f7-c49f-45dd-b08f-6c08f1cd94ba	2026-07-05 12:58:47.940574+00	72	23	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
20	20	2026-05-21	2900	5	100	100	\N	10	84.9	69	GIORNO 20\n\nNon farti ingannare da chi ti vende l'esaltazione costante. Nessun progetto di 180 giorni è fatto esclusivamente di trionfi, record battuti e giornate epiche. Il Giorno 20 è la cruda realtà della meccanica del mantenimento: metti un piede davanti all'altro e fai girare la ruota.\n\nMattina partita con 5 km di corsa a 5:10/km e 5 km di camminata. Poi il lavoro in quota. L'OODA Loop di oggi ha registrato la necessità di scaricare il sistema nervoso centrale: l'allenamento serale sul tatami è stato annullato.\n\nMa il vero successo di oggi è nei dati. Due giorni fa la telemetria segnalava un apporto proteico critico, 64g. Oggi il problema è stato annientato: 198 grammi di proteine su 2900 kcal totali. Il sushi a cena non è stato uno sgarro, ma una ricarica calcolata al millimetro dentro i macro, a fronte di 4400 kcal bruciate dal motore. Uscite -21€ per il sushi tattico.\n\nLa sera non ho combattuto sul ring, ma la giornata non è finita. Le riprese notturne con i portatili accesi nel buio documentano l'altra metà della guerra: calibrazione degli algoritmi e infrastruttura digitale per J Detailing. Entrate +72€.\n\nNon serve essere motivati. Serve essere inarrestabili.\n\n160 GIORNI ALLA FINE	/objects/uploads/eb7bab5d-2653-48a9-9182-4f8af231dc9d	2026-07-05 13:00:25.605417+00	72	21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
28	28	2026-05-29	2500	8	\N	\N	\N	\N	84.9	68	GIORNO 28\n\nMacchina ai box. Problemi di salute e stop forzato in ospedale.\n\nIl Corpo\nNiente allenamento. Solo stretching e recupero attivo. Calorie impostate a quota di mantenimento e 8 ore di sonno per accelerare la riparazione.\n\nQuando il fisico cede, subentra la disciplina mentale. Nessuna frustrazione, solo gestione dei danni.\n\n152 giorni rimasti.	/objects/uploads/e661c152-814e-4369-b336-bf5349c68309	2026-07-05 17:56:58.412194+00	72	19.94	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
30	30	2026-05-31	2500	8	\N	\N	\N	\N	84.6	71	GIORNO 30\n\nUltimo giorno di recupero. Chiusura del Mese 1.\n\nI Numeri\n100.000 views. 50 reel. 2.200 clip registrate. 3.340+ flessioni. 85+ round di sparring. 79+ km corsi. J Detailing completata al 70%. Oltre 1.500€ generati.\n\nLa Mente\nGuardo il cruscotto e sento di non aver fatto abbastanza. Forse è esattamente questo senso di incompletezza a tenermi in movimento.\n\nIl Mese 2 inizia adesso.\n\n150 giorni rimasti. IC XC NIKA.	/objects/uploads/e7d39216-4e7d-4992-8e6b-fe022e3e5d27	2026-07-05 17:57:02.299041+00	72	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
145	33	2026-06-03	2100	7	0	0	0	0	\N	71	Secondo giorno in ospedale. Stesse pareti, stesso letto, stessa luce che non si spegne mai. Non ho dormito. Il dolore è gestibile, l'immobilità no.\n\n147 giorni rimasti.	/objects/uploads/83cb78e5-9bcb-4dfb-869f-73a2b5b30815	2026-08-18 00:26:55.0676+00	75	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
147	35	2026-06-04	1900	6	0	0	0	0	\N	\N	Dimesso. Il primo passo fuori dall'ospedale è il momento migliore della settimana. Non sono in condizione di fare niente ma almeno il letto è il mio.\n\n145 giorni rimasti.	/objects/uploads/36f7d33e-a5ca-4245-8557-0dfe123fe23a	2026-08-18 00:26:55.0676+00	50	20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
34	37	2026-06-06	1850	6	50	50	5	0	84.7	70	GIORNO 37\n\nLo sparring di oggi è stato pesante. Sangue, un ematoma sul fianco, un graffio sul collo.\n\nIl Corpo\nUn'ora e mezza di MMA più 30 minuti a vuoto. L'allenamento è sotto controllo ma 77g di proteine sono poche per 2 ore di lavoro così intenso.\n\nIl Business\n72€ guadagnati pulendo casa di una cliente. Il primo commercial di J Detailing è realtà — non è più solo un'idea sul telefono.\n\nL'Ecosistema\nDue porcellini d'india per la mia ragazza. L'orto dà i suoi frutti — oggi la prima insalata da quella che due mesi fa era solo terra abbandonata.\n\nIl corpo sul tatami. L'azienda sullo schermo. Tutto avanza insieme.\n\n143 giorni rimasti.	/objects/uploads/a0260d12-8eff-416e-8cf9-d741254409b2	2026-07-12 09:57:03.813746+00	72	14.72	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
36	39	2026-06-08	2000	7	100	100	7	\N	84.1	69	GIORNO 39\n\nLa giornata è partita con il business.\n\nIl Business\nSono andato di persona in un centro di detailing per propormi per lavori estivi, raccogliere informazioni e valutare corsi. L'obiettivo è macinare esperienza pratica — sporcarsi le mani per costruire le fondamenta vere.\n\nIl Corpo\nSparring di K1 con Claudio. Una ginocchiata che ha lasciato un colpo intercostale doloroso. Sparring vero significa anche prendere colpi veri. Se respirare farà male nei prossimi giorni, ci si ferma e si controlla. Le costole non si forzano.\n\nLa Mente\nSto sviluppando un sistema di tracciamento dei movimenti per analizzare i miei pattern e avere un vantaggio matematico in vista delle gare.\n\n141 giorni rimasti.	/objects/uploads/b2e4504a-5134-4995-bf8e-b0368ca9490d	2026-07-12 10:05:56.449895+00	72	15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
41	44	2026-06-13	2430	7	0	0	0	0	84.3	69	Sveglia alle 7:30. La giornata è iniziata col botto: giro in ospedale per un controllo medico a causa dell'infortunio alla costola. Essendo infortunato e non potendo praticare sport da combattimento o sforzare il fisico, ho preso il giorno libero dal lavoro manuale e ho spostato tutta l'aggressività sul digitale e sul business.\n\nDalle 9:00 alle 14:00 mi sono chiuso in biblioteca a leggere, pianificare e pensare a varie cose da fare. Oggi ho costruito: dieci Reel montati, quattro post pubblicati. Ho aperto la pagina ufficiale del progetto, studiato strumenti nuovi, sviluppato un caso studio che diventerà contenuto e scritto un nuovo pezzo sui soldi. Sto spingendo su due fronti: la preparazione per il lancio dell'attività di pulizia macchine (Apex) e la progettazione di un nuovo business legato all'intelligenza artificiale.\n\nFuori dal lavoro al computer, ho fatto la spesa al supermercato e ho montato la gabbietta dei porcellini d'India.\n\nNon aspetto di sentirmi ispirato. Mi siedo e produco. Ogni giorno un mattone, anche quando ho dormito poco, anche quando il corpo chiede tregua. Documento tutto perché voglio dimostrarti una cosa sola: non serve essere speciali. Serve presentarsi. Ogni singolo giorno.\n\nSi continua. Andiamo.\nψ IC XC NIKA	\N	2026-07-12 10:23:20.724709+00	72	24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
43	46	2026-06-15	1980	8	\N	\N	\N	\N	83.9	67	GIORNO 45\n\nGiornata assurda.\n\nIl Lavoro\nTrasferta a Verona, incidente visto sulla strada. Salito sul palo a 50 metri a montare antenne. Poi a casa della signora a pulire — problemi con gli insetti.\n\nIl Corpo\n100 flessioni. Un'ora di calcetto con gli amici — 9 km corsi, un gol segnato. Il background negli sport da combattimento serve anche per il pallone, ma non sono buono con i piedi.\n\nLa Mente\nOggi mi sono fermato a ragionare su come rendere di più e tagliare gli sprechi. L'ho messo nero su bianco. Non aspetto che le cose migliorino — le smonto, le studio, le rimetto insieme meglio.\n\n135 giorni rimasti.\n\nLa mattina è iniziata raccogliendo i frutti dell'orto, poi testa bassa in biblioteca per continuare a strutturare l'azienda. Ho avviato le prime sperimentazioni pratiche di detailing per Apex. Ho scelto questo modello di business perché, una volta padroneggiate le competenze tecniche e l'uso dei social per l'acquisizione, è altamente scalabile, redditizio e non richiede capitali enormi in advertising.\n\nLa vera chiave del modello, coerente con la mia mentalità, è l'upsell: si entra con il lavaggio e l'igienizzazione per guadagnare la fiducia del cliente, per poi scalare su servizi ad alto margine come installazione LED, tagliandi, ripristino o sostituzione di plastiche e componenti metalliche. In questo, la mia esperienza pregressa nell'import/export dalla Cina mi garantisce un vantaggio competitivo sui costi dei materiali.\n\nLe calorie restano controllate a 1980 kcal per bilanciare l'assenza di allenamenti pesanti. Entrate a +60€ (50+10). C'è tanto potenziale e tanto lavoro da fare. Si continua a costruire.\n\nψ IC XC NIKA	\N	2026-07-12 11:06:49.414722+00	60	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
44	47	2026-06-16	2300	8	100	0	3	0	84.1	65	Oggi nessun voiceover parlato, parlano i fatti e il testo a schermo. La giornata è stata segnata dal "solito caldo impegnativo", un fattore che moltiplica l'attrito quando lavori fisicamente.\n\nL'allenamento è stato ridotto all'essenziale per non sovraccaricare il sistema: 10 minuti di lavoro al sacco per tenere il ritmo e le mie solite 100 flessioni. Il dispendio energetico vero è stato sul lavoro: la giornata è stata incentrata principalmente sull'intervento in quota sul palo, dovevamo ripristinare l'alimentazione. Lavorare a quell'altezza con temperature del genere ti lascia "steccato", letteralmente prosciugato.\n\nPer questo motivo, la seconda parte della giornata è stata dedicata principalmente al riposo (esattamente come il cane nel video). Ascoltare il corpo significa anche capire quando spingere e quando spegnere i motori per recuperare i liquidi e l'energia spesa sotto il sole. Ho inserito delle stime per i macro e le finanze per mantenere il tracciato coerente in assenza dei dati testuali esatti, puntando su un buon sonno e un introito calorico di mantenimento.\n\nProject J. 133 giorni rimasti. Si continua.\nψ IC XC NIKA	\N	2026-07-12 11:11:31.685352+00	90	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
46	49	2026-06-18	2300	7	100	0	\N	\N	84	66	Stamattina mi sono buttato in piscina. Fuori c'è un caldo che spacca — e buttarsi era l'unica risposta giusta per abbassare la temperatura prima di iniziare.\n\nPoi il lavoro, in quota, con quel sole addosso. Dalle 9 a mezzogiorno su un palo a fare le messe a terra per gli impianti. Il corpo lavora, la mente registra. Vi assicuro che ore passate a quell'altezza e in quelle condizioni sono più di un allenamento. Nel pomeriggio ho recuperato le 100 flessioni. Non perché fosse programmato farlo a quell'ora, ma perché non le avevo fatte al mattino e si fa. Nessuna scusa. Ogni giorno è un mattone. Non sempre è bello, non sempre è epico. A volte è solo caldo, fatica e acqua. Ma il mattone si mette lo stesso.\n\nIl business continua a girare: ho fatto dei test di estrazione sui sedili per Apex Detailing. L'acqua nera di scarico è la prova visiva del perché questo servizio funziona ed è necessario.\n\nQuesto è il Progetto J. Biohacking unito al miglioramento delle performance, ogni giorno documentato, per arrivare a qualunque obiettivo: fare un match di MMA, aprire la mia azienda e costruire una community di persone con la testa sulle spalle.\n\nSi continua.	\N	2026-07-12 11:19:45.013303+00	64	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
54	57	2026-06-26	2800	6	100	100	7	10	83.9	66	GIORNO 57\n\nIl giorno del gran combattimento. Due sparring pesanti in 24 ore.\n\nIl Corpo\nMMA e K1, affrontando un ragazzo che ha combattuto agli Europei. A terra sono uscito da una monta e ho chiuso una leva alla caviglia. In piedi, calci volanti che hanno quasi testato di nuovo la costola, low kick e prese alla cintura.\n\nLa mattina era iniziata con 10 km di corsa e 10 vasche in piscina. Poi round ai pao, sacco, 100 flessioni e 100 addominali.\n\nQuesto è senza dubbio uno degli sport più belli del mondo. L'unico rimpianto: aver sprecato l'adolescenza a fare minchiate invece di scoprirlo prima.\n\n123 giorni rimasti.	/objects/uploads/4abe17ba-9762-40dc-ba87-453bda721ac0	2026-07-12 11:49:11.707618+00	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
56	59	2026-06-28	2100	7	\N	\N	\N	\N	83.2	63	GIORNO 59\n\nSecondo giorno di rest fisico. Massimo regime mentale.\n\nIl Business\nBarricato dietro lo schermo. Creati i nuovi loghi, strutturata l'identità visiva. Calendarizzato un blocco intero di post. Analisi chirurgica dei dati: ho craccato una dinamica e mandato virale dei contenuti.\n\nLe views si traducono in attenzione. L'attenzione si tradurrà in clienti per il detailing e in community per il progetto.\n\n121 giorni rimasti.	/objects/uploads/ef85584b-fbf1-4d4e-a769-3cec840ed16f	2026-07-12 11:53:22.721457+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
57	60	2026-06-29	2400	8	0	0	7	10	84.2	64	GIORNO 60\n\nSessanta giorni. Un terzo esatto del Progetto J archiviato.\n\nIl Corpo\nLavoro al sacco integrando MMA e gioco a terra. Mi sono inventato un esercizio specifico con il sacco per il tempismo sulle entrate in single leg. Poi 10 km tra corsa specifica e camminata.\n\nIl Business\n72€ incassati dal detailing. La rotta è tracciata: primo traguardo 25.000 follower per poter partire per la Thailandia ad allenarmi senza compromessi.\n\nOgni giorno conta. Ogni sessione conta. Ogni euro reinvestito conta.\n\n120 giorni rimasti.	/objects/uploads/435c1737-aaf3-4ab8-b0c9-269a803922b2	2026-07-12 11:57:09.493308+00	72	25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
173	61	2026-06-30	\N	\N	\N	\N	\N	\N	\N	\N	GIORNO DI RIPOSO 	/objects/uploads/3931fcb4-df69-4da3-b652-351d92b2959d	2026-08-18 00:26:55.995458+00	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
179	67	2026-07-06	\N	\N	\N	\N	\N	\N	\N	\N	GIORNO DI RIPOSO \n	/objects/uploads/de289db9-19a9-4bc5-83bf-dd6bdf17fd69	2026-08-18 00:26:55.995458+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
102	89	2026-08-08	1500	2	0	0	0	0	82	79	Il Viaggio\nQuattro paesi in un giorno. Austria, Cechia, Polonia, e adesso il gate bielorusso.\n\nLa cosa che mi ha colpito di più non è stata la strada. È stato il cambio valuta. Ogni confine un’altra moneta, e ogni volta perdi il metro: non sai più se stai spendendo tanto o poco. Ti accorgi di quanto ti fidi di un numero che non hai mai messo in discussione.\n\nLa Polonia è bella. Bandiere in ogni angolo, in ogni paese attraversato. Nelle città piccole non parla inglese nessuno, e se ti rivolgi a loro in un’altra lingua non ti rispondono. Non con ostilità. Semplicemente non è il loro problema.\n\nAdesso siamo fermi in dogana. Si aspetta.\n\nHo visto un’Europa bella. E una Bielorussia incazzata.\n\n91 giorni rimasti.\n\nIC XC NIKA	/objects/uploads/95f0879f-74e6-4de2-8d7e-55533366ddfc	2026-08-12 04:07:37.549498+00	0	130	Quattro paesi in un giorno. La cosa che mi ha scosso non è stata la strada.Ne 20 ore di viaggio	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
103	90	2026-08-09	1900	6	0	0	0	0	82	71	Il Viaggio\nNove ore ai gate. Due perquisizioni, scansione completa della macchina, un mezzo interrogatorio. Poi dentro.\n\nLa tensione sale quando dici di essere italiano. Un po’ di russo e qualche conoscenza qui dentro rendono tutto più semplice.\n\nIl Paese\nMinsk è enorme e bellissima. Lontana da tutto quello che ne raccontano da fuori. Non so come si viva in questo paese sul lungo periodo, ma quello che vedo è di qualità alta.\n\nPoi guardi i numeri e capisci per chi. Stipendio medio cinquecento dollari. Il pane un euro al chilo, il latte trenta centesimi, il salmone quattro euro al chilo, la benzina novanta centesimi. Per me è niente. Per chi ci vive è tutto.\n\nLa Mente\nSono andato da mia nonna, nelle case popolari. Il brutalismo sovietico è ancora dappertutto, e i palazzi sono tutti identici.\n\nTrentotto ore di viaggio. Oggi mi fermo.\n\n90 giorni rimasti.\n\nIC XC NIKA	/objects/uploads/39c88cf9-c48d-46b2-b805-a67e5a16480f	2026-08-12 04:07:37.594662+00	0	70	Nove ore ai gate, due perquisizioni, un mezzo interrogatorio. Poi Minsk. Il pane costa un euro al chilo e lo stipendio medio è cinquecento dollari.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
105	92	2026-08-11	1800	6	0	0	0	0	82.1	71	 \nIl Corpo\nSbloccato dopo più di due settimane senza allenarmi. Parchetto con mio fratello: riscaldamento correndo, un round di grappling, due o tre round di sparring kickboxing. Non è stato il massimo, ma dopo dodici giorni fermo andava bene così. Poi venti trazioni alla sbarra. Noto che il lavoro sui tralicci sta aiutando.\n\nIl Viaggio\nSveglia tardi. In questo paese fare serata è d’obbligo. Parenti venuti a trovarmi, poi uno dei mercati aperti più grandi di Minsk. Ho parlato con gente nelle caffetterie e ai banchetti, quelli che sapevano un po’ di inglese.\n\nLa cosa che mi ha colpito è la diversità. In Italia gli immigrati vengono principalmente dal Nordafrica. Qui la presenza islamica arriva da Armenia, Georgia, Kazakistan, Kirghizistan — paesi che avevo sentito nominare e basta.\n\nHo mangiato kebab. Meglio quelli italiani.\n\nLa sera a casa di un’amica. Shisha, qualche bottiglia. Qui costa niente e si beve come si respira.\n\nIn questo paese certe cose non si trovano. C’è solo l’alcol. Per me non è mai stato il problema principale, ma capisco chi ci sta dentro: se è l’unica cosa disponibile, diventa l’unica valvola, e una valvola aperta ventiquattro ore su ventiquattro non è una valvola. È un buco.\n\nDa domani ho preso una decisione. Se devo fare serata, la faccio lucido. Ho chiesto a questo progetto tre mesi senza un attimo libero e non sono riuscito a portarlo avanti come volevo. Adesso che ho il tempo, non ho intenzione di sprecarlo svegliandomi alle sei di sera a camminare per Minsk senza sapere dove sono.	/objects/uploads/7f0cd138-84a3-47b9-b2b1-483032f5020f	2026-08-12 04:07:37.613759+00	0	30	Due settimane fermo. Oggi primo sparring in un parchetto di Minsk. Da domani, lucido. Il tempo che ho chiesto adesso ce l’ho.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
106	93	2026-08-12	2100	4	0	0	0	0	82	71	Il Progetto\nSveglia alle undici dopo quattro ore di sonno. Tutta la mattina sul sito: copertine, miglioramenti, orchestrazione. Il lavoro che non si vede ma tiene in piedi tutto il resto.\n\nIl Corpo\nVolevo allenarmi. La tosse ha deciso diversamente. Appuntamento domani in una palestra a Minsk.\n\nIl Viaggio\nLe nonne sono internazionali. Non importa il paese, non importa la lingua: ti daranno da mangiare.\n\nNel pomeriggio a casa di un familiare. Casa enorme. E la cosa che mi ha colpito non è la casa: è come l’ha costruita.\n\nNon c’è cultura consumistica qui. Lui ripara tutto. Crea con le sue mani. Ha un orto, alleva colombi, polli e quaglie. Ha una sauna. Un appartamento solo per le docce. Una stanza con l’acquario. Tutto costruito, niente comprato.\n\nGli ho chiesto come è possibile fare tutto questo con ottocento euro di stipendio.\n\nMi ha guardato negli occhi. Poi ha indicato le mani.\n\nIn questa vita, tutto quello che vuoi lo ottieni con le mani. Devi muoverle più veloce degli altri.\n\nLa sera abbiamo cantato e ballato canzoni italiane. Non so spiegare com’è possibile sentirsi a casa a tremila chilometri da casa.\n\nDio è con me.\n\n87 giorni rimasti.\n\nIC XC NIKA	/objects/uploads/fc2224c8-645e-4f2f-9af8-e7b2ee963c31	2026-08-12 04:07:37.626466+00	0	0	Gli ho chiesto come fai tutto questo con ottocento euro al mese. Mi ha guardato negli occhi e ha indicato le mani.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
107	94	2026-08-13	2200	6	0	0	0	0	83.5	71	Il Viaggio\nSveglia alle dieci dopo sei-sette ore di sonno. Mattinata spesa a cercare come attivare la SIM e far funzionare internet. Problemi con la VPN — qualcosa non tornava nel modo in cui il sito veniva gestito da qui. Farò analisi strutturali più avanti.\nContattata una palestra locale. Domani mi alleno con un fighter.\n\nNel primo pomeriggio sono andato nella casa fuori Minsk, nei boschi, con tutta la famiglia. Ho conosciuto i miei cugini. Sono rimasto colpito da come si comportano i ragazzi della mia età rispetto a noi italiani. E da come si permettano gli iPhone più moderni con uno stipendio del cazzo.\n\nL’Italia mi manca per il caffè. Qui prendono la polvere e la mescolano con l’acqua. Neanche il solubile.\n\nIl Corpo\nNon mi sono allenato. Solo flessioni e addominali. Circa duemila calorie. Devo ricominciare a farli ogni giorno.\n\n86 giorni rimasti.\n\nIC XC NIKA	/objects/uploads/02cee7af-2e64-4514-a705-685f0ba9e5c4	2026-08-12 22:00:00.106645+00	0	6	SIM, VPN, mezza giornata persa. Contattata palestra, domani sparring. Casa dei parenti nei boschi. Niente allenamento vero. Devo ricominciare.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
108	95	2026-08-14	1200	6	30	0	3	0	82.9	71	SCRIZIONE SITO — Giorno 95\n\nIl Corpo\nSveglia a mezzogiorno in un bosco. Sono andato in una palestra a Minsk. Ho conosciuto Ivan, fighter professionista, record 8-1. Tre round di sparring insieme. Lo stile bielorusso mi ha colpito — diverso da quello che conosco, più di quanto mi aspettassi.\n\nNon ho pranzato. Per cena ho mangiato poco. Ancora debito di sonno, anche in ferie.\n\nIl Progetto\nHo montato due video che stanno performando bene.\n\n85 giorni rimasti.\n\nIC XC NIKA	/objects/uploads/7583e8f1-7296-4c54-b84c-6343ff220b4c	2026-08-14 19:35:36.997176+00	0	25	Tre round con Ivan, fighter pro 8-1 a Minsk. Lo stile bielorusso è diverso da tutto quello che conosco. Sveglia in un bosco, niente pranzo, ancora debito di sonno.	\N	\N	\N	\N	\N	3	\N	2	MMA	100	4	A	t	1x30	1x20	1x20	60	f	t	ANCA	f	4	Primo allenamento in Bielorussia	\N	\N	\N	\N	\N	\N	\N
109	96	2026-08-15	1800	7	30	70	3	0	82.6	72	Giorno 96\n\nIl Corpo\nSveglia alle undici dopo essere andato a letto alle quattro. Palestra a Minsk. Ho conosciuto gli altri ragazzi: due fighter amatoriali, uno di Muay Thai, uno di taekwondo, e un signore di quarantasei anni, ex militare con background di Sambo.\n\nRiscaldamento: tre minuti di takedown e guardia da terra, tre minuti di rialzata da supino. Poi un round di tocco spalle e copertura distanza. Trenta flessioni. Tre round di sparring.\n\nDurante il grappling un tipo mi ha spaccato il sopracciglio con una gomitata. Mi sono fatto bendare e ho continuato. Non avevo intenzione di far credere che noi italiani siamo deboli.\n\nHo continuato lo sparring solo corpo e gambe. Ho combattuto con un ragazzo che fa Muay Thai da sei anni. Poi condizionamento al plesso solare e tre minuti di plank.\n\nBuon allenamento.\n\nIl Viaggio\nA pranzo tartine al salmone, circa mille calorie. La sera patate e verdura, altre cinquecento. Ora a casa di amici a mangiare e bere. Domani si torna in palestra.\n\n84 giorni rimasti.\n\nIC XC NIKA	/objects/uploads/7e121db1-fe22-4d7c-b322-641a606010ac	2026-08-14 22:00:00.47536+00	0	6	Gomitata al sopracciglio durante il grappling. Bendato e continuato. Tre round di sparring con un muay thai da sei anni e un ex militare. Domani si torna.	\N	\N	\N	\N	\N	3	t	3	MMA	100	2	A	t	1x30	\N	\N	60	\N	t	ANCA	\N	3	Mi hanno spaccato il sopracciglio, abbiamo fatto 3 minuti di esercizi per il controllo guardia,3 round mma , condizionamento al plesso solare a mano nuda e colpi alla distanza a mano aperta	\N	\N	\N	\N	\N	\N	\N
110	97	2026-08-16	2000	6	35	0	0	0	83.2	71	<h2>Il Viaggio</h2>\n\n<p>Sveglia a mezzogiorno dopo essere andato a letto alle cinque. Ho visitato Minsk di notte — sono rimasto colpito dall'ordine e dalla polizia. In Italia una roba del genere impensabile.</p>\n\n<p>Ho creato dei reel, modificato un po' il sito. Poi sono uscito e ho pensato. Pensato un sacco di cose. Non ho fatto niente di produttivo.</p>\n\n<p>Mi sto rendendo conto che la produttività, se non la gestisci bene, diventa una dipendenza. Un modo per scappare dalla realtà e nascondersi. Come la droga, in qualche modo.</p>\n\n<h2>La Mente</h2>\n\n<p>Sono andato a trovare dei parenti. Ho conosciuto mia cugina. Ci siamo fatti il bagno in un lago bielorusso che sembrava più una palude, ma era bellissimo. Acqua fredda. Poi la sauna.</p>\n\n<p>83 giorni rimasti.</p>\n\n<p>IC XC NIKA</p>\n	/objects/uploads/d547b797-14a0-4a1d-bd05-b7a3b6e51691	2026-08-16 17:16:56.744616+00	0	0	La produttività può diventare una dipendenza. Come la droga, in qualche modo. Oggi non ho prodotto niente. Lago, sauna, parenti. A volte fermarsi è più difficile.	\N	\N	\N	\N	\N	\N	t	3	\N	\N	\N	A	\N	normali 35	10	\N	135	\N	\N	ANCA	\N	2	\N	\N	\N	\N	\N	\N	\N	\N
111	98	2026-08-17	2200	7	0	40	6	0	83.2	72	<h2>Il Corpo</h2>\n\n<p>Arrivato in palestra mezz'ora prima. Addominali e trazioni alla sbarra. Poi cinque round di pao con Ivan, atleta agonista MMA — combinazioni varie, ritmo alto.</p>\n\n<p>Mi ha fatto vedere degli esercizi con le corde da fare al parco, per la resistenza delle spalle. Poi vuoto col peso.</p>\n\n<p>L'esercizio che mi ha colpito di più: apnea totale sotto sforzo. Trattieni il fiato, resti senza aria per più di trenta secondi, e continui a lavorare. Non allena il fisico. Allena la testa a non cedere quando il corpo dice basta.</p>\n\n<h2>La Mente</h2>\n\n<p>La resistenza psicologica si allena come un muscolo. Oggi l'ho capito col fiato, non con le parole.</p>\n\n<p>82 giorni rimasti.</p>\n\n<p>IC XC NIKA</p>\n	/objects/uploads/1dd43713-455b-455d-8525-ca8eac4b7def	2026-08-16 22:12:31.931058+00	0	30	La resistenza psicologica si allena come un muscolo. Non con le frasi motivazionali. Col fiato che non c’è.	\N	\N	\N	\N	\N	\N	\N	3	MISTO	105	3	B	f	\N	\N	\N	\N	\N	t	\N	\N	3	\N	\N	0.25	\N	\N	\N	\N	\N
112	99	2026-08-18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-08-17 22:00:00.04806+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: iscritti; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iscritti (id, email, created_at) FROM stdin;
\.


--
-- Data for Name: obiettivi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.obiettivi (id, ciclo, posizione, area, titolo, previsto, giorno_limite, prova, stato) FROM stdin;
1	1	1	CORPO	OBIETTIVO CORPO	1	180	\N	attivo
2	1	2	CONTENUTI	OBIETTIVO CONTENUTI	1	180	\N	attivo
3	1	3	SOLDI	OBIETTIVO SOLDI	1	180	\N	attivo
\.


--
-- Data for Name: pageviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pageviews (id, "timestamp", path, referrer, device, country, duration_sec, scroll_depth, session_id, closed, last_seen, view_id) FROM stdin;
50	2026-08-14 19:35:36.765671+00	/statistiche		desktop	US	5	0	xfbrqntl0rmstckahn	1	2026-08-14 19:35:36.74+00	u3eqo7leohqmstckahm
51	2026-08-14 19:35:39.88367+00	/statistiche		desktop	US	0	0	mz17my3izksmstckcx2	1	2026-08-14 19:35:39.882+00	yq5k6jsjnbmstckcx1
52	2026-08-14 19:36:14.453367+00	/statistiche		desktop	US	0	0	ymfwcoi6c1mstcl3kq	1	2026-08-14 19:36:14.439+00	t288iuwqk2mstcl3kp
38	2026-08-12 09:03:38.744949+00	/		desktop	US	325	50	ddlc5rgpib7mspuziik	1	2026-08-12 09:08:38.742+00	15am0znsix3mspv3xcs
39	2026-08-12 09:09:05.45373+00	/giorno/1		desktop	US	5	50	ddlc5rgpib7mspuziik	1	2026-08-12 09:09:05.453+00	jhymsrflunmspvax03
53	2026-08-16 17:16:56.495816+00	/		desktop	US	0	0	03dhuj35h5etmsw2hnuq	1	2026-08-16 17:16:56.46+00	qea29b89i6jmsw2hnup
40	2026-08-12 09:09:13.764963+00	/		desktop	US	155	25	ddlc5rgpib7mspuziik	1	2026-08-12 09:11:13.756+00	8qnrnwp1cppmspvb3w1
54	2026-08-16 22:12:31.716338+00	/		desktop	US	0	0	xjlqq1g16kkmswd1sfh	1	2026-08-16 22:12:31.682+00	etzjo9oibtnmswd1sfh
55	2026-08-16 22:12:34.127708+00	/giorno/97		desktop	US	0	0	ckrsmr53yyemswd1ubp	1	2026-08-16 22:12:34.126+00	rfknw5d330omswd1ubp
56	2026-08-16 22:14:16.164389+00	/statistiche		desktop	US	0	0	eo4x5gqvbsqmswd410t	1	2026-08-16 22:14:16.123+00	h3uje8i6l97mswd410t
57	2026-08-16 22:18:45.793588+00	/		desktop	US	0	0	v7rnvu3kf9kmswd9t3g	1	2026-08-16 22:18:45.777+00	a28um3xjxpomswd9t3f
58	2026-08-16 22:18:47.956079+00	/giorno/97		desktop	US	0	0	ftunig7osramswd9urz	1	2026-08-16 22:18:47.955+00	s63093uegsmswd9urz
41	2026-08-12 09:11:49.140119+00	/giorno/32		desktop	US	660	50	ddlc5rgpib7mspuziik	1	2026-08-12 09:22:13.747+00	u031hocezhemspvefs4
59	2026-08-16 22:18:50.044546+00	/statistiche		desktop	US	0	0	wrtszzcy6cmswd9we0	1	2026-08-16 22:18:50.043+00	vogqu9e1ivmswd9wdz
60	2026-08-16 23:03:16.018705+00	/giorno/97		desktop	US	0	100	4p2jls82gjqmswev1fc	1	2026-08-16 23:03:15.977+00	l4ulom1rzumswev1fb
42	2026-08-12 09:22:51.004672+00	/journaling		desktop	US	150	25	ddlc5rgpib7mspuziik	1	2026-08-12 09:25:13.727+00	3dwlesldwshmspvslb9
43	2026-08-12 09:25:23.079187+00	/giorno/32		desktop	US	0	0	ddlc5rgpib7mspuziik	1	2026-08-12 09:25:23.078+00	s9uvxi1or4gmspvvvr2
44	2026-08-12 09:25:28.241923+00	/giorno		desktop	US	5	100	ddlc5rgpib7mspuziik	1	2026-08-12 09:25:28.241+00	13773y4plk5jmspvvzu2
45	2026-08-12 09:40:55.627583+00	/		desktop	US	\N	\N	ddlc5rgpib7mspuziik	0	2026-08-12 09:40:55.627+00	92xmylnhe56mspwfv8b
46	2026-08-12 10:08:16.876167+00	/		desktop	US	\N	\N	ddlc5rgpib7mspuziik	0	2026-08-12 10:08:16.874+00	3mu9jmzcwfumspxf145
61	2026-08-16 23:20:43.159612+00	/statistiche		desktop	US	0	100	6so5bdivhvnmswfhheb	1	2026-08-16 23:20:43.113+00	x7lp93u5xbtmswfhhea
47	2026-08-13 10:58:37.34795+00	/		desktop	US	340	0	uikyzg7m0gomsrenkhx	1	2026-08-13 11:04:16.707+00	szqwzdkmp6msrenkhx
62	2026-08-16 23:20:45.793563+00	/statistiche		desktop	US	5	0	7fh376diih6mswfhjh9	1	2026-08-16 23:20:45.792+00	dlonuj6cwoemswfhjh8
63	2026-08-16 23:20:48.709445+00	/giorno/97		desktop	US	0	0	l6pvq0zacpsmswfhlq8	1	2026-08-16 23:20:48.708+00	74fs3u3wvosmswfhlq7
35	2026-08-12 09:00:13.166708+00	/		desktop	US	5	0	ddlc5rgpib7mspuziik	1	2026-08-12 09:00:12.878+00	rwxle95sbynmspuziik
64	2026-08-16 23:21:51.860073+00	/statistiche		desktop	US	0	0	998qxmt4mrmswfiyfl	1	2026-08-16 23:21:51.832+00	n5dmml8sglmswfiyfk
36	2026-08-12 09:00:25.971455+00	/ADMIN		desktop	US	125	100	ddlc5rgpib7mspuziik	1	2026-08-12 09:02:26.001+00	rgslyqbuf7amspuzsmj
65	2026-08-16 23:21:54.285191+00	/statistiche		desktop	US	5	0	36z5jmd2w7hmswfj0bs	1	2026-08-16 23:21:54.284+00	fpjqx5m2g9mswfj0bs
37	2026-08-12 09:02:29.610014+00	/		desktop	US	65	25	ddlc5rgpib7mspuziik	1	2026-08-12 09:03:25.975+00	gvtexg0ash4mspv2fuq
48	2026-08-13 11:11:30.823997+00	/		desktop	US	675	0	uikyzg7m0gomsrenkhx	1	2026-08-13 11:22:44.974+00	eh7qu2odufmmsrf44en
66	2026-08-16 23:21:57.865665+00	/giorno/97		desktop	US	0	0	jmpj2sfbshmswfj338	1	2026-08-16 23:21:57.864+00	zhiro07athmswfj337
49	2026-08-13 12:03:12.100959+00	/		desktop	US	1170	0	n60b9x38a6cmsrgymjd	1	2026-08-13 12:22:40.604+00	hcyo8mfnlimsrgymjc
67	2026-08-16 23:24:17.857743+00	/statistiche		desktop	US	0	0	e5xjfy7jsnmswfm33r	1	2026-08-16 23:24:17.855+00	7r35i44xfaemswfm33r
68	2026-08-16 23:29:12.519912+00	/statistiche		desktop	US	0	100	66qntrx32jnmswfsefs	1	2026-08-16 23:29:12.484+00	me4qrjjjxflmswfsefo
69	2026-08-16 23:29:14.928228+00	/giorno/97		desktop	US	0	0	y6cubof3zwimswfsgbv	1	2026-08-16 23:29:14.927+00	6a2w76kyimswfsgbv
70	2026-08-16 23:31:44.287065+00	/statistiche		desktop	US	0	0	bydosxuv2opmswfvnjt	1	2026-08-16 23:31:44.259+00	s4314vg71aomswfvnjt
79	2026-08-18 00:19:53.71117+00	/articoli		desktop	US	5	0	pmdnfrq6n9cmsxx1fqh	1	2026-08-18 00:19:53.71+00	ox07pqfjpymmsxx1fqh
71	2026-08-17 23:38:49.466231+00	/		desktop	US	145	100	2h04oceqrc2msxvkm1b	1	2026-08-17 23:40:51.073+00	u02kyev84zmsxvkm1a
77	2026-08-18 00:19:50.790227+00	/		desktop	US	35	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:19:50.789+00	hmgw6u1dv2qmsxx1dd6
72	2026-08-17 23:41:19.503941+00	/		desktop	US	745	100	2h04oceqrc2msxvkm1b	1	2026-08-17 23:53:19.022+00	f8ek5zq128dmsxvntie
80	2026-08-18 00:20:26.319614+00	/journaling		desktop	US	25	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:20:26.302+00	p1ugzjbwetmsxx24pl
73	2026-08-17 23:53:56.763472+00	/		desktop	US	1420	0	2h04oceqrc2msxvkm1b	1	2026-08-18 00:16:56.834+00	jelb0tta25msxw42b1
75	2026-08-18 00:17:48.770401+00	/		desktop	US	5	0	rtazzptqtmkmsxwyrbs	1	2026-08-18 00:17:48.769+00	e8cf6o7wg4jmsxwyrbr
76	2026-08-18 00:17:51.772269+00	/		desktop	US	5	0	a3arbfhe5mgmsxwytn4	1	2026-08-18 00:17:51.771+00	xdde9x5jsvhmsxwytn4
85	2026-08-18 00:28:15.316103+00	/a/il-colpo-piu-debole-vince-i-combattimenti		desktop	US	5	100	ib7jxxb2zeqmsxxc6rk	1	2026-08-18 00:28:15.301+00	yd6qqqym6vlmsxxc6rk
81	2026-08-18 00:20:48.710044+00	/giorno/94		desktop	US	30	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:20:50.817+00	ay8pv81nkusmsxx2m59
74	2026-08-18 00:17:41.891487+00	/		desktop	US	125	0	2h04oceqrc2msxvkm1b	1	2026-08-18 00:19:41.707+00	6chcyg92jgmmsxwyltp
78	2026-08-18 00:19:51.417526+00	/articoli		desktop	US	0	0	4g27zgoq08bmsxx1dyq	1	2026-08-18 00:19:51.416+00	h2qnlfglwnmsxx1dyp
82	2026-08-18 00:21:18.191007+00	/journaling		desktop	US	80	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:21:50.823+00	jxpliwv50ammsxx38pt
83	2026-08-18 00:22:39.373127+00	/statistiche		desktop	US	200	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:25:50.821+00	ea1ysyf79aqmsxx4zf5
86	2026-08-18 00:28:19.781777+00	/articoli		desktop	US	5	100	8if1swuwqgdmsxxca81	1	2026-08-18 00:28:19.781+00	4x4fjwognuumsxxca81
84	2026-08-18 00:25:57.857957+00	/		desktop	US	55	50	2h04oceqrc2msxvkm1b	1	2026-08-18 00:26:50.638+00	y0rlfvix0vmsxx98ho
87	2026-08-18 00:28:25.537437+00	/journaling		desktop	US	5	0	zjs14uz7d7msxxceny	1	2026-08-18 00:28:25.536+00	njpez30b7bmsxxcenx
89	2026-08-18 00:28:29.954917+00	/statistiche		desktop	US	0	0	je0wwudu4lkmsxxci2m	1	2026-08-18 00:28:29.954+00	xo4qwkfdr1msxxci2l
88	2026-08-18 00:28:26.212095+00	/		desktop	US	95	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:29:25.934+00	xwz890uhqnsmsxxcev7
90	2026-08-18 00:30:01.519044+00	/giorno/98		desktop	US	15	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:30:01.496+00	b1luli4cp8msxxegkw
92	2026-08-18 00:30:46.596276+00	/		desktop	US	20	50	2h04oceqrc2msxvkm1b	1	2026-08-18 00:30:46.595+00	u8urhaszixrmsxxff1p
91	2026-08-18 00:30:18.368864+00	/articoli		desktop	US	30	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:30:29.154+00	501gdk3fk87msxxetn1
93	2026-08-18 00:31:06.684643+00	/giorno/97		desktop	US	5	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:31:06.684+00	qei31x6xuxnmsxxfup2
111	2026-08-18 00:40:20.632994+00	/		desktop	US	880	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:54:20.619+00	ttmzmfu6jnmsxxrqgx
94	2026-08-18 00:31:09.836797+00	/journaling		desktop	US	35	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:31:51.197+00	06rkyx7g7teemsxxfxd6
95	2026-08-18 00:31:53.157156+00	/giorno/43		desktop	US	45	25	2h04oceqrc2msxvkm1b	1	2026-08-18 00:32:25.907+00	vjeqh433cmsxxgnc0
97	2026-08-18 00:32:43.574546+00	/journaling		desktop	US	15	0	2h04oceqrc2msxvkm1b	1	2026-08-18 00:32:43.573+00	q2ed4zgkgrnmsxxhl44
96	2026-08-18 00:32:42.255142+00	/statistiche		desktop	US	5	100	5fhmfw8gfggmsxxhwqn	1	2026-08-18 00:32:42.243+00	mfb45fvymalmsxxhwqm
98	2026-08-18 00:32:45.487205+00	/statistiche		desktop	US	5	0	su8ezn6prbpmsxxhz8r	1	2026-08-18 00:32:45.486+00	qc1a8y809domsxxhz8q
99	2026-08-18 00:32:48.929124+00	/		desktop	US	10	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:32:48.928+00	sfqny2np91pmsxxi1xa
100	2026-08-18 00:32:59.526803+00	/journaling		desktop	US	0	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:32:59.526+00	zkvtcyv3kcmsxxia2t
101	2026-08-18 00:33:05.028242+00	/statistiche		desktop	US	0	0	f9119ymmuzimsxxiebj	1	2026-08-18 00:33:05.027+00	v1n6kcjhoomsxxiebj
102	2026-08-18 00:33:06.86992+00	/		desktop	US	35	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:33:06.869+00	y88gawxwtjhmsxxifnl
103	2026-08-18 00:33:40.753232+00	/journaling		desktop	US	10	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:33:40.741+00	bsuxqsuagmsxxj5qq
113	2026-08-18 11:20:21.934955+00	/journaling		desktop	US	5	100	emlh0kfg3opmsykmt2f	1	2026-08-18 11:20:21.934+00	j667dn1970mmsykmt2e
114	2026-08-18 11:20:26.181141+00	/giorno/97		desktop	US	5	0	y4yz1s149ymsykmwcg	1	2026-08-18 11:20:26.18+00	1lnsjco4t18msykmwcf
104	2026-08-18 00:34:09.477506+00	/statistiche		desktop	US	200	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:37:06.814+00	0vdg2ok5678dmsxxjcb1
105	2026-08-18 00:37:13.599387+00	/journaling		desktop	US	5	100	y7ygngn4uumsxxnq4b	1	2026-08-18 00:37:13.598+00	pfuqc9egkgmsxxnq4a
106	2026-08-18 00:37:17.932985+00	/journaling		desktop	US	5	0	v84z3armywemsxxntgp	1	2026-08-18 00:37:17.932+00	bne75ucqqzpmsxxntgo
112	2026-08-18 11:20:21.775251+00	/		desktop	US	135	100	bkpy8yidevomsykmum9	1	2026-08-18 11:20:21.772+00	8c9jmtye9zbmsykmum8
107	2026-08-18 00:37:26.254326+00	/		desktop	US	70	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:38:26.215+00	es5tyt3zafamsxxnzta
108	2026-08-18 00:38:35.08594+00	/coaching		desktop	US	20	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:38:35.075+00	71f7rmv1qa8msxxpgy2
109	2026-08-18 00:39:26.350369+00	/coaching		desktop	US	5	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:39:26.349+00	q6kye0kkgymsxxqkhh
110	2026-08-18 00:39:42.516258+00	/coaching		desktop	US	20	100	2h04oceqrc2msxvkm1b	1	2026-08-18 00:39:46.03+00	g8jyqka5xnmsxxqx1f
115	2026-08-18 11:23:02.585826+00	/		desktop	US	160	100	bkpy8yidevomsykmum9	1	2026-08-18 11:23:02.585+00	gguzu3dgtihmsykqana
116	2026-08-18 11:26:08.844754+00	/		desktop	US	155	100	bkpy8yidevomsykmum9	1	2026-08-18 11:26:08.834+00	mx5r0q15ljcmsykuaqi
131	2026-08-18 12:05:17.851484+00	/		desktop	US	5	0	gb0lznkzpn9msym8l92	1	2026-08-18 12:05:17.85+00	pnhveg5zhenmsym8l91
117	2026-08-18 11:28:53.869361+00	/		desktop	US	215	100	bkpy8yidevomsykmum9	1	2026-08-18 11:32:23.276+00	hrljbv1daeimsykxtri
129	2026-08-18 12:05:11.070521+00	/		desktop	US	45	100	bkpy8yidevomsykmum9	1	2026-08-18 12:05:11.043+00	45hf62blh16msym8i39
118	2026-08-18 11:32:29.982786+00	/statistiche		desktop	US	80	100	bkpy8yidevomsykmum9	1	2026-08-18 11:32:53.452+00	dmaohutsyxnmsyl2gu4
119	2026-08-18 11:35:39.436718+00	/		desktop	US	120	100	bkpy8yidevomsykmum9	1	2026-08-18 11:37:39.769+00	ja8glct0sumsyl6j5h
120	2026-08-18 11:38:03.945513+00	/		desktop	US	\N	\N	bkpy8yidevomsykmum9	0	2026-08-18 11:38:03.921+00	kh9jn05q42jmsyl9mk7
123	2026-08-18 11:47:52.280555+00	/		desktop	US	95	100	bkpy8yidevomsykmum9	1	2026-08-18 11:49:55.762+00	fyrdjnf8dxmsylm8jd
124	2026-08-18 11:49:59.135365+00	/		desktop	US	20	100	bkpy8yidevomsykmum9	1	2026-08-18 11:49:59.134+00	4abarp9x5mbmsyloyf5
125	2026-08-18 11:53:14.838618+00	/		desktop	US	150	100	bkpy8yidevomsykmum9	1	2026-08-18 11:53:14.829+00	y0lwszvmskmsylt5jd
121	2026-08-18 11:40:19.021368+00	/		desktop	US	210	100	bkpy8yidevomsykmum9	1	2026-08-18 11:43:19.116+00	odax6s9rb6msylciv7
132	2026-08-18 12:06:02.581826+00	/		desktop	US	5	100	6v4xlpt7aajmsym9jri	1	2026-08-18 12:06:02.58+00	tp7hdhe4ppmsym9jrh
126	2026-08-18 11:56:13.940033+00	/		desktop	US	150	100	bkpy8yidevomsykmum9	1	2026-08-18 11:58:38.4+00	fzc595imz5rmsylwzm1
127	2026-08-18 11:59:09.626649+00	/		desktop	US	155	100	bkpy8yidevomsykmum9	1	2026-08-18 11:59:09.626+00	pcv1zjitjprmsym0qjh
122	2026-08-18 11:44:00.676793+00	/		desktop	US	145	100	bkpy8yidevomsykmum9	1	2026-08-18 11:46:00.702+00	h174uaefki9msylh9wm
134	2026-08-18 12:06:07.148927+00	/		desktop	US	5	100	jdurp7a3z0mmsym9naf	1	2026-08-18 12:06:07.148+00	1m06reqog0smsym9naf
143	2026-08-18 12:17:21.216657+00	/chi-sono		desktop	US	5	0	5qzyckl0y8omsymo3ek	1	2026-08-18 12:17:21.215+00	ynjtwlrvlhmsymo3ej
133	2026-08-18 12:06:05.700135+00	/		desktop	US	55	100	bkpy8yidevomsykmum9	1	2026-08-18 12:06:26.11+00	rylgpwrt8asmsym9ocx
135	2026-08-18 12:07:03.109897+00	/journaling		desktop	US	0	100	bkpy8yidevomsykmum9	1	2026-08-18 12:07:03.109+00	290sjw07dgvmsymawjp
136	2026-08-18 12:07:32.505275+00	/chi-sono		desktop	US	\N	\N	bkpy8yidevomsykmum9	0	2026-08-18 12:07:32.523+00	gvnf2yih32smsymay7g
128	2026-08-18 12:03:24.863737+00	/		desktop	US	85	100	bkpy8yidevomsykmum9	1	2026-08-18 12:04:24.281+00	0uwngcgbizamsym67qd
130	2026-08-18 12:05:13.397174+00	/		desktop	US	5	0	yqu0owndc5msym8htb	1	2026-08-18 12:05:13.396+00	ar3s4ybai3msym8htb
137	2026-08-18 12:08:14.731087+00	/		desktop	US	295	100	bkpy8yidevomsykmum9	0	2026-08-18 12:14:35.868+00	gwy8w9ogn67msymcfso
138	2026-08-18 12:14:50.376247+00	/		desktop	US	15	100	bkpy8yidevomsykmum9	1	2026-08-18 12:14:50.364+00	k1taphn8kemmsymkx2p
144	2026-08-18 12:17:21.689079+00	/		desktop	US	5	100	bkpy8yidevomsykmum9	1	2026-08-18 12:17:21.687+00	a2kaa2ikcghmsymo5st
139	2026-08-18 12:15:05.726668+00	/journaling		desktop	US	5	100	bkpy8yidevomsykmum9	1	2026-08-18 12:15:05.726+00	10u4138bjwbmsyml88b
140	2026-08-18 12:15:35.835354+00	/		desktop	US	10	0	bkpy8yidevomsykmum9	1	2026-08-18 12:15:35.834+00	9xyy5qh0d9nmsymlbav
141	2026-08-18 12:15:53.867237+00	/		desktop	US	20	100	bkpy8yidevomsykmum9	1	2026-08-18 12:15:53.855+00	99i1wrrsmbtmsymma6a
142	2026-08-18 12:17:16.521788+00	/chi-sono		desktop	US	5	100	7554tx8pkjmsymnzrg	1	2026-08-18 12:17:16.498+00	oz7vuf4bwhlmsymnzrf
145	2026-08-18 12:17:32.810193+00	/		desktop	US	20	100	bkpy8yidevomsykmum9	1	2026-08-18 12:17:32.809+00	1qa289ly6kumsymoek4
146	2026-08-18 12:17:52.729116+00	/chi-sono		desktop	US	35	100	bkpy8yidevomsykmum9	1	2026-08-18 12:17:52.719+00	hjo1gdzias6msymotsw
147	2026-08-18 12:18:29.521684+00	/chi-sono		desktop	US	20	100	bkpy8yidevomsykmum9	1	2026-08-18 12:18:29.521+00	1qdfeeqtlvmsympm77
148	2026-08-18 12:21:44.446233+00	/		desktop	US	85	100	bkpy8yidevomsykmum9	1	2026-08-18 12:21:44.445+00	qoe13ysui5omsymtra4
149	2026-08-20 20:51:38.711501+00	/		desktop	US	30	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 20:51:59.881+00	0x7rcvuer71emt1zx63v
150	2026-08-20 20:52:13.237405+00	/		desktop	US	200	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 20:55:14.71+00	7uezuw8lw3bmt1zxxkc
152	2026-08-20 20:55:46.778736+00	/journaling		desktop	US	5	100	xmpryykv319mt202hxt	1	2026-08-20 20:55:46.776+00	0krawnfz335mt202hxs
151	2026-08-20 20:55:38.440455+00	/		desktop	US	40	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 20:55:38.434+00	qa8o7qv6l0mmt202bvy
153	2026-08-20 20:56:19.132578+00	/journaling		desktop	US	75	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 20:56:48.659+00	n78n8wnov4fmt20375e
167	2026-08-22 12:31:38.935096+00	/grazie		desktop	US	0	0	8y3qxd0pe7qmt4cxvvj	1	2026-08-22 12:31:38.92+00	jo9naa3xj8gmt4cxvvh
168	2026-08-22 12:41:03.563074+00	/		desktop	US	5	100	3eg9uy1vgxdmt4d9zja	1	2026-08-22 12:41:03.535+00	e26kvpyiaomt4d9zj8
169	2026-08-22 12:41:07.249568+00	/		desktop	US	0	0	2riguwrnhz4mt4da2el	1	2026-08-22 12:41:07.249+00	hmfwu08jmyomt4da2ek
154	2026-08-20 20:57:36.020623+00	/statistiche		desktop	US	360	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 21:02:38.548+00	sarn6dhtxhmmt204ugc
170	2026-08-22 12:43:52.620023+00	/statistiche		desktop	US	5	100	ctx03fc93s8mt4ddlzv	1	2026-08-22 12:43:52.608+00	2g8hnr3l6p6mt4ddlzu
171	2026-08-22 12:43:56.429603+00	/statistiche		desktop	US	0	0	xh6u73m9ppmt4ddoy0	1	2026-08-22 12:43:56.428+00	62uyx9d8gjkmt4ddoxz
172	2026-08-22 12:44:38.053905+00	/statistiche		desktop	US	5	100	ptb6cftibslmt4del1w	1	2026-08-22 12:44:38.041+00	wcls5ccqyiamt4del1w
173	2026-08-22 12:45:46.317147+00	/statistiche		desktop	US	0	100	qt60eswi3rfmt4dg1q3	1	2026-08-22 12:45:46.304+00	p0cwduw6eemt4dg1q2
155	2026-08-20 21:03:53.784975+00	/		desktop	US	445	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 21:10:53.859+00	kbcmibkjb6fmt20cy40
156	2026-08-20 21:11:17.977117+00	/journaling		desktop	US	10	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 21:11:17.975+00	2s24ihj2bgnmt20mg2r
157	2026-08-20 21:11:36.03961+00	/giorno/99		desktop	US	15	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 21:11:36.038+00	vwm4lqnuc9bmt20mo33
174	2026-08-22 13:06:53.82123+00	/		desktop	US	5	100	53oo9ulszsmt4e77qu	1	2026-08-22 13:06:53.819+00	w29d1wh79xomt4e77qt
158	2026-08-20 21:11:42.901546+00	/journaling		desktop	US	25	75	4eeqftkjvbtmt1zx63w	1	2026-08-20 21:11:57.522+00	kmslojvlvmnmt20mytg
159	2026-08-20 21:12:32.261277+00	/		desktop	US	40	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 21:12:32.25+00	xv4bpuj0s6dmt20o26a
160	2026-08-20 21:13:21.211274+00	/		desktop	US	60	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 21:14:21.016+00	8cj68sll41fmt20p3sp
175	2026-08-22 13:12:57.966432+00	/		mobile	IT	25	100	ry3s4lazfbemt4ef0ki	1	2026-08-22 13:12:57.953+00	wb2eswsqz2lmt4ef0jr
161	2026-08-20 21:14:32.3385+00	/		desktop	US	35	100	4eeqftkjvbtmt1zx63w	1	2026-08-20 21:15:08.399+00	0bt4fho3kp0jmt20qmns
176	2026-08-22 13:13:23.362944+00	/chi-sono		mobile	IT	10	100	ry3s4lazfbemt4ef0ki	1	2026-08-22 13:13:23.349+00	cdpjab45s3gmt4efk5r
162	2026-08-20 21:15:22.980254+00	/		desktop	US	120	100	pkkdsmoqcbbmt20rpwl	1	2026-08-20 21:17:23.165+00	jovvsp7rylkmt20rpwl
187	2026-08-22 23:38:45.069441+00	/giorno/100		mobile	IT	0	0	7qqs9qp39vumt50rem5	1	2026-08-22 23:38:45.068+00	m8gipode1remt50rs3j
177	2026-08-22 13:13:34.595115+00	/		mobile	IT	35	100	ry3s4lazfbemt4ef0ki	1	2026-08-22 13:13:57.896+00	zzwqfhbgoymt4efsul
178	2026-08-22 13:14:12.870301+00	/journaling		mobile	IT	10	100	ry3s4lazfbemt4ef0ki	1	2026-08-22 13:14:12.869+00	k4zv2nh72bhmt4eglmo
179	2026-08-22 13:14:22.598799+00	/statistiche		mobile	IT	0	100	ry3s4lazfbemt4ef0ki	1	2026-08-22 13:14:22.598+00	8rgtfwi0jlpmt4egtvp
180	2026-08-22 13:14:24.404526+00	/articoli		mobile	IT	35	100	ry3s4lazfbemt4ef0ki	1	2026-08-22 13:14:57.938+00	a4nw3u8uhhqmt4egv9j
163	2026-08-20 21:17:37.417303+00	/		desktop	US	1235	100	pkkdsmoqcbbmt20rpwl	1	2026-08-20 21:38:02.777+00	m0sojcwr3w9mt20ulmu
164	2026-08-22 12:30:28.832676+00	/privacy		desktop	US	0	0	o19a28k2gwmt4cwdrn	1	2026-08-22 12:30:28.798+00	iekof6qy5y8mt4cwdrm
165	2026-08-22 12:30:30.924644+00	/termini		desktop	US	0	0	3jl73dfmk8gmt4cwfev	1	2026-08-22 12:30:30.923+00	zyl8qc65lplmt4cwfeu
166	2026-08-22 12:30:32.845703+00	/percorso-che-non-esiste		desktop	US	0	0	mugexu4k1bimt4cwgw9	1	2026-08-22 12:30:32.844+00	qjkiqw8e22mt4cwgw8
181	2026-08-22 21:55:26.194748+00	/articoli		desktop	US	5	100	a3nbvh8yfcbmt4x2x5t	1	2026-08-22 21:55:26.191+00	l8jbu5ketpmt4x2x5s
182	2026-08-22 22:08:37.681746+00	/		mobile	IT	10	100	msg3ne03v8rmt4xju7t	1	2026-08-22 22:08:37.662+00	7cyhq3vg61imt4xju7s
183	2026-08-22 23:37:58.7959+00	/journaling		desktop	US	5	100	pbetsvfkpjmt50qsjh	1	2026-08-22 23:37:58.794+00	3z82ax61b7lmt50qsjh
184	2026-08-22 23:38:27.403741+00	/		mobile	IT	10	100	7qqs9qp39vumt50rem5	1	2026-08-22 23:38:27.389+00	tt3gyv1eblrmt50rem5
185	2026-08-22 23:38:39.567195+00	/giorno/102		mobile	IT	5	100	7qqs9qp39vumt50rem5	1	2026-08-22 23:38:39.554+00	dgjhac3lwx9mt50ro02
186	2026-08-22 23:38:43.169781+00	/giorno/101		mobile	IT	0	25	7qqs9qp39vumt50rem5	1	2026-08-22 23:38:43.169+00	42g8mdfdjh7mt50rqsi
188	2026-08-22 23:38:46.323218+00	/giorno/99		mobile	IT	0	100	7qqs9qp39vumt50rem5	1	2026-08-22 23:38:46.322+00	cd7ajcrjnyrmt50rt5w
189	2026-08-22 23:38:48.617661+00	/journaling		mobile	IT	15	100	7qqs9qp39vumt50rem5	1	2026-08-22 23:38:48.617+00	39he7lvapphmt50ruw7
190	2026-08-22 23:39:20.626288+00	/statistiche		desktop	US	0	0	6192bq8cm9pmt50sjoc	1	2026-08-22 23:39:20.611+00	ua9zjpcbyehmt50sjob
191	2026-08-22 23:45:43.468357+00	/		mobile	IT	25	100	81envghoi7mmt510qzk	1	2026-08-22 23:45:43.448+00	kwxxdzdjgjmt510qzj
192	2026-08-22 23:46:12.090542+00	/		mobile	IT	10	100	81envghoi7mmt510qzk	1	2026-08-22 23:46:12.089+00	vkexhikekkkmt511d3h
193	2026-08-22 23:46:22.805585+00	/journaling		mobile	IT	10	100	81envghoi7mmt510qzk	1	2026-08-22 23:46:22.805+00	nztrhz7b0rmt511ldk
194	2026-08-22 23:48:37.06977+00	/		desktop	US	0	0	fu3thwrxkwjmt514h1b	1	2026-08-22 23:48:37.06+00	yhd9ytkwiymt514h1b
195	2026-08-22 23:48:39.354316+00	/journaling		desktop	US	5	0	po5fl3rjonmt514it1	1	2026-08-22 23:48:39.353+00	q8qoa9f070pmt514it1
196	2026-08-22 23:48:44.184689+00	/statistiche		desktop	US	0	0	pvq70ne8o18mt514mj8	1	2026-08-22 23:48:44.184+00	j52td99tszmt514mj8
197	2026-08-22 23:54:19.209484+00	/giorno/104		desktop	US	0	100	vggfcugp1ymt51bt1h	1	2026-08-22 23:54:19.208+00	o7w6vftp2imt51bt1g
198	2026-08-22 23:54:21.052566+00	/articoli		desktop	US	5	0	l5hu5ehryv8mt51bugo	1	2026-08-22 23:54:21.051+00	crj4xb2stkmt51bugn
199	2026-08-22 23:54:30.705797+00	/a/il-colpo-piu-debole-vince-i-combattimenti		desktop	US	5	0	fa17yn5btgmt51c1wt	1	2026-08-22 23:54:30.704+00	295t6zfcjc8mt51c1ws
200	2026-08-22 23:54:35.75482+00	/statistiche		desktop	US	0	0	hxn6r6w2chvmt51c5t3	1	2026-08-22 23:54:35.754+00	dbw2hygdnpvmt51c5t2
201	2026-08-22 23:54:38.315056+00	/journaling		desktop	US	5	0	raxj2nnhbvsmt51c7s7	1	2026-08-22 23:54:38.314+00	2v7nhhwj5chmt51c7s7
202	2026-08-23 17:36:26.163458+00	/a/il-colpo-piu-debole-vince-i-combattimenti		desktop	US	5	0	ovqjd9q1v2mt639p2g	1	2026-08-23 17:36:26.161+00	1ljccak0v8ymt639p2f
203	2026-08-23 17:36:33.417344+00	/a/il-colpo-piu-debole-vince-i-combattimenti		desktop	US	5	0	xwdnbp94pgmt639uo4	1	2026-08-23 17:36:33.416+00	y9mtfkznnhomt639uo3
204	2026-08-23 17:36:43.219435+00	/a/Stoi		desktop	US	5	0	5kfb3jbbwqmt63a28c	1	2026-08-23 17:36:43.217+00	x3cqfx3e14mt63a28c
205	2026-08-23 17:37:13.942112+00	/		desktop	US	0	0	esymjipvk2rmt63apxk	1	2026-08-23 17:37:13.932+00	mnmonldliacmt63apxj
206	2026-08-23 17:37:15.92032+00	/a/Stoi		desktop	US	5	0	rae48kyf9lmt63argq	1	2026-08-23 17:37:15.918+00	ufqz0mkdekqmt63argp
207	2026-08-23 17:37:38.18604+00	/		desktop	US	0	0	ntonibllepmt63b8my	1	2026-08-23 17:37:38.175+00	px3utdo6q1fmt63b8mx
208	2026-08-23 17:37:40.349564+00	/a/Stoi		desktop	US	5	0	58c1tearstlmt63babc	1	2026-08-23 17:37:40.348+00	qp0h5go4517mt63babc
209	2026-08-23 17:37:59.389185+00	/a/Stoi		desktop	US	5	100	pxdvxeal57lmt63bozs	1	2026-08-23 17:37:59.377+00	8ow1lo3k88mmt63bozr
210	2026-08-23 17:38:03.336223+00	/		desktop	US	0	100	ibcuispal2mt63bs1w	1	2026-08-23 17:38:03.335+00	ena9a8i65ijmt63bs1v
211	2026-08-23 22:37:13.01393+00	/		desktop	US	5	100	yub9wtrxermt6e0i39	1	2026-08-23 22:37:12.998+00	ryti4lkt9pmt6e0i35
212	2026-08-23 22:37:16.892823+00	/		desktop	US	0	0	lw0s9hbltfbmt6e0l3r	1	2026-08-23 22:37:16.892+00	yt97zediv3mt6e0l3q
213	2026-08-23 22:37:26.327208+00	/journaling		desktop	US	5	100	c1bvbixy5eemt6e0sds	1	2026-08-23 22:37:26.325+00	5glmus5uvnjmt6e0sdr
214	2026-08-23 22:37:30.673846+00	/articoli		desktop	US	5	0	8obawjekmg3mt6e0vqj	1	2026-08-23 22:37:30.673+00	uuikh4tqg8imt6e0vqh
215	2026-08-23 22:37:34.907928+00	/statistiche		desktop	US	5	100	fkyp04sqecbmt6e0z06	1	2026-08-23 22:37:34.907+00	eu25iqmdy0tmt6e0z06
216	2026-08-23 22:37:38.485925+00	/coaching		desktop	US	0	0	fsj69xqxswomt6e11rg	1	2026-08-23 22:37:38.485+00	p7ppl6mte7mt6e11rf
217	2026-08-23 22:46:48.830953+00	/		mobile	IT	15	100	rxl1cesfmh9mt6ecu6b	1	2026-08-23 22:46:48.818+00	j8a3bn6sds8mt6ecu63
218	2026-08-23 22:52:36.61682+00	/		mobile	IT	5	100	c55qm3k2xj7mt6ekalz	1	2026-08-23 22:52:36.604+00	eoj8xxnzymsmt6ekaly
219	2026-08-23 22:57:28.114907+00	/		mobile	IT	40	100	klcm3jtxqgqmt6eqjkk	1	2026-08-23 22:57:28.105+00	erzkn1tw3jjmt6eqjkk
237	2026-08-26 20:58:13.095348+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:58:13.094+00	4ijdgvkun84mtaksqu1
220	2026-08-23 22:58:11.549737+00	/statistiche		mobile	IT	50	100	klcm3jtxqgqmt6eqjkk	1	2026-08-23 22:58:28.139+00	mvci6lt6rkmt6ergb2
221	2026-08-25 14:31:21.79968+00	/		desktop	US	5	100	wdksosam0pimt8rjcsk	1	2026-08-25 14:31:19.976+00	e4urrfd7fy9mt8rjcsi
238	2026-08-26 20:58:33.289184+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:58:33.288+00	ksac6yd5yjmtakt6f1
222	2026-08-25 14:52:24.42963+00	/		mobile	IT	60	100	mun36x739romt8saf8n	1	2026-08-25 14:53:24.167+00	89ypy080e7ymt8saf8m
223	2026-08-25 14:53:26.019202+00	/		mobile	IT	\N	\N	mun36x739romt8saf8n	0	2026-08-25 14:53:26.018+00	pb20obfd078mt8sbrxt
224	2026-08-26 20:32:58.124989+00	/giorno/106		desktop	US	0	100	oubw60ak47mtajw9vk	1	2026-08-26 20:32:58.123+00	z3er4d93fomtajw9vj
239	2026-08-26 20:58:53.450988+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:58:53.45+00	1zf9tzst436mtaktlz7
225	2026-08-26 20:43:56.314916+00	/		mobile	IT	85	100	tces6u807e9mtakadlx	1	2026-08-26 20:45:18.326+00	nc2wyp5u0omtakadlx
240	2026-08-26 20:59:13.636365+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:59:13.617+00	8654q5pqj7lmtaku1j5
226	2026-08-26 20:45:21.168193+00	/		mobile	IT	15	100	tces6u807e9mtakadlx	1	2026-08-26 20:45:33.397+00	xrdlc0fxbhhmtakc74i
227	2026-08-26 20:54:50.799938+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:54:50.78+00	y1jgez6ep69mtakoepm
228	2026-08-26 20:55:10.948382+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:55:10.947+00	hr1dgkikm8omtakouaj
229	2026-08-26 20:55:31.091649+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:55:31.09+00	ji8cy83z2rnmtakp9u3
230	2026-08-26 20:55:51.251127+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:55:51.249+00	twviacive4cmtakppe2
231	2026-08-26 20:56:11.484152+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:56:11.477+00	j998smhr8yimtakq4zv
232	2026-08-26 20:56:31.646904+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:56:31.645+00	ianvlpme5nbmtakqkk6
233	2026-08-26 20:56:52.086534+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:56:52.085+00	po45hmlo8zmtakr0bs
234	2026-08-26 20:57:12.331271+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:57:12.33+00	fvae3fnuxu7mtakrfy8
235	2026-08-26 20:57:32.5161+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:57:32.514+00	npgwh9xjmkmtakrvj0
236	2026-08-26 20:57:52.686184+00	/progetto-j/card/1		desktop	\N	20	0	ftf6bf54o9kmtakoepn	1	2026-08-26 20:57:52.684+00	2ty4pbldz0fmtaksb37
241	2026-08-26 20:59:33.775971+00	/progetto-j/card/1		desktop	\N	\N	\N	ftf6bf54o9kmtakoepn	0	2026-08-26 20:59:33.772+00	3njs36eadxtmtakuh35
242	2026-08-26 21:00:03.724294+00	/progetto-j/card/8		desktop	\N	\N	\N	khjd83xlqgdmtakv46i	0	2026-08-26 21:00:03.705+00	8l2h5cxeu6kmtakv46i
243	2026-08-26 21:00:42.211805+00	/progetto-j/card/8		desktop	\N	\N	\N	lagwf73l689mtakvxvn	0	2026-08-26 21:00:42.192+00	ozse6i0l8xmtakvxvl
244	2026-08-29 11:02:33.876098+00	/giorno/8		desktop	US	5	100	cvea4dfzg8emte9ua9p	1	2026-08-29 11:02:33.873+00	r3t8inf4u0omte9ua9p
245	2026-08-29 11:03:17.611995+00	/articoli		desktop	US	5	0	icea7yq19lmte9v80p	1	2026-08-29 11:03:17.6+00	fv4wcsqcymemte9v80o
246	2026-08-29 18:34:25.523329+00	/		desktop	US	5	100	s0m9oazuocmtepzdr5	1	2026-08-29 18:34:25.519+00	pbqgdr6n65gmtepzdr4
247	2026-08-29 18:34:29.021292+00	/statistiche		desktop	US	0	0	9yksyi5iebcmtepzggn	1	2026-08-29 18:34:29.02+00	rxi43n8ocsnmtepzggm
248	2026-08-29 18:34:32.078884+00	/		desktop	US	0	0	u2rw5n45ntmtepziti	1	2026-08-29 18:34:32.078+00	o4xnb9owhx9mtepzith
249	2026-08-29 19:06:49.264066+00	/		desktop	US	5	100	bip8q19kmcmmter51j9	1	2026-08-29 19:06:49.246+00	ho0o2o9b1bumter51j8
250	2026-08-31 07:34:55.124278+00	/viaggio		desktop	US	5	0	91zhr8il3vmtgxay3r	1	2026-08-31 07:34:54.779+00	criz4k59o5gmtgxay3q
251	2026-08-31 07:37:52.246949+00	/viaggio		desktop	US	0	0	la06uxlk76mtgxer1a	1	2026-08-31 07:37:52.23+00	awv00lkecblmtgxer1a
252	2026-08-31 07:37:55.1219+00	/viaggio		desktop	US	0	0	mmenaprcj3qmtgxet9p	1	2026-08-31 07:37:55.121+00	d4f0weg90rwmtgxet9o
258	2026-08-31 07:45:53.704702+00	/		mobile	IT	5	100	pljdzwrd7pjmtgxp2f3	1	2026-08-31 07:45:53.704+00	mxdz083buwnmtgxp2ev
257	2026-08-31 07:42:41.000397+00	/viaggio		desktop	US	\N	\N	mmabak8o53bmtgxkxu3	0	2026-08-31 07:59:40.979+00	z9lil7vnh6amtgxkxu2
253	2026-08-31 07:38:26.448327+00	/viaggio		desktop	US	145	25	fbtl2sz3h1cmtgxfhfi	1	2026-08-31 07:40:26.442+00	fykidxwaosqmtgxfhfi
259	2026-08-31 07:45:59.974696+00	/viaggio		mobile	IT	30	100	pljdzwrd7pjmtgxp2f3	1	2026-08-31 07:45:59.973+00	wt3dxvfe4xfmtgxp79o
254	2026-08-31 07:40:53.022937+00	/viaggio		desktop	US	\N	\N	fbtl2sz3h1cmtgxfhfi	0	2026-08-31 07:59:53.019+00	mebnxjcxkdmtgximj9
255	2026-08-31 07:41:07.907423+00	/viaggio		desktop	US	65	100	wl4d3cps2xmtgxiy0h	1	2026-08-31 07:42:07.896+00	y0xf78ntdjbmtgxiy0g
256	2026-08-31 07:42:10.855621+00	/viaggio		desktop	US	\N	\N	wl4d3cps2xmtgxiy0h	0	2026-08-31 08:00:10.853+00	7i3s595o9y9mtgxkala
262	2026-08-31 09:44:32.720862+00	/viaggio		desktop	US	0	0	n2bxip4iivemth1xnlf	1	2026-08-31 09:44:32.702+00	txnwmx73uzamth1xnle
261	2026-08-31 09:36:43.627701+00	/viaggio		mobile	IT	15	100	cs03uqaxwlwmth1mz5o	1	2026-08-31 09:36:58.67+00	kgqxhuehpfrmth1nljp
260	2026-08-31 09:36:14.632704+00	/		mobile	IT	30	100	cs03uqaxwlwmth1mz5o	1	2026-08-31 09:36:14.621+00	roiqofk6yyomth1mz5m
263	2026-08-31 09:45:23.906883+00	/viaggio		desktop	US	0	0	2cdqgif9f1xmth1yr3i	1	2026-08-31 09:45:23.893+00	nie5oysyzumth1yr3i
264	2026-08-31 09:45:25.736826+00	/viaggio		desktop	US	0	0	32urhh8ghmlmth1ysis	1	2026-08-31 09:45:25.736+00	ilp47iqt1wmth1ysir
265	2026-08-31 10:05:49.621455+00	/		mobile	IT	15	100	huwibobhdrmth2p0ow	1	2026-08-31 10:05:49.601+00	ph4yghtxi8mth2p0ot
266	2026-08-31 10:06:02.84213+00	/viaggio		mobile	IT	15	100	huwibobhdrmth2p0ow	1	2026-08-31 10:06:02.58+00	3g7rpz066w1mth2papo
267	2026-08-31 10:06:23.585349+00	/viaggio		mobile	IT	\N	\N	huwibobhdrmth2p0ow	0	2026-08-31 10:06:23.584+00	yk4m5asmkfkmth2pqwk
268	2026-08-31 10:06:24.86394+00	/viaggio		desktop	US	0	0	ag8cf048v4amth2ps2j	1	2026-08-31 10:06:24.863+00	2phr6j4wpljmth2ps2i
269	2026-08-31 10:06:27.236754+00	/viaggio		desktop	US	0	0	hgp8o7e29rmth2ptwe	1	2026-08-31 10:06:27.234+00	s6aekf0ko0dmth2ptwd
284	2026-08-31 11:15:08.781002+00	/chi-sono		mobile	IT	15	100	zroshdgddsmth559x0	1	2026-08-31 11:15:08.771+00	adnctt74xpmth5660w
303	2026-09-02 10:19:46.676417+00	/clip/0		desktop	US	0	100	59k0g363vv5mtjy2o33	1	2026-09-02 10:19:46.675+00	0vpivfflr9hrmtjy2o32
285	2026-08-31 11:15:23.262997+00	/		mobile	IT	5	100	zroshdgddsmth559x0	1	2026-08-31 11:15:27.151+00	asffs5uav9mth56h7g
286	2026-08-31 13:13:27.114646+00	/statistiche		desktop	US	0	100	udomw4zy2qnmth9eb78	1	2026-08-31 13:13:27.1+00	r0qzy4vt8xmth9eb77
287	2026-08-31 13:13:29.662429+00	/articoli		desktop	US	5	0	jsx1s1wh858mth9ed6i	1	2026-08-31 13:13:29.661+00	9q99twtrbtmth9ed6i
288	2026-08-31 13:13:50.711252+00	/statistiche		desktop	US	0	100	hxw273eijqmmth9etds	1	2026-08-31 13:13:50.685+00	83fqctscp9amth9etds
289	2026-08-31 13:13:53.486561+00	/articoli		desktop	US	5	0	u28vox6evppmth9evk9	1	2026-08-31 13:13:53.484+00	85a2qfaupqsmth9evk8
290	2026-08-31 13:15:02.102178+00	/statistiche		desktop	US	5	100	hlcezrt5qvmth9gcfa	1	2026-08-31 13:15:02.029+00	t6vgk0pexglmth9gcf6
270	2026-08-31 10:07:02.752326+00	/viaggio		desktop	US	800	100	iz8sl4gnzlmth2qlaj	1	2026-08-31 10:20:02.746+00	3jddcpery7jmth2qlaj
272	2026-08-31 10:20:29.687102+00	/viaggio		desktop	US	0	0	a0l9tasg2domth37vxs	1	2026-08-31 10:20:29.686+00	31nz8p78g9gmth37vxr
273	2026-08-31 10:20:32.277636+00	/viaggio		desktop	US	0	0	suin009v0kdmth37xxs	1	2026-08-31 10:20:32.277+00	5e3jccvh9bumth37xxr
274	2026-08-31 10:20:34.45902+00	/viaggio		desktop	US	0	0	d6mhz8vn8hpmth37zm7	1	2026-08-31 10:20:34.458+00	imjk7h2h7qgmth37zm7
275	2026-08-31 10:20:36.463083+00	/viaggio		desktop	US	0	0	9mjmt8nl9bpmth38161	1	2026-08-31 10:20:36.461+00	pyt29gawh7bmth38160
276	2026-08-31 10:20:47.564+00	/viaggio		desktop	US	0	0	iwx0t39vpatmth389qg	1	2026-08-31 10:20:47.563+00	07p1n0rcu3lmth389qf
277	2026-08-31 10:20:49.34422+00	/viaggio		desktop	US	0	0	g7cppu3ufevmth38b3v	1	2026-08-31 10:20:49.343+00	xehac9cp3g9mth38b3u
291	2026-08-31 14:33:17.831317+00	/		mobile	IT	\N	\N	fkl8i85nonnmthc8zh2	0	2026-08-31 14:33:17.807+00	qyrbm9r1iqpmthc8zh1
271	2026-08-31 10:20:25.118756+00	/viaggio		desktop	US	85	0	iz8sl4gnzlmth2qlaj	1	2026-08-31 10:21:25.12+00	oropiipjnykmth37sex
279	2026-08-31 10:21:55.343824+00	/viaggio		desktop	US	0	0	ihn7t2z67pmth39q16	1	2026-08-31 10:21:55.343+00	7aj809s5kdmth39q15
280	2026-08-31 10:21:57.333885+00	/viaggio		desktop	US	0	0	hfg7bgjae8cmth39rkg	1	2026-08-31 10:21:57.333+00	58a0uj2yy1mth39rkg
281	2026-08-31 10:21:59.229062+00	/viaggio		desktop	US	5	0	29bqj0990kbmth39t15	1	2026-08-31 10:21:59.228+00	12wod4uh0xvmth39t14
292	2026-08-31 14:36:31.158866+00	/		mobile	IT	5	100	yjpfmm2506mmthcd4qf	1	2026-08-31 14:36:31.145+00	eghbytxftrgmthcd4qe
293	2026-08-31 14:36:36.581801+00	/articoli		mobile	IT	15	100	yjpfmm2506mmthcd4qf	1	2026-08-31 14:36:36.581+00	upxl19py9uemthcd8x2
294	2026-08-31 14:36:50.10377+00	/journaling		mobile	IT	20	100	yjpfmm2506mmthcd4qf	1	2026-08-31 14:36:50.103+00	t33zpi1jnhmthcdj68
295	2026-08-31 14:37:07.904747+00	/statistiche		mobile	IT	25	100	yjpfmm2506mmthcd4qf	1	2026-08-31 14:37:31.194+00	vvsbdbmqdpimthcdx2g
296	2026-08-31 14:37:37.478738+00	/statistiche		mobile	IT	20	100	yjpfmm2506mmthcd4qf	1	2026-08-31 14:37:37.476+00	tto9t47biksmthcejw8
297	2026-08-31 14:38:00.103945+00	/viaggio		mobile	IT	15	100	yjpfmm2506mmthcd4qf	1	2026-08-31 14:38:00.08+00	os7tisaf23smthcf0ze
278	2026-08-31 10:21:50.663574+00	/viaggio		desktop	US	\N	\N	iz8sl4gnzlmth2qlaj	0	2026-08-31 10:36:50.666+00	mou901m2afmth39mf5
282	2026-08-31 11:14:27.188182+00	/		mobile	IT	20	100	zroshdgddsmth559x0	1	2026-08-31 11:14:27.175+00	xmzqflesojmth559ww
283	2026-08-31 11:14:49.407764+00	/viaggio		mobile	IT	20	100	zroshdgddsmth559x0	1	2026-08-31 11:14:49.394+00	njmmpzbt54mth55r2x
299	2026-08-31 14:39:08.355312+00	/privacy		desktop	US	0	0	cgw90bc1d97mthcgi7e	1	2026-08-31 14:39:08.34+00	686ehfgdj1imthcgi7d
298	2026-08-31 14:38:19.510446+00	/viaggio		desktop	IT	50	100	yjpfmm2506mmthcd4qf	1	2026-08-31 14:38:19.508+00	pakolsxdtnmthcfg82
300	2026-08-31 14:39:24.216376+00	/viaggio		desktop	IT	20	100	yjpfmm2506mmthcd4qf	1	2026-08-31 14:39:24.204+00	h5t8xpbwg6bmthcgu86
304	2026-09-02 10:20:02.733958+00	/clip/112		desktop	US	0	100	cvqgi8z59dvmtjy30h4	1	2026-09-02 10:20:02.733+00	x0bf21u12fmtjy30h4
305	2026-09-02 10:22:59.082942+00	/clip/9		desktop	US	5	100	38hsnmdetosmtjy6sjk	1	2026-09-02 10:22:59.08+00	3tvcavjashwmtjy6sjk
301	2026-08-31 14:39:46.375834+00	/viaggio		mobile	IT	95	100	yjpfmm2506mmthcd4qf	1	2026-08-31 14:41:16.342+00	5yabgm99zmmthchbay
302	2026-09-02 10:19:42.816984+00	/clip/114		desktop	US	5	100	ifxp4roklmrmtjy2l3l	1	2026-09-02 10:19:42.815+00	ymadhcj7gkmtjy2l3l
306	2026-09-02 11:20:09.933494+00	/clip/9		desktop	US	10	100	mb57wu5698mtk08bs6	1	2026-09-02 11:20:09.908+00	4kp3rkmi7qmtk08bs6
307	2026-09-02 11:20:18.945381+00	/clip/9		desktop	US	10	100	rrrqy3lszcbmtk08ire	1	2026-09-02 11:20:18.944+00	ni2zfhex27mtk08ire
308	2026-09-02 11:20:27.947716+00	/clip/1		desktop	US	10	100	owdy4ct0pbmtk08ppi	1	2026-09-02 11:20:27.946+00	02qjcubw1vbomtk08pph
309	2026-09-02 11:20:37.009463+00	/clip/99		desktop	US	5	100	p2it65dhqqdmtk08wp9	1	2026-09-02 11:20:37.008+00	4sw3aa342ekmtk08wp8
310	2026-09-02 11:20:44.339367+00	/clip/112		desktop	US	5	100	y1vtaicdlimtk092cr	1	2026-09-02 11:20:44.338+00	3oidvpjywxamtk092cq
311	2026-09-02 11:21:52.000255+00	/		desktop	US	0	100	qr7u8nlj0imtk0aijq	1	2026-09-02 11:21:51.98+00	d453r22dxdnmtk0aijp
312	2026-09-02 11:21:54.317869+00	/clip/0		desktop	US	5	100	t7ebnll6e3imtk0akcp	1	2026-09-02 11:21:54.316+00	dbn593h38fcmtk0akco
313	2026-09-02 11:22:18.172879+00	/clip/114		desktop	US	5	100	gghi097bqqkmtk0b2rb	1	2026-09-02 11:22:18.172+00	bi8h485ayksmtk0b2ra
314	2026-09-02 11:22:25.162144+00	/clip/114		desktop	US	5	100	b29v7q8kz08mtk0b85g	1	2026-09-02 11:22:25.161+00	xl8imwlpc8qmtk0b85f
315	2026-09-05 20:21:02.513241+00	/		mobile	IT	5	0	6dhtsgrbwp4mtotvg6j	1	2026-09-05 20:21:02.497+00	c7p88mxav3cmtotvg6g
318	2026-09-05 20:38:25.047463+00	/obiettivi		desktop	US	0	0	p2zhh1y9u1pmtouhssy	1	2026-09-05 20:38:25.046+00	r11b2nt21imtouhssv
316	2026-09-05 20:21:14.396393+00	/		desktop	IT	70	100	xjhu41p7y5cmtotvpdc	1	2026-09-05 20:22:25.518+00	jyr5gruav9mtotvpdb
317	2026-09-05 20:38:22.428452+00	/obiettivi		desktop	US	0	100	rna5zw9vp0dmtouhqrj	1	2026-09-05 20:38:22.41+00	a5eqso9spkmtouhqri
319	2026-09-05 20:38:33.86816+00	/obiettivi		desktop	US	0	0	j4v60i0f3uemtouhzlz	1	2026-09-05 20:38:33.867+00	24ftl9ygx8smtouhzlz
320	2026-09-05 20:38:36.277764+00	/obiettivi		desktop	US	0	0	4f2auy1f1cemtoui1gu	1	2026-09-05 20:38:36.277+00	hnq7v1wzbfmmtoui1gt
321	2026-09-05 20:52:31.011466+00	/		desktop	IT	15	100	eeg4fhiuwhmtouzxgg	1	2026-09-05 20:52:30.99+00	5or8vzw2hpfmtouzxgc
322	2026-09-05 20:52:44.809363+00	/obiettivi		desktop	IT	30	100	eeg4fhiuwhmtouzxgg	1	2026-09-05 20:52:44.8+00	v37ho9uccscmtov084a
323	2026-09-08 05:21:50.002349+00	/		desktop	GB	0	100	ksai7r7xoidmts82m59	1	2026-09-08 05:21:49.998+00	yxx5l4huph8mts82m58
324	2026-09-20 16:56:54.965169+00	/		desktop	US	\N	\N	8rmbqag7d44mua27m9y	0	2026-09-20 16:56:54.953+00	wdqic79xlemua27m9x
325	2026-10-13 05:18:06.981918+00	/giorno/155		desktop	US	0	100	9aq7t1d3z5lmv68cnl7	1	2026-10-13 05:18:06.97+00	q4eylbf3pomv68cnl5
326	2026-10-13 05:24:02.780176+00	/giorno/155		desktop	\N	\N	\N	fmaro2q5s2vmv68ka2g	0	2026-10-13 05:24:02.779+00	6umktcx4hemv68ka2d
328	2026-10-15 19:37:08.554529+00	/		desktop	US	390	100	d3pimligdz9mv9xmqwn	1	2026-10-15 19:43:09.232+00	cfr215y4zvrmv9xx2zl
327	2026-10-15 19:29:06.308782+00	/		desktop	US	480	100	d3pimligdz9mv9xmqwn	1	2026-10-15 19:37:06.302+00	awwi49pw764mv9xmqwm
371	2026-10-15 21:14:21.561137+00	/viaggio		desktop	\N	0	100	5wve4na2ie9mva1e2hd	1	2026-10-15 21:14:21.559+00	8ht5lywelx8mva1e3ej
329	2026-10-15 20:06:19.892793+00	/		desktop	US	140	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:07:19.906+00	gwz4usjhdumv9yymd4
330	2026-10-15 20:08:53.620083+00	/		desktop	US	0	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:08:53.609+00	d4zzfrii3ximv9z1www
349	2026-10-15 20:34:20.28217+00	/chi-sono		desktop	US	30	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:34:36.19+00	a8i22undflumv9zymwu
372	2026-10-15 21:14:22.796756+00	/social		desktop	\N	0	0	5wve4na2ie9mva1e2hd	1	2026-10-15 21:14:22.796+00	rb3zt2ziyc8mva1e4dk
357	2026-10-15 20:56:34.980645+00	/diario		desktop	US	220	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:59:35.014+00	576e0qe5xhrmva0r8ux
358	2026-10-15 21:04:40.391195+00	/		desktop	\N	\N	\N	gq7211lqxrvmva11myz	0	2026-10-15 21:04:40.389+00	kyy6kaqysnmva11myt
359	2026-10-15 21:05:13.867886+00	/articoli/non-mi-sono-fermato		desktop	US	5	100	9m4g8o8w1ylmva12ctl	1	2026-10-15 21:05:13.838+00	p2l1gbg3v2amva12ctk
360	2026-10-15 21:06:20.35565+00	/		desktop	\N	\N	\N	diheecrb9tpmva13s4e	0	2026-10-15 21:06:20.355+00	r07xb3ubd9emva13s4b
361	2026-10-15 21:07:22.411104+00	/		desktop	\N	\N	\N	18iixqoigzwmva1540c	0	2026-10-15 21:07:22.41+00	7zhimfkglnumva153zt
350	2026-10-15 20:34:48.76339+00	/diario		desktop	US	640	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:44:36.83+00	sbphg8w9cwmv9zz8ws
352	2026-10-15 20:46:22.548409+00	/		desktop	US	0	100	t5bne2rs0s8mva0e3wk	1	2026-10-15 20:46:22.537+00	lwsoa2l0bomva0e3wk
331	2026-10-15 20:09:36.510625+00	/		desktop	US	865	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:23:35.366+00	1b1uzyc8n5qmv9z2t6z
332	2026-10-15 20:24:05.725194+00	/		desktop	US	10	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:24:05.722+00	c36h3z70iqomv9zlgsm
333	2026-10-15 20:24:19.541181+00	/		desktop	US	50	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:24:19.538+00	ihbnr1zsi8emv9zlrdt
334	2026-10-15 20:25:07.906186+00	/diario		desktop	US	15	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:25:19.597+00	m5ouhz5v48omv9zmsps
336	2026-10-15 20:26:28.814623+00	/diario		desktop	US	0	0	8q4warkw615mv9zoitk	1	2026-10-15 20:26:28.813+00	gn43njnw055mv9zoitj
337	2026-10-15 20:28:21.686338+00	/diario		desktop	\N	5	100	0hokesttj2semv9zqxr4	1	2026-10-15 20:28:21.519+00	z8m62cv5w79mv9zqxr0
338	2026-10-15 20:28:26.022433+00	/statistiche		desktop	\N	0	100	0hokesttj2semv9zqxr4	1	2026-10-15 20:28:26.021+00	a9621qhzjebmv9zr18c
339	2026-10-15 20:28:26.186651+00	/diario		desktop	\N	0	100	0hokesttj2semv9zqxr4	1	2026-10-15 20:28:26.184+00	bjzgkv43b5vmv9zr1cw
340	2026-10-15 20:28:27.730569+00	/journaling		desktop	\N	0	100	0hokesttj2semv9zqxr4	1	2026-10-15 20:28:27.729+00	zzl6jas8q0emv9zr2jf
341	2026-10-15 20:28:27.842351+00	/diario		desktop	\N	0	100	0hokesttj2semv9zqxr4	1	2026-10-15 20:28:27.841+00	i67hh5a3iwhmv9zr2mw
342	2026-10-15 20:28:29.697085+00	/diario		desktop	\N	\N	\N	0hokesttj2semv9zqxr4	0	2026-10-15 20:28:29.695+00	hqjja1xnccmv9zr420
335	2026-10-15 20:26:21.991675+00	/diario		desktop	US	175	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:26:21.747+00	x2s77p9ebi8mv9zodqo
353	2026-10-15 20:46:36.244443+00	/		desktop	\N	0	100	smjfz3e27q8mva0eefu	1	2026-10-15 20:46:36.225+00	jmwnvwfny9lmva0eefr
354	2026-10-15 20:46:38.831384+00	/diario		desktop	\N	\N	\N	smjfz3e27q8mva0eefu	0	2026-10-15 20:46:38.83+00	k2f3ur9ao1jmva0eggd
343	2026-10-15 20:29:19.241594+00	/diario		desktop	US	125	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:31:19.244+00	5dosu5mewpvmv9zs6pg
345	2026-10-15 20:31:30.24981+00	/diario		desktop	US	0	0	ta3fg8eltphmv9zuzep	1	2026-10-15 20:31:30.248+00	8gg3vsp365dmv9zuzeo
344	2026-10-15 20:31:27.612689+00	/diario		desktop	US	50	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:31:27.611+00	vkhz99vs7tfmv9zuxqj
347	2026-10-15 20:32:42.884124+00	/diario		desktop	\N	\N	\N	7ixxoz1y0u7mv9zwjen	0	2026-10-15 20:32:42.882+00	ry6sic1sgmv9zwje3
346	2026-10-15 20:32:36.201983+00	/		desktop	US	25	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:32:36.173+00	0h38lcb3pr1mv9zwenc
362	2026-10-15 21:08:47.39604+00	/		desktop	\N	\N	\N	7y867opnbscmva16xkt	0	2026-10-15 21:08:47.395+00	k6wybns4y7emva16xkh
348	2026-10-15 20:33:02.756268+00	/diario		desktop	US	75	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:33:36.389+00	73v7sin8nw4mv9zwz59
363	2026-10-15 21:12:19.459172+00	/		desktop	\N	0	100	jf10i7wym1qmva1bh7e	1	2026-10-15 21:12:19.458+00	bvofi7bvgiomva1bh71
355	2026-10-15 20:48:18.072177+00	/diario		desktop	\N	0	100	hi9qwqcra7tmva0gkzw	1	2026-10-15 20:48:18.07+00	k408nkb9wgsmva0gkzr
356	2026-10-15 20:48:21.191389+00	/		desktop	\N	\N	\N	hi9qwqcra7tmva0gkzw	0	2026-10-15 20:48:21.19+00	pp2mcuevz1mva0gne4
364	2026-10-15 21:12:22.03104+00	/diario		desktop	\N	0	100	jf10i7wym1qmva1bh7e	1	2026-10-15 21:12:22.027+00	buo42wxktqumva1bj6h
365	2026-10-15 21:12:24.060557+00	/articoli/non-mi-sono-fermato		desktop	\N	0	100	jf10i7wym1qmva1bh7e	1	2026-10-15 21:12:24.059+00	h9fyhpbays4mva1bkrb
366	2026-10-15 21:12:25.893094+00	/a/non-mi-sono-fermato		desktop	\N	0	0	jf10i7wym1qmva1bh7e	1	2026-10-15 21:12:25.892+00	xwkjthi3x3bmva1bm67
367	2026-10-15 21:12:26.862534+00	/articoli		desktop	\N	5	0	jf10i7wym1qmva1bh7e	1	2026-10-15 21:12:26.861+00	gruxmmqhllpmva1bmww
351	2026-10-15 20:45:46.7645+00	/diario		desktop	US	645	100	d3pimligdz9mv9xmqwn	1	2026-10-15 20:55:46.76+00	u62rzjtt5bdmva0dcok
368	2026-10-15 21:12:29.757359+00	/chi-sono		desktop	\N	0	75	jf10i7wym1qmva1bh7e	1	2026-10-15 21:12:29.756+00	o0vub3hjcomva1bp62
369	2026-10-15 21:12:31.242839+00	/obiettivi		desktop	\N	\N	\N	jf10i7wym1qmva1bh7e	0	2026-10-15 21:12:31.242+00	p9z32khxatomva1bqax
370	2026-10-15 21:14:20.375163+00	/obiettivi		desktop	\N	0	100	5wve4na2ie9mva1e2hd	1	2026-10-15 21:14:20.35+00	c21hg48egibmva1e2h8
373	2026-10-15 21:14:23.989694+00	/sponsor		desktop	\N	0	0	5wve4na2ie9mva1e2hd	1	2026-10-15 21:14:23.989+00	fb9aynzvttmva1e5aq
374	2026-10-15 21:14:25.158613+00	/coaching		desktop	\N	0	0	5wve4na2ie9mva1e2hd	1	2026-10-15 21:14:25.158+00	iolfxtu1ifmmva1e66v
375	2026-10-15 21:14:26.361862+00	/privacy		desktop	\N	0	0	5wve4na2ie9mva1e2hd	1	2026-10-15 21:14:26.361+00	0fk94uehmgemva1e748
376	2026-10-15 21:14:27.544992+00	/termini		desktop	\N	0	0	5wve4na2ie9mva1e2hd	1	2026-10-15 21:14:27.544+00	2y5fkytikktmva1e81p
377	2026-10-15 21:14:28.769719+00	/grazie		desktop	\N	0	0	5wve4na2ie9mva1e2hd	1	2026-10-15 21:14:28.768+00	t8j2at6rj1qmva1e8z7
378	2026-10-15 21:14:32.14716+00	/articoli/non-mi-sono-fermato		desktop	\N	0	100	5wve4na2ie9mva1e2hd	1	2026-10-15 21:14:32.146+00	bw2wr1hl34rmva1ebke
379	2026-10-15 21:14:34.536317+00	/articoli/non-mi-sono-fermato		desktop	\N	\N	\N	5wve4na2ie9mva1e2hd	0	2026-10-15 21:14:34.535+00	y3xlm32a93nmva1eden
380	2026-10-15 21:15:51.856482+00	/privacy		desktop	\N	0	100	snrfbuuxktdmva1g12m	1	2026-10-15 21:15:51.84+00	dylv0sj23y6mva1g12f
381	2026-10-15 21:15:52.87202+00	/articoli/non-mi-sono-fermato		desktop	\N	\N	\N	snrfbuuxktdmva1g12m	0	2026-10-15 21:15:52.871+00	b3i7dyaawggmva1g1ve
382	2026-10-16 12:22:04.474657+00	/diario		desktop	US	0	100	uqa5gfl6gqbmvaxtfa5	1	2026-10-16 12:22:04.457+00	t04p28j6zzmvaxtfa4
383	2026-10-16 13:02:57.616724+00	/		desktop	US	5	100	j7jfxl77uwmvaza05h	1	2026-10-16 13:02:57.614+00	oo78j321cjmvaza05g
384	2026-10-16 13:03:47.443048+00	/diario		desktop	US	5	100	gzqhxm10sx8mvazb2l3	1	2026-10-16 13:03:47.427+00	ty0qsve4nxdmvazb2l2
385	2026-10-16 13:29:40.481695+00	/		desktop	US	5	100	wx841zapn2jmvb08cwd	1	2026-10-16 13:29:40.443+00	u5ko6k4ac88mvb08cwc
386	2026-10-16 13:29:54.833123+00	/		desktop	US	0	0	f0vz8v52oi8mvb08nzz	1	2026-10-16 13:29:54.82+00	2voiqcw1le5mvb08nzz
\.


--
-- Data for Name: pageviews_daily; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pageviews_daily (id, date, path, device, source, country, views, duration_sum, duration_count, scroll_sum, scroll_count, completed_count) FROM stdin;
\.


--
-- Data for Name: pagine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pagine (id, slug, titolo, contenuto, pubblicata, ordine, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: planner_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planner_notes (id, data, tipo, testo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: social; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.social (id, nome, url, icona, descrizione, ordine, visibile, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sponsor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sponsor (id, nome, descrizione, url, logo, livello, ordine, visibile, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tappe; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tappe (id, ciclo, numero, giorno_inizio, giorno_fine, chiusa, nota) FROM stdin;
1	1	1	1	7	f	\N
\.


--
-- Data for Name: task; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task (id, obiettivo_id, tappa_id, testo, giorno_completato, saltato, ordine) FROM stdin;
\.


--
-- Data for Name: task_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_templates (id, testo, tipo, priorita, ordine, created_at) FROM stdin;
1	DIARIO	DIARIO	1	0	2026-08-12 18:18:24.430091+00
2	CARD IG	POST	1	1	2026-08-12 18:18:24.469385+00
3	STORIA IG	POST	2	2	2026-08-12 18:18:24.505243+00
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, data, testo, tipo, stato, priorita, created_at, ordine) FROM stdin;
\.


--
-- Name: articoli_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.articoli_id_seq', 17, true);


--
-- Name: candidature_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.candidature_id_seq', 1, true);


--
-- Name: coaching_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coaching_id_seq', 1, false);


--
-- Name: contatti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contatti_id_seq', 1, true);


--
-- Name: giorni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.giorni_id_seq', 271, true);


--
-- Name: iscritti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iscritti_id_seq', 1, false);


--
-- Name: obiettivi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.obiettivi_id_seq', 63, true);


--
-- Name: pageviews_daily_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pageviews_daily_id_seq', 2, true);


--
-- Name: pageviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pageviews_id_seq', 386, true);


--
-- Name: pagine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pagine_id_seq', 1, false);


--
-- Name: planner_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.planner_notes_id_seq', 1, true);


--
-- Name: social_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.social_id_seq', 1, false);


--
-- Name: sponsor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sponsor_id_seq', 1, false);


--
-- Name: tappe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tappe_id_seq', 21, true);


--
-- Name: task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_id_seq', 1, false);


--
-- Name: task_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_templates_id_seq', 4, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 9, true);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (sid);


--
-- Name: articoli articoli_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articoli
    ADD CONSTRAINT articoli_pkey PRIMARY KEY (id);


--
-- Name: articoli articoli_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articoli
    ADD CONSTRAINT articoli_slug_unique UNIQUE (slug);


--
-- Name: bozze bozze_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bozze
    ADD CONSTRAINT bozze_pkey PRIMARY KEY (numero);


--
-- Name: candidature candidature_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidature
    ADD CONSTRAINT candidature_pkey PRIMARY KEY (id);


--
-- Name: coaching coaching_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching
    ADD CONSTRAINT coaching_pkey PRIMARY KEY (id);


--
-- Name: contatti contatti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contatti
    ADD CONSTRAINT contatti_pkey PRIMARY KEY (id);


--
-- Name: contenuti contenuti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contenuti
    ADD CONSTRAINT contenuti_pkey PRIMARY KEY (chiave);


--
-- Name: giorni giorni_numero_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giorni
    ADD CONSTRAINT giorni_numero_unique UNIQUE (numero);


--
-- Name: giorni giorni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giorni
    ADD CONSTRAINT giorni_pkey PRIMARY KEY (id);


--
-- Name: iscritti iscritti_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iscritti
    ADD CONSTRAINT iscritti_email_unique UNIQUE (email);


--
-- Name: iscritti iscritti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iscritti
    ADD CONSTRAINT iscritti_pkey PRIMARY KEY (id);


--
-- Name: obiettivi obiettivi_ciclo_posizione_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obiettivi
    ADD CONSTRAINT obiettivi_ciclo_posizione_unique UNIQUE (ciclo, posizione);


--
-- Name: obiettivi obiettivi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obiettivi
    ADD CONSTRAINT obiettivi_pkey PRIMARY KEY (id);


--
-- Name: pageviews_daily pageviews_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pageviews_daily
    ADD CONSTRAINT pageviews_daily_pkey PRIMARY KEY (id);


--
-- Name: pageviews pageviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pageviews
    ADD CONSTRAINT pageviews_pkey PRIMARY KEY (id);


--
-- Name: pagine pagine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagine
    ADD CONSTRAINT pagine_pkey PRIMARY KEY (id);


--
-- Name: pagine pagine_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagine
    ADD CONSTRAINT pagine_slug_unique UNIQUE (slug);


--
-- Name: planner_notes planner_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_notes
    ADD CONSTRAINT planner_notes_pkey PRIMARY KEY (id);


--
-- Name: social social_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social
    ADD CONSTRAINT social_pkey PRIMARY KEY (id);


--
-- Name: sponsor sponsor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsor
    ADD CONSTRAINT sponsor_pkey PRIMARY KEY (id);


--
-- Name: tappe tappe_ciclo_numero_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tappe
    ADD CONSTRAINT tappe_ciclo_numero_unique UNIQUE (ciclo, numero);


--
-- Name: tappe tappe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tappe
    ADD CONSTRAINT tappe_pkey PRIMARY KEY (id);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: task_templates task_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions_expire_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_sessions_expire_idx ON public.admin_sessions USING btree (expire);


--
-- Name: pageviews_daily_dims_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pageviews_daily_dims_idx ON public.pageviews_daily USING btree (date, path, device, source, country);


--
-- Name: pageviews_path_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pageviews_path_idx ON public.pageviews USING btree (path);


--
-- Name: pageviews_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pageviews_timestamp_idx ON public.pageviews USING btree ("timestamp");


--
-- Name: pageviews_view_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pageviews_view_id_idx ON public.pageviews USING btree (view_id);


--
-- Name: task task_obiettivo_id_obiettivi_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_obiettivo_id_obiettivi_id_fk FOREIGN KEY (obiettivo_id) REFERENCES public.obiettivi(id) ON DELETE CASCADE;


--
-- Name: task task_tappa_id_tappe_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_tappa_id_tappe_id_fk FOREIGN KEY (tappa_id) REFERENCES public.tappe(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PoCbbbePlakOZBJHF4YgbVZMLT3akNSV79m1YEyIGce4kZgFw03bs0Bcco1OGTL

