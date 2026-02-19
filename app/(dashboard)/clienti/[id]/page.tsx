"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardPrenotazione } from "@/components/prenotazioni/card-prenotazione";
import { ChevronLeft, Phone, Mail, BookOpen, Menu } from "lucide-react";
import { STATO_COLORE, STATO_LABEL } from "@/types";
import { formatData } from "@/lib/date";
import { useSidebar } from "@/components/layout/sidebar-context";

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toggle } = useSidebar();

  const { data: cliente, isLoading } = useQuery({
    queryKey: ["cliente", id],
    queryFn: () => fetch(`/api/clienti/${id}`).then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cliente || cliente.error) {
    return <div className="p-6 text-gray-500">Cliente non trovato</div>;
  }

  const prenotazioniPassate = cliente.prenotazioni?.filter(
    (p: { data: string }) => new Date(p.data) < new Date()
  );
  const prenotazioniFuture = cliente.prenotazioni?.filter(
    (p: { data: string }) => new Date(p.data) >= new Date()
  );

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <button onClick={toggle} className="lg:hidden rounded-xl p-2 text-gray-500 hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/clienti">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Clienti
            </Button>
          </Link>
          <h1 className="font-semibold text-gray-900 truncate">{cliente.nome}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Profilo */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-indigo-700">{cliente.nome.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{cliente.nome}</h2>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone className="h-4 w-4" /> {cliente.telefono}
                </span>
                {cliente.email && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Mail className="h-4 w-4" /> {cliente.email}
                  </span>
                )}
              </div>
              {cliente.note && (
                <div className="mt-3 text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                  ⚠️ {cliente.note}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{cliente._count?.prenotazioni ?? 0}</p>
              <p className="text-xs text-gray-500">Prenotazioni totali</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{prenotazioniFuture?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Future</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-500">{prenotazioniPassate?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Passate</p>
            </div>
          </div>
        </div>

        {/* Prenotazioni future */}
        {prenotazioniFuture?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Prossime prenotazioni
            </h3>
            <div className="space-y-2">
              {prenotazioniFuture.map((p: { id: string; data: string; orario: string; coperti: number; sala: { nome: string }; stato: keyof typeof STATO_LABEL; note?: string | null; cliente: { id: string; nome: string; telefono: string; email?: string | null; note?: string | null; createdAt: string; updatedAt: string } }) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatData(p.data)}</p>
                    <p className="text-xs text-gray-500">{p.orario} · {p.coperti} coperti · {p.sala?.nome}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge className={STATO_COLORE[p.stato]}>{STATO_LABEL[p.stato]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storico */}
        {prenotazioniPassate?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Storico prenotazioni</h3>
            <div className="space-y-2">
              {prenotazioniPassate.slice(0, 20).map((p: { id: string; data: string; orario: string; coperti: number; sala: { nome: string }; stato: keyof typeof STATO_LABEL }) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 opacity-70">
                  <div>
                    <p className="text-sm text-gray-700">{formatData(p.data)}</p>
                    <p className="text-xs text-gray-400">{p.orario} · {p.coperti} coperti · {p.sala?.nome}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge className={STATO_COLORE[p.stato]} variant="outline">{STATO_LABEL[p.stato]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
