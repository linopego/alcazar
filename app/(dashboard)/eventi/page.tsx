"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Menu, Star, Lock, ChefHat, Banknote } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Evento, Sala } from "@/types";
import { TIPO_EVENTO_LABEL } from "@/types";
import { formatData } from "@/lib/date";
import { useSidebar } from "@/components/layout/sidebar-context";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { it } from "date-fns/locale";

const schema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  data: z.string().min(1, "La data è obbligatoria"),
  orarioInizio: z.string().optional().nullable(),
  orarioFine: z.string().optional().nullable(),
  salaId: z.string().optional().nullable(),
  tipo: z.enum(["CENA_PRIVATA", "SERATA_A_TEMA", "CHIUSURA_STRAORDINARIA", "ALTRO"]),
  note: z.string().optional().nullable(),
  menuFisso: z.boolean(),
  caparra: z.boolean(),
  importoCaparra: z.number().optional().nullable(),
  referente: z.string().optional().nullable(),
  telefonoReferente: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

function FormEvento({ evento, onSuccess, onCancel }: {
  evento?: Evento; onSuccess: () => void; onCancel: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: sale = [] } = useQuery<Sala[]>({
    queryKey: ["sale"],
    queryFn: () => fetch("/api/sale").then((r) => r.json()),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: evento?.nome ?? "",
      data: evento?.data?.split("T")[0] ?? "",
      orarioInizio: evento?.orarioInizio ?? "",
      orarioFine: evento?.orarioFine ?? "",
      salaId: evento?.salaId ?? null,
      tipo: evento?.tipo ?? "ALTRO",
      note: evento?.note ?? "",
      menuFisso: evento?.menuFisso ?? false,
      caparra: evento?.caparra ?? false,
      importoCaparra: evento?.importoCaparra ?? null,
      referente: evento?.referente ?? "",
      telefonoReferente: evento?.telefonoReferente ?? "",
    },
  });

  const caparra = watch("caparra");

  const onSubmit = async (data: FormData) => {
    const url = evento ? `/api/eventi/${evento.id}` : "/api/eventi";
    const method = evento ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        salaId: data.salaId || null,
        orarioInizio: data.orarioInizio || null,
        orarioFine: data.orarioFine || null,
        importoCaparra: data.caparra ? data.importoCaparra : null,
      }),
    });
    if (!res.ok) {
      toast({ title: "Errore nel salvataggio", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["eventi"] });
    toast({ title: evento ? "Evento aggiornato" : "Evento creato" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nome evento *</Label>
          <Input {...register("nome")} placeholder="es. Cena di Natale, Serata Jazz..." className="mt-1" />
          {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <Label>Data *</Label>
          <Input type="date" {...register("data")} className="mt-1" />
          {errors.data && <p className="text-xs text-red-500 mt-1">{errors.data.message}</p>}
        </div>
        <div>
          <Label>Tipo</Label>
          <Select onValueChange={(v) => setValue("tipo", v as FormData["tipo"])} defaultValue={watch("tipo")}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_EVENTO_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Orario inizio</Label>
          <Input type="time" {...register("orarioInizio")} className="mt-1" />
        </div>
        <div>
          <Label>Orario fine</Label>
          <Input type="time" {...register("orarioFine")} className="mt-1" />
        </div>
        <div>
          <Label>Sala (opzionale)</Label>
          <Select onValueChange={(v) => setValue("salaId", v === "TUTTE" ? null : v)} defaultValue={watch("salaId") ?? "TUTTE"}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TUTTE">Tutto il ristorante</SelectItem>
              {sale.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("menuFisso")} className="rounded" />
          <span className="text-sm">Menu fisso</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("caparra")} className="rounded" />
          <span className="text-sm">Caparra richiesta</span>
        </label>
      </div>

      {caparra && (
        <div>
          <Label>Importo caparra (€)</Label>
          <Input type="number" min={0} step={0.01} {...register("importoCaparra", { valueAsNumber: true })} className="mt-1" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Referente</Label>
          <Input {...register("referente")} placeholder="Nome referente" className="mt-1" />
        </div>
        <div>
          <Label>Telefono referente</Label>
          <Input {...register("telefonoReferente")} type="tel" placeholder="+39..." className="mt-1" />
        </div>
      </div>

      <div>
        <Label>Note</Label>
        <Textarea {...register("note")} placeholder="Note aggiuntive..." className="mt-1" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Annulla</Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {evento ? "Aggiorna" : "Crea evento"}
        </Button>
      </div>
    </form>
  );
}

const TIPO_ICONA: Record<string, React.ElementType> = {
  CHIUSURA_STRAORDINARIA: Lock,
  CENA_PRIVATA: ChefHat,
  SERATA_A_TEMA: Star,
  ALTRO: Star,
};

const TIPO_COLORE: Record<string, string> = {
  CHIUSURA_STRAORDINARIA: "bg-red-100 text-red-800",
  CENA_PRIVATA: "bg-purple-100 text-purple-800",
  SERATA_A_TEMA: "bg-indigo-100 text-indigo-800",
  ALTRO: "bg-gray-100 text-gray-800",
};

export default function EventiPage() {
  const { toggle } = useSidebar();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [meseCorrente, setMeseCorrente] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editEvento, setEditEvento] = useState<Evento | undefined>();
  const [deleteEvento, setDeleteEvento] = useState<Evento | undefined>();

  const from = format(startOfMonth(meseCorrente), "yyyy-MM-dd");
  const to = format(endOfMonth(meseCorrente), "yyyy-MM-dd");

  const { data: eventi = [], isLoading } = useQuery<Evento[]>({
    queryKey: ["eventi", from, to],
    queryFn: () => fetch(`/api/eventi?from=${from}&to=${to}`).then((r) => r.json()),
  });

  const elimina = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/eventi/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventi"] });
      toast({ title: "Evento eliminato" });
      setDeleteEvento(undefined);
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
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMeseCorrente(subMonths(meseCorrente, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-gray-900 min-w-[140px] text-center capitalize">
              {format(meseCorrente, "MMMM yyyy", { locale: it })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMeseCorrente(addMonths(meseCorrente, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="ml-auto">
            <Button onClick={() => { setEditEvento(undefined); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nuovo evento
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : eventi.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-gray-500">Nessun evento in questo mese</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Aggiungi evento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {eventi.map((e) => {
              const Icona = TIPO_ICONA[e.tipo] ?? Star;
              return (
                <div key={e.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Icona className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{e.nome}</h3>
                          <Badge className={TIPO_COLORE[e.tipo]}>{TIPO_EVENTO_LABEL[e.tipo]}</Badge>
                          {e.sala && <Badge variant="outline">{e.sala.nome}</Badge>}
                          {!e.salaId && <Badge variant="destructive">Tutto il ristorante</Badge>}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {formatData(e.data)}
                          {e.orarioInizio && ` · ${e.orarioInizio}`}
                          {e.orarioFine && ` - ${e.orarioFine}`}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {e.menuFisso && (
                            <span className="flex items-center gap-1 text-xs text-gray-600">
                              <ChefHat className="h-3 w-3" /> Menu fisso
                            </span>
                          )}
                          {e.caparra && (
                            <span className="flex items-center gap-1 text-xs text-gray-600">
                              <Banknote className="h-3 w-3" /> Caparra{e.importoCaparra ? ` €${e.importoCaparra}` : ""}
                            </span>
                          )}
                          {e.referente && (
                            <span className="text-xs text-gray-500">Ref: {e.referente}</span>
                          )}
                        </div>
                        {e.note && (
                          <p className="text-xs text-gray-500 mt-1 italic">{e.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditEvento(e); setFormOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setDeleteEvento(e)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editEvento ? "Modifica evento" : "Nuovo evento"}</DialogTitle>
          </DialogHeader>
          <FormEvento
            evento={editEvento}
            onSuccess={() => setFormOpen(false)}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEvento} onOpenChange={(o) => !o && setDeleteEvento(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina evento</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare <strong>{deleteEvento?.nome}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEvento && elimina.mutate(deleteEvento.id)}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
