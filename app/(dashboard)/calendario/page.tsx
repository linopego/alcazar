"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimelineGiornaliera } from "@/components/prenotazioni/timeline-giornaliera";
import { FormPrenotazione } from "@/components/prenotazioni/form-prenotazione";
import {
  ChevronLeft, ChevronRight, Menu, Plus, Star
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks,
  isSameDay, isSameMonth, isToday, parseISO
} from "date-fns";
import { it } from "date-fns/locale";
import { formatDataISO } from "@/lib/date";
import type { Prenotazione, Evento } from "@/types";
import { useSidebar } from "@/components/layout/sidebar-context";

const GIORNI_SETTIMANA = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

interface GiornoCalendario {
  data: Date;
  prenotazioni: Prenotazione[];
  eventi: Evento[];
  isCurrentMonth: boolean;
}

function CalendarioMensile({
  mese,
  prenotazioni,
  eventi,
  onGiornoClick,
}: {
  mese: Date;
  prenotazioni: Prenotazione[];
  eventi: Evento[];
  onGiornoClick: (d: Date) => void;
}) {
  const inizio = startOfWeek(startOfMonth(mese), { weekStartsOn: 1 });
  const fine = endOfWeek(endOfMonth(mese), { weekStartsOn: 1 });
  const giorni: GiornoCalendario[] = eachDayOfInterval({ start: inizio, end: fine }).map((d) => ({
    data: d,
    prenotazioni: prenotazioni.filter(
      (p) => isSameDay(parseISO(p.data.split("T")[0]), d) && p.stato !== "CANCELLATA"
    ),
    eventi: eventi.filter((e) => isSameDay(parseISO(e.data.split("T")[0]), d)),
    isCurrentMonth: isSameMonth(d, mese),
  }));

  return (
    <div>
      {/* Intestazione giorni */}
      <div className="grid grid-cols-7 mb-1">
        {GIORNI_SETTIMANA.map((g) => (
          <div key={g} className="text-center text-xs font-medium text-gray-400 py-2">
            {g}
          </div>
        ))}
      </div>
      {/* Griglia giorni */}
      <div className="grid grid-cols-7 gap-1">
        {giorni.map((g, i) => (
          <button
            key={i}
            onClick={() => onGiornoClick(g.data)}
            className={`
              rounded-xl p-1.5 md:p-2 min-h-[60px] md:min-h-[80px] text-left transition-colors
              ${g.isCurrentMonth ? "bg-white hover:bg-indigo-50" : "bg-gray-50 opacity-50"}
              ${isToday(g.data) ? "ring-2 ring-indigo-500" : "border border-gray-100"}
            `}
          >
            <span
              className={`
                text-xs md:text-sm font-semibold block mb-1
                ${isToday(g.data) ? "text-indigo-600" : g.isCurrentMonth ? "text-gray-900" : "text-gray-400"}
              `}
            >
              {format(g.data, "d")}
            </span>
            {/* Indicatori prenotazioni */}
            {g.prenotazioni.length > 0 && (
              <div className="flex items-center gap-0.5 mb-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span className="text-xs text-indigo-600 hidden md:inline">
                  {g.prenotazioni.length}
                </span>
              </div>
            )}
            {/* Indicatori eventi */}
            {g.eventi.map((e) => (
              <div
                key={e.id}
                className="hidden md:block text-xs truncate rounded px-1 py-0.5 bg-amber-100 text-amber-800 mt-0.5"
              >
                {e.nome}
              </div>
            ))}
            {g.eventi.length > 0 && (
              <Star className="md:hidden h-3 w-3 text-amber-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function CalendarioSettimanale({
  settimana,
  prenotazioni,
  eventi,
  onGiornoClick,
}: {
  settimana: Date;
  prenotazioni: Prenotazione[];
  eventi: Evento[];
  onGiornoClick: (d: Date) => void;
}) {
  const inizio = startOfWeek(settimana, { weekStartsOn: 1 });
  const giorni = eachDayOfInterval({ start: inizio, end: endOfWeek(settimana, { weekStartsOn: 1 }) });

  return (
    <div className="grid grid-cols-7 gap-2">
      {giorni.map((g, i) => {
        const prenGiorno = prenotazioni.filter(
          (p) => isSameDay(parseISO(p.data.split("T")[0]), g) && p.stato !== "CANCELLATA"
        );
        const evGiorno = eventi.filter((e) => isSameDay(parseISO(e.data.split("T")[0]), g));
        const totaleCoperti = prenGiorno.reduce((s, p) => s + p.coperti, 0);

        return (
          <button
            key={i}
            onClick={() => onGiornoClick(g)}
            className={`
              rounded-xl p-2 md:p-3 text-left transition-colors border
              ${isToday(g) ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:bg-indigo-50"}
            `}
          >
            <div className="text-center mb-2">
              <p className="text-xs text-gray-500 capitalize">{format(g, "EEE", { locale: it })}</p>
              <p className={`text-lg font-bold ${isToday(g) ? "text-indigo-600" : "text-gray-900"}`}>
                {format(g, "d")}
              </p>
            </div>
            {prenGiorno.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-600 font-medium">{prenGiorno.length} pren.</span>
                </div>
                <div className="text-xs text-gray-500">{totaleCoperti} cop.</div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">—</p>
            )}
            {evGiorno.length > 0 && (
              <div className="mt-1">
                {evGiorno.slice(0, 2).map((e) => (
                  <div key={e.id} className="text-xs truncate rounded px-1 bg-amber-100 text-amber-800 mt-0.5">
                    {e.nome}
                  </div>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function CalendarioPage() {
  const { toggle } = useSidebar();
  const [vista, setVista] = useState<"mensile" | "settimanale">("mensile");
  const [dataRif, setDataRif] = useState(new Date());
  const [giornoSelezionato, setGiornoSelezionato] = useState<Date | null>(null);
  const [nuovaOpen, setNuovaOpen] = useState(false);

  const from = vista === "mensile"
    ? format(startOfMonth(dataRif), "yyyy-MM-dd")
    : format(startOfWeek(dataRif, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const to = vista === "mensile"
    ? format(endOfMonth(dataRif), "yyyy-MM-dd")
    : format(endOfWeek(dataRif, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: prenotazioni = [] } = useQuery<Prenotazione[]>({
    queryKey: ["prenotazioni", from, to],
    queryFn: () => fetch(`/api/prenotazioni?from=${from}&to=${to}`).then((r) => r.json()),
  });

  const { data: eventi = [] } = useQuery<Evento[]>({
    queryKey: ["eventi", from, to],
    queryFn: () => fetch(`/api/eventi?from=${from}&to=${to}`).then((r) => r.json()),
  });

  const navPrev = () => {
    if (vista === "mensile") setDataRif(subMonths(dataRif, 1));
    else setDataRif(subWeeks(dataRif, 1));
  };
  const navNext = () => {
    if (vista === "mensile") setDataRif(addMonths(dataRif, 1));
    else setDataRif(addWeeks(dataRif, 1));
  };

  const labelPeriodo = vista === "mensile"
    ? format(dataRif, "MMMM yyyy", { locale: it })
    : `${format(startOfWeek(dataRif, { weekStartsOn: 1 }), "d MMM", { locale: it })} – ${format(endOfWeek(dataRif, { weekStartsOn: 1 }), "d MMM yyyy", { locale: it })}`;

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 px-4 py-3 md:px-6 flex-wrap">
          <button onClick={toggle} className="lg:hidden rounded-xl p-2 text-gray-500 hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-gray-900 min-w-[160px] text-center capitalize text-sm md:text-base">
              {labelPeriodo}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setDataRif(new Date())}>
            Oggi
          </Button>

          <Tabs value={vista} onValueChange={(v) => setVista(v as "mensile" | "settimanale")} className="ml-auto">
            <TabsList>
              <TabsTrigger value="mensile">Mese</TabsTrigger>
              <TabsTrigger value="settimanale">Settimana</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button onClick={() => setNuovaOpen(true)} size="default">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Prenotazione</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {/* Legenda */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-indigo-500" /> Prenotazioni
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-400" /> Eventi
          </span>
          <Badge variant="outline" className="ml-auto">
            {prenotazioni.filter(p => p.stato !== "CANCELLATA").length} prenotazioni nel periodo
          </Badge>
        </div>

        {vista === "mensile" ? (
          <CalendarioMensile
            mese={dataRif}
            prenotazioni={prenotazioni}
            eventi={eventi}
            onGiornoClick={(d) => setGiornoSelezionato(d)}
          />
        ) : (
          <CalendarioSettimanale
            settimana={dataRif}
            prenotazioni={prenotazioni}
            eventi={eventi}
            onGiornoClick={(d) => setGiornoSelezionato(d)}
          />
        )}
      </div>

      {/* Pannello dettaglio giorno */}
      {giornoSelezionato && (
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4 py-3 md:px-6 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 capitalize">
              {format(giornoSelezionato, "EEEE d MMMM", { locale: it })}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setGiornoSelezionato(null)}>
              ✕ Chiudi
            </Button>
          </div>
          <div className="px-4 pb-4 md:px-6 max-h-[50vh] overflow-y-auto">
            <TimelineGiornaliera data={giornoSelezionato} />
          </div>
        </div>
      )}

      <Dialog open={nuovaOpen} onOpenChange={setNuovaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova prenotazione</DialogTitle>
          </DialogHeader>
          <FormPrenotazione
            defaultData={giornoSelezionato ? formatDataISO(giornoSelezionato) : undefined}
            onSuccess={() => setNuovaOpen(false)}
            onCancel={() => setNuovaOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
