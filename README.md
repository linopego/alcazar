# Alcazar — Gestione Prenotazioni Ristorante

Sistema digitale per la gestione delle prenotazioni in sostituzione del libro cartaceo.

## Stack Tecnologico

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Componenti Radix UI
- **Backend**: Next.js API Route Handlers
- **Database**: PostgreSQL + Prisma ORM v7 (adapter pg)
- **Comunicazioni**: Twilio (SMS) + Resend (Email)
- **Deploy consigliato**: Vercel + Supabase/Railway (PostgreSQL)

## Funzionalità

1. **Prenotazioni** — Crea, modifica, elimina con lookup automatico cliente per numero
2. **Vista Giornaliera** — Timeline per fascia oraria con disponibilità sale in tempo reale
3. **Calendario** — Vista mensile e settimanale con indicatori eventi
4. **Clienti** — Anagrafica con storico completo, allergie e preferenze
5. **Sale** — Configurazione sale con capienza e colore identificativo
6. **Eventi** — Blocco sale per eventi speciali, cene private, chiusure straordinarie
7. **Lista d'attesa** — Per le giornate al completo
8. **Notifiche automatiche** — SMS/email per conferma, promemoria e cancellazione

## Setup

### 1. Dipendenze

```bash
npm install
```

### 2. Variabili d'ambiente

Crea `.env` nella root e configura:

```env
DATABASE_URL="postgresql://user:password@host:5432/alcazar"

# Twilio (SMS) — opzionale
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Resend (Email) — opzionale
RESEND_API_KEY=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="stringa-segreta-casuale"
```

### 3. Database

```bash
# Genera il client Prisma
npm run db:generate

# Applica le migrazioni (crea le tabelle)
npm run db:migrate

# Carica dati iniziali (3 sale + cliente demo)
npm run db:seed
```

### 4. Sviluppo locale

```bash
npm run dev
# → http://localhost:3000
```

### 5. Deploy su Vercel

```bash
vercel --prod
```

Il cron job per i promemoria automatici è configurato in `vercel.json` (ogni giorno alle 10:00).

## Comandi Utili

```bash
npm run dev          # Sviluppo locale
npm run build        # Build produzione
npm run db:generate  # Genera client Prisma
npm run db:migrate   # Applica migrazioni
npm run db:seed      # Carica dati iniziali
npm run db:studio    # Prisma Studio (GUI database)
```

## Struttura del Progetto

```
alcazar/
├── app/
│   ├── (dashboard)/       # Pagine principali (layout con sidebar)
│   │   ├── dashboard/     # Vista giornaliera
│   │   ├── prenotazioni/  # Lista prenotazioni con filtri
│   │   ├── clienti/       # Anagrafica clienti + dettaglio
│   │   ├── sale/          # Configurazione sale
│   │   ├── eventi/        # Eventi speciali
│   │   └── calendario/    # Calendario mese/settimana
│   └── api/               # API REST
│       ├── prenotazioni/
│       ├── clienti/
│       ├── sale/
│       ├── eventi/
│       ├── lista-attesa/
│       ├── disponibilita/ # Calcolo coperti disponibili
│       └── cron/reminder/ # Job promemoria automatici
├── components/
│   ├── ui/               # Componenti base (Button, Dialog, ecc.)
│   ├── layout/           # Sidebar, context
│   └── prenotazioni/     # Form, cards, timeline
├── lib/
│   ├── prisma.ts         # Client Prisma (pg adapter)
│   ├── date.ts           # Utilità date (localizzazione italiana)
│   └── notifiche.ts      # Twilio + Resend
├── prisma/
│   ├── schema.prisma     # Schema database
│   └── seed.ts           # Dati iniziali
└── types/
    └── index.ts          # Tipi TypeScript condivisi
```
