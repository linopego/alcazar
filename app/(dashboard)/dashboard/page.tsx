"use client";

import { useState, useEffect } from "react";
import { TimelineGiornaliera } from "@/components/prenotazioni/timeline-giornaliera";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPrenotazione } from "@/components/prenotazioni/form-prenotazione";
import { ChevronLeft, ChevronRight, Menu, Plus } from "lucide-react";
import { formatData, labelGiorno, addDays, subDays, isToday, formatDataISO } from "@/lib/date";
import { useSidebar } from "@/components/layout/sidebar-context";

export default function DashboardPage() {
  const [data, setData] = useState(new Date());
  const [nuovaOpen, setNuovaOpen] = useState(false);
  const { toggle } = useSidebar();

  // Listener for "today" event from header
  useEffect(() => {
    const handler = () => setData(new Date());
    window.addEventListener("go-to-today", handler);
    return () => window.removeEventListener("go-to-today", handler);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <button
            onClick={toggle}
            className="lg:hidden rounded-xl p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setData(subDays(data, 1))} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[200px] md:min-w-[240px]">
              <p className="font-semibold text-gray-900 text-sm md:text-base">
                {labelGiorno(data)}
              </p>
              <p className="text-xs text-gray-500">{formatData(data)}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setData(addDays(data, 1))} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isToday(data) && (
            <Button variant="outline" size="sm" onClick={() => setData(new Date())}>
              Oggi
            </Button>
          )}

          <div className="ml-auto">
            <Button onClick={() => setNuovaOpen(true)} size="default">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Prenotazione</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <TimelineGiornaliera data={data} />
      </div>

      {/* Dialog nuova prenotazione */}
      <Dialog open={nuovaOpen} onOpenChange={setNuovaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova prenotazione</DialogTitle>
          </DialogHeader>
          <FormPrenotazione
            defaultData={formatDataISO(data)}
            onSuccess={() => setNuovaOpen(false)}
            onCancel={() => setNuovaOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
