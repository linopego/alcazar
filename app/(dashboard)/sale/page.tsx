"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Users, Table2, Menu, Power } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Sala } from "@/types";
import { useSidebar } from "@/components/layout/sidebar-context";

const COLORI_PRESET = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

const schema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  tavoli: z.number().int().min(1, "Minimo 1 tavolo"),
  capienzaMax: z.number().int().min(1, "Minimo 1 coperto"),
  colore: z.string().min(1),
  attiva: z.boolean(),
});

type FormData = z.infer<typeof schema>;

function FormSala({ sala, onSuccess, onCancel }: {
  sala?: Sala; onSuccess: () => void; onCancel: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: sala?.nome ?? "",
      tavoli: sala?.tavoli ?? 5,
      capienzaMax: sala?.capienzaMax ?? 20,
      colore: sala?.colore ?? "#6366f1",
      attiva: sala?.attiva ?? true,
    },
  });

  const coloreSelezionato = watch("colore");

  const onSubmit = async (data: FormData) => {
    const url = sala ? `/api/sale/${sala.id}` : "/api/sale";
    const method = sala ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast({ title: "Errore nel salvataggio", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["sale"] });
    toast({ title: sala ? "Sala aggiornata" : "Sala creata" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Nome sala *</Label>
        <Input {...register("nome")} placeholder="es. Sala Interna, Terrazza..." className="mt-1" />
        {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Numero tavoli *</Label>
          <Input type="number" min={1} {...register("tavoli", { valueAsNumber: true })} className="mt-1" />
          {errors.tavoli && <p className="text-xs text-red-500 mt-1">{errors.tavoli.message}</p>}
        </div>
        <div>
          <Label>Capienza max (coperti) *</Label>
          <Input type="number" min={1} {...register("capienzaMax", { valueAsNumber: true })} className="mt-1" />
          {errors.capienzaMax && <p className="text-xs text-red-500 mt-1">{errors.capienzaMax.message}</p>}
        </div>
      </div>
      <div>
        <Label>Colore identificativo</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {COLORI_PRESET.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("colore", c)}
              className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: coloreSelezionato === c ? "#1f2937" : "transparent",
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Annulla</Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {sala ? "Aggiorna" : "Crea sala"}
        </Button>
      </div>
    </form>
  );
}

export default function SalePage() {
  const { toggle } = useSidebar();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editSala, setEditSala] = useState<Sala | undefined>();
  const [deleteSala, setDeleteSala] = useState<Sala | undefined>();

  const { data: sale = [], isLoading } = useQuery<Sala[]>({
    queryKey: ["sale"],
    queryFn: () => fetch("/api/sale").then((r) => r.json()),
  });

  const togglAttiva = useMutation({
    mutationFn: async ({ id, attiva }: { id: string; attiva: boolean }) => {
      const res = await fetch(`/api/sale/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attiva }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sale"] }),
    onError: () => toast({ title: "Errore aggiornamento", variant: "destructive" }),
  });

  const elimina = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sale/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale"] });
      toast({ title: "Sala eliminata" });
      setDeleteSala(undefined);
    },
    onError: () => toast({ title: "Errore eliminazione", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <button onClick={toggle} className="lg:hidden rounded-xl p-2 text-gray-500 hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-gray-900">Sale & Aree</h1>
          <div className="ml-auto">
            <Button onClick={() => { setEditSala(undefined); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nuova sala
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : sale.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-gray-500">Nessuna sala configurata</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Aggiungi sala
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sale.map((s) => (
              <div key={s.id} className={`rounded-xl border-2 bg-white p-4 ${s.attiva ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: s.colore }} />
                    <h3 className="font-semibold text-gray-900">{s.nome}</h3>
                  </div>
                  <Badge variant={s.attiva ? "success" : "secondary"}>
                    {s.attiva ? "Attiva" : "Inattiva"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <Table2 className="h-3.5 w-3.5" />
                      <span className="text-xs">Tavoli</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{s.tavoli}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs">Capienza</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{s.capienzaMax}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => togglAttiva.mutate({ id: s.id, attiva: !s.attiva })}
                  >
                    <Power className="h-4 w-4 mr-1" />
                    {s.attiva ? "Disattiva" : "Attiva"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditSala(s); setFormOpen(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => setDeleteSala(s)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editSala ? "Modifica sala" : "Nuova sala"}</DialogTitle>
          </DialogHeader>
          <FormSala
            sala={editSala}
            onSuccess={() => setFormOpen(false)}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSala} onOpenChange={(o) => !o && setDeleteSala(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina sala</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la sala <strong>{deleteSala?.nome}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSala && elimina.mutate(deleteSala.id)}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
