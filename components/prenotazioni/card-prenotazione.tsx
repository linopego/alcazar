"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormPrenotazione } from "./form-prenotazione";
import { useToast } from "@/components/ui/use-toast";
import { Users, Phone, MoreVertical, Edit, Trash2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { STATO_LABEL, STATO_COLORE } from "@/types";
import type { Prenotazione } from "@/types";

interface Props {
  prenotazione: Prenotazione;
  compact?: boolean;
}

const STATO_ICONS = {
  CONFERMATA: CheckCircle,
  IN_ATTESA: Clock,
  CANCELLATA: XCircle,
  NON_PRESENTATO: AlertTriangle,
};

export function CardPrenotazione({ prenotazione, compact = false }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const IconStato = STATO_ICONS[prenotazione.stato];

  const cambiaStato = useMutation({
    mutationFn: async (stato: string) => {
      const res = await fetch(`/api/prenotazioni/${prenotazione.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stato }),
      });
      if (!res.ok) throw new Error("Errore aggiornamento stato");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prenotazioni"] });
      queryClient.invalidateQueries({ queryKey: ["disponibilita"] });
    },
    onError: () => toast({ title: "Errore aggiornamento stato", variant: "destructive" }),
  });

  const elimina = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/prenotazioni/${prenotazione.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prenotazioni"] });
      queryClient.invalidateQueries({ queryKey: ["disponibilita"] });
      toast({ title: "Prenotazione eliminata" });
      setDeleteOpen(false);
    },
    onError: () => toast({ title: "Errore eliminazione", variant: "destructive" }),
  });

  if (compact) {
    return (
      <>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors cursor-pointer"
          onClick={() => setEditOpen(true)}
        >
          <div
            className="w-1.5 h-10 rounded-full shrink-0"
            style={{ backgroundColor: prenotazione.sala.colore }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-900 truncate">{prenotazione.cliente.nome}</span>
              <Badge className={STATO_COLORE[prenotazione.stato]} variant="outline">
                {STATO_LABEL[prenotazione.stato]}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {prenotazione.coperti}
              </span>
              <span>{prenotazione.sala.nome}</span>
              {prenotazione.note && <span className="truncate max-w-[120px]">📝 {prenotazione.note}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-semibold text-sm text-indigo-700">{prenotazione.orario}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}>
                  <Edit className="h-4 w-4 mr-2" /> Modifica
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {prenotazione.stato !== "CONFERMATA" && (
                  <DropdownMenuItem onClick={() => cambiaStato.mutate("CONFERMATA")}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Conferma
                  </DropdownMenuItem>
                )}
                {prenotazione.stato !== "CANCELLATA" && (
                  <DropdownMenuItem onClick={() => cambiaStato.mutate("CANCELLATA")}>
                    <XCircle className="h-4 w-4 mr-2 text-red-500" /> Cancella
                  </DropdownMenuItem>
                )}
                {prenotazione.stato !== "NON_PRESENTATO" && (
                  <DropdownMenuItem onClick={() => cambiaStato.mutate("NON_PRESENTATO")}>
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" /> No-show
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Elimina
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica prenotazione</DialogTitle>
            </DialogHeader>
            <FormPrenotazione
              prenotazione={prenotazione}
              onSuccess={() => setEditOpen(false)}
              onCancel={() => setEditOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Elimina prenotazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare la prenotazione di <strong>{prenotazione.cliente.nome}</strong>?
                Il cliente riceverà una notifica di cancellazione.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => elimina.mutate()}>Elimina</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-10 rounded-full shrink-0"
              style={{ backgroundColor: prenotazione.sala.colore }}
            />
            <div>
              <p className="font-semibold text-gray-900">{prenotazione.cliente.nome}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" /> {prenotazione.cliente.telefono}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATO_COLORE[prenotazione.stato]}>
              <IconStato className="h-3 w-3 mr-1" />
              {STATO_LABEL[prenotazione.stato]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Modifica
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {prenotazione.stato !== "CONFERMATA" && (
                  <DropdownMenuItem onClick={() => cambiaStato.mutate("CONFERMATA")}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Conferma
                  </DropdownMenuItem>
                )}
                {prenotazione.stato !== "CANCELLATA" && (
                  <DropdownMenuItem onClick={() => cambiaStato.mutate("CANCELLATA")}>
                    <XCircle className="h-4 w-4 mr-2 text-red-500" /> Cancella
                  </DropdownMenuItem>
                )}
                {prenotazione.stato !== "NON_PRESENTATO" && (
                  <DropdownMenuItem onClick={() => cambiaStato.mutate("NON_PRESENTATO")}>
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" /> No-show
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Elimina
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Orario</p>
            <p className="font-semibold text-gray-900">{prenotazione.orario}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Coperti</p>
            <p className="font-semibold text-gray-900">{prenotazione.coperti}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Sala</p>
            <p className="font-semibold text-gray-900 truncate">{prenotazione.sala.nome}</p>
          </div>
        </div>

        {(prenotazione.note || prenotazione.cliente.note) && (
          <div className="text-xs text-gray-600 bg-amber-50 rounded-lg p-2 border border-amber-100">
            {prenotazione.note && <p>📝 {prenotazione.note}</p>}
            {prenotazione.cliente.note && <p>⚠️ {prenotazione.cliente.note}</p>}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica prenotazione</DialogTitle>
          </DialogHeader>
          <FormPrenotazione
            prenotazione={prenotazione}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina prenotazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la prenotazione di <strong>{prenotazione.cliente.nome}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => elimina.mutate()}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
