export type StatoPrenotazione = "CONFERMATA" | "IN_ATTESA" | "CANCELLATA" | "NON_PRESENTATO";
export type StatoAttesa = "IN_ATTESA" | "PROMOSSO" | "CANCELLATO";
export type TipoEvento = "CENA_PRIVATA" | "SERATA_A_TEMA" | "CHIUSURA_STRAORDINARIA" | "ALTRO";
export type TipoNotifica = "CONFERMA" | "PROMEMORIA" | "CANCELLAZIONE";
export type CanaleNotifica = "SMS" | "EMAIL";
export type StatoNotifica = "IN_ATTESA" | "INVIATA" | "FALLITA";

export interface Sala {
  id: string;
  nome: string;
  tavoli: number;
  capienzaMax: number;
  colore: string;
  attiva: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  telefono: string;
  email?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { prenotazioni: number };
}

export interface Prenotazione {
  id: string;
  clienteId: string;
  salaId: string;
  data: string;
  orario: string;
  coperti: number;
  stato: StatoPrenotazione;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: Cliente;
  sala: Sala;
}

export interface ListaAttesa {
  id: string;
  clienteId: string;
  data: string;
  orarioPreferito?: string | null;
  coperti: number;
  note?: string | null;
  stato: StatoAttesa;
  createdAt: string;
  cliente: Cliente;
}

export interface Evento {
  id: string;
  nome: string;
  data: string;
  orarioInizio?: string | null;
  orarioFine?: string | null;
  salaId?: string | null;
  tipo: TipoEvento;
  note?: string | null;
  menuFisso: boolean;
  caparra: boolean;
  importoCaparra?: number | null;
  referente?: string | null;
  telefonoReferente?: string | null;
  createdAt: string;
  updatedAt: string;
  sala?: Sala | null;
}

export interface Disponibilita {
  salaId: string;
  nomeSala: string;
  colore: string;
  capienzaMax: number;
  tavoli: number;
  coperttiOccupati: number;
  coperttiDisponibili: number;
  bloccata: boolean;
  motivoBlockco?: string;
}

export const STATO_LABEL: Record<StatoPrenotazione, string> = {
  CONFERMATA: "Confermata",
  IN_ATTESA: "In attesa",
  CANCELLATA: "Cancellata",
  NON_PRESENTATO: "Non presentato",
};

export const STATO_COLORE: Record<StatoPrenotazione, string> = {
  CONFERMATA: "bg-green-100 text-green-800",
  IN_ATTESA: "bg-yellow-100 text-yellow-800",
  CANCELLATA: "bg-red-100 text-red-800",
  NON_PRESENTATO: "bg-gray-100 text-gray-800",
};

export const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  CENA_PRIVATA: "Cena Privata",
  SERATA_A_TEMA: "Serata a Tema",
  CHIUSURA_STRAORDINARIA: "Chiusura Straordinaria",
  ALTRO: "Altro",
};
