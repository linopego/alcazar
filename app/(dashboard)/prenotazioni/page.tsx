"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardPrenotazione } from "@/components/prenotazioni/card-prenotazione";
import { FormPrenotazione } from "@/components/prenotazioni/form-prenotazione";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Menu } from "lucide-react";
import { formatData, formatDataISO } from "@/lib/date";
import { STATO_LABEL } from "@/types";
import type { Prenotazione } from "@/types";
import { useSidebar } from "@/components/layout/sidebar-context";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function PrenotazioniPage() {
  const { toggle } = useSidebar();
  const [nuovaOpen, setNuovaOpen] = useState(false);
  const [ricerca, setRicerca] = useState("");
  const [filtroStato, setFiltroStato] = useState("ALL");
  const [filtroData, setFiltroData] = useState(formatDataISO(new Date()));

  const from = format(startOfMonth(new Date(filtroData || new Date())), "yyyy-MM-dd");
  const to = format(endOfMonth(new Date(filtroData || new Date())), "yyyy-MM-dd");

  const { data: prenotazioni = [], isLoading } = useQuery<Prenotazione[]>({
    queryKey: ["prenotazioni", from, to, filtroStato],
    queryFn: () =>
      fetch(
        `/api/prenotazioni?from=${from}&to=${to}${filtroStato !== "ALL" ? `&stato=${filtroStato}` : ""}`
      ).then((r) => r.json()),
  });

  const filtrate = prenotazioni.filter((p) => {
    if (!ricerca) return true;
    const q = ricerca.toLowerCase();
    return (
      p.cliente.nome.toLowerCase().includes(q) ||
      p.cliente.telefono.includes(q)
    );
  });

  // Raggruppa per data
  const raggruppate = filtrate.reduce<Record<string, Prenotazione[]>>((acc, p) => {
    const key = p.data.split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const dateOrdinate = Object.keys(raggruppate).sort();

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <button onClick={toggle} className="lg:hidden rounded-xl p-2 text-gray-500 hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-gray-900">Prenotazioni</h1>
          <div className="ml-auto">
            <Button onClick={() => setNuovaOpen(true)} size="default">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nuova</span>
            </Button>
          </div>
        </div>

        {/* Filtri */}
        <div className="px-4 pb-3 md:px-6 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca per nome o telefono..."
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Input
            type="month"
            value={filtroData.slice(0, 7)}
            onChange={(e) => setFiltroData(e.target.value + "-01")}
            className="w-40"
          />
          <Select value={filtroStato} onValueChange={setFiltroStato}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutti gli stati</SelectItem>
              {Object.entries(STATO_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : dateOrdinate.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-gray-500">Nessuna prenotazione trovata</p>
            <Button onClick={() => setNuovaOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nuova prenotazione
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {dateOrdinate.map((dataKey) => (
              <div key={dataKey}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">{formatData(dataKey)}</h2>
                  <Badge variant="secondary">{raggruppate[dataKey].length} pren.</Badge>
                  <Badge variant="outline">
                    {raggruppate[dataKey].reduce((s, p) => s + p.coperti, 0)} coperti
                  </Badge>
                </div>
                <div className="space-y-2">
                  {raggruppate[dataKey].map((p) => (
                    <CardPrenotazione key={p.id} prenotazione={p} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={nuovaOpen} onOpenChange={setNuovaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova prenotazione</DialogTitle>
          </DialogHeader>
          <FormPrenotazione
            onSuccess={() => setNuovaOpen(false)}
            onCancel={() => setNuovaOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
