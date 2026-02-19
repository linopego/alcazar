"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CardPrenotazione } from "./card-prenotazione";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPrenotazione } from "./form-prenotazione";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Lock, AlertTriangle } from "lucide-react";
import { formatDataISO, ORARI_PRANZO, ORARI_CENA } from "@/lib/date";
import type { Prenotazione, Disponibilita } from "@/types";

interface Props {
  data: Date;
}

export function TimelineGiornaliera({ data }: Props) {
  const [nuovaOpen, setNuovaOpen] = useState(false);
  const [defaultOrario, setDefaultOrario] = useState("20:00");
  const dataISO = formatDataISO(data);

  const { data: prenotazioni = [], isLoading } = useQuery<Prenotazione[]>({
    queryKey: ["prenotazioni", dataISO],
    queryFn: () => fetch(`/api/prenotazioni?data=${dataISO}`).then((r) => r.json()),
  });

  const { data: disponibilita = [] } = useQuery<Disponibilita[]>({
    queryKey: ["disponibilita", dataISO],
    queryFn: () => fetch(`/api/disponibilita?data=${dataISO}`).then((r) => r.json()),
  });

  const { data: listaAttesa = [] } = useQuery({
    queryKey: ["lista-attesa", dataISO],
    queryFn: () => fetch(`/api/lista-attesa?data=${dataISO}`).then((r) => r.json()),
  });

  const prenotazioniAttive = prenotazioni.filter(
    (p) => p.stato !== "CANCELLATA"
  );

  const totaleCoperti = prenotazioniAttive.reduce((s, p) => s + p.coperti, 0);
  const totaleConfermati = prenotazioni.filter(p => p.stato === "CONFERMATA").reduce((s, p) => s + p.coperti, 0);

  const gruppiOrario = [...ORARI_PRANZO, ...ORARI_CENA].reduce<Record<string, Prenotazione[]>>(
    (acc, orario) => {
      acc[orario] = prenotazioniAttive.filter((p) => p.orario === orario);
      return acc;
    },
    {}
  );

  // Filtra solo orari con prenotazioni o adiacenti
  const orariConPrenotazioni = Object.entries(gruppiOrario).filter(
    ([, pren]) => pren.length > 0
  );

  const apriNuova = (orario?: string) => {
    if (orario) setDefaultOrario(orario);
    setNuovaOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Riepilogo disponibilità sale */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {disponibilita.map((d) => (
          <div
            key={d.salaId}
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.colore }} />
                <span className="text-sm font-medium text-gray-900 truncate">{d.nomeSala}</span>
              </div>
              {d.bloccata && <Lock className="h-4 w-4 text-red-500 shrink-0" />}
            </div>
            {d.bloccata ? (
              <p className="text-xs text-red-600 font-medium">{d.motivoBlockco ?? "Bloccata"}</p>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {d.coperttiOccupati}/{d.capienzaMax}
                  </span>
                  <span
                    className={
                      d.coperttiDisponibili === 0
                        ? "text-red-600 font-semibold"
                        : d.coperttiDisponibili < d.capienzaMax * 0.3
                        ? "text-orange-600 font-semibold"
                        : "text-green-600 font-semibold"
                    }
                  >
                    {d.coperttiDisponibili} liberi
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (d.coperttiOccupati / d.capienzaMax) * 100)}%`,
                      backgroundColor: d.colore,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        ))}

        {/* Totale giornata */}
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-3">
          <p className="text-xs font-semibold text-indigo-600 mb-1">Totale giornata</p>
          <p className="text-2xl font-bold text-indigo-900">{totaleCoperti}</p>
          <p className="text-xs text-indigo-600">coperti attivi</p>
          <p className="text-xs text-gray-500 mt-1">{totaleConfermati} confermati</p>
        </div>
      </div>

      {/* Lista attesa */}
      {listaAttesa.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-800">
              Lista d&apos;attesa ({listaAttesa.length})
            </span>
          </div>
          <div className="space-y-2">
            {listaAttesa.map((entry: { id: string; cliente: { nome: string; telefono: string }; orarioPreferito?: string | null; coperti: number }) => (
              <div key={entry.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.cliente.nome}</p>
                  <p className="text-xs text-gray-500">
                    {entry.cliente.telefono} · {entry.coperti} coperti
                    {entry.orarioPreferito && ` · ${entry.orarioPreferito}`}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => apriNuova(entry.orarioPreferito ?? undefined)}>
                  Prenota
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {/* Pranzo */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pranzo</span>
            <div className="flex-1 h-px bg-gray-200" />
            <Button size="sm" variant="outline" onClick={() => apriNuova("12:30")}>
              <Plus className="h-3 w-3 mr-1" /> Aggiungi
            </Button>
          </div>
          <div className="space-y-2">
            {ORARI_PRANZO.map((orario) => {
              const prenotazioniOrario = gruppiOrario[orario] ?? [];
              if (prenotazioniOrario.length === 0) return null;
              return (
                <div key={orario}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-gray-700 w-12">{orario}</span>
                    <Badge variant="secondary">{prenotazioniOrario.length} pren.</Badge>
                    <span className="text-xs text-gray-400">
                      {prenotazioniOrario.reduce((s, p) => s + p.coperti, 0)} coperti
                    </span>
                  </div>
                  <div className="space-y-1.5 ml-2 pl-12 border-l-2 border-gray-100">
                    {prenotazioniOrario.map((p) => (
                      <CardPrenotazione key={p.id} prenotazione={p} compact />
                    ))}
                  </div>
                </div>
              );
            })}
            {!ORARI_PRANZO.some((o) => (gruppiOrario[o] ?? []).length > 0) && (
              <p className="text-sm text-gray-400 py-2 text-center">Nessuna prenotazione a pranzo</p>
            )}
          </div>
        </div>

        {/* Cena */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cena</span>
            <div className="flex-1 h-px bg-gray-200" />
            <Button size="sm" variant="outline" onClick={() => apriNuova("20:00")}>
              <Plus className="h-3 w-3 mr-1" /> Aggiungi
            </Button>
          </div>
          <div className="space-y-2">
            {ORARI_CENA.map((orario) => {
              const prenotazioniOrario = gruppiOrario[orario] ?? [];
              if (prenotazioniOrario.length === 0) return null;
              return (
                <div key={orario}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-gray-700 w-12">{orario}</span>
                    <Badge variant="secondary">{prenotazioniOrario.length} pren.</Badge>
                    <span className="text-xs text-gray-400">
                      {prenotazioniOrario.reduce((s, p) => s + p.coperti, 0)} coperti
                    </span>
                  </div>
                  <div className="space-y-1.5 ml-2 pl-12 border-l-2 border-gray-100">
                    {prenotazioniOrario.map((p) => (
                      <CardPrenotazione key={p.id} prenotazione={p} compact />
                    ))}
                  </div>
                </div>
              );
            })}
            {!ORARI_CENA.some((o) => (gruppiOrario[o] ?? []).length > 0) && (
              <p className="text-sm text-gray-400 py-2 text-center">Nessuna prenotazione a cena</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottone aggiunta fuori fascia */}
      {orariConPrenotazioni.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Nessuna prenotazione per oggi</p>
          <Button onClick={() => apriNuova()}>
            <Plus className="h-4 w-4 mr-2" /> Nuova prenotazione
          </Button>
        </div>
      )}

      {/* Dialog nuova prenotazione */}
      <Dialog open={nuovaOpen} onOpenChange={setNuovaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova prenotazione</DialogTitle>
          </DialogHeader>
          <FormPrenotazione
            defaultData={dataISO}
            onSuccess={() => setNuovaOpen(false)}
            onCancel={() => setNuovaOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
