"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Phone, Mail, BookOpen, Pencil, Trash2, Menu, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Cliente } from "@/types";
import { useSidebar } from "@/components/layout/sidebar-context";
import Link from "next/link";

const schema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  telefono: z.string().min(1, "Il telefono è obbligatorio"),
  email: z.string().email().optional().or(z.literal("")),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function FormCliente({ cliente, onSuccess, onCancel }: {
  cliente?: Cliente; onSuccess: () => void; onCancel: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: cliente?.nome ?? "",
      telefono: cliente?.telefono ?? "",
      email: cliente?.email ?? "",
      note: cliente?.note ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    const url = cliente ? `/api/clienti/${cliente.id}` : "/api/clienti";
    const method = cliente ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, email: data.email || null, note: data.note || null }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Errore", description: err.error || "Errore nel salvataggio", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["clienti"] });
    toast({ title: cliente ? "Cliente aggiornato" : "Cliente creato" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nome *</Label>
          <Input {...register("nome")} placeholder="Nome e cognome" className="mt-1" />
          {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <Label>Telefono *</Label>
          <Input {...register("telefono")} type="tel" placeholder="+39..." className="mt-1" />
          {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono.message}</p>}
        </div>
      </div>
      <div>
        <Label>Email</Label>
        <Input {...register("email")} type="email" placeholder="email@esempio.com" className="mt-1" />
      </div>
      <div>
        <Label>Note (allergie, preferenze, occasioni speciali)</Label>
        <Textarea {...register("note")} placeholder="Allergie a noci, vegetariano, anniversario..." className="mt-1" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Annulla</Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {cliente ? "Aggiorna" : "Crea cliente"}
        </Button>
      </div>
    </form>
  );
}

export default function ClientiPage() {
  const { toggle } = useSidebar();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ricerca, setRicerca] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | undefined>();
  const [deleteCliente, setDeleteCliente] = useState<Cliente | undefined>();

  const { data: clienti = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["clienti", ricerca],
    queryFn: () =>
      fetch(`/api/clienti${ricerca ? `?q=${encodeURIComponent(ricerca)}` : ""}`).then((r) => r.json()),
  });

  const elimina = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clienti/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore eliminazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clienti"] });
      toast({ title: "Cliente eliminato" });
      setDeleteCliente(undefined);
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
          <h1 className="font-semibold text-gray-900">Clienti</h1>
          <div className="ml-auto">
            <Button onClick={() => { setEditCliente(undefined); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nuovo cliente</span>
            </Button>
          </div>
        </div>
        <div className="px-4 pb-3 md:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca per nome, telefono o email..."
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : clienti.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-gray-500">Nessun cliente trovato</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Aggiungi cliente
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {clienti.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 md:p-4">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-indigo-700">
                    {c.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{c.nome}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {c.telefono}
                    </span>
                    {c.email && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {c.email}
                      </span>
                    )}
                    {c._count && (
                      <Badge variant="secondary" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" /> {c._count.prenotazioni} pren.
                      </Badge>
                    )}
                  </div>
                  {c.note && (
                    <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded px-2 py-0.5 inline-block">
                      ⚠️ {c.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditCliente(c); setFormOpen(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => setDeleteCliente(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Link href={`/clienti/${c.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCliente ? "Modifica cliente" : "Nuovo cliente"}</DialogTitle>
          </DialogHeader>
          <FormCliente
            cliente={editCliente}
            onSuccess={() => setFormOpen(false)}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCliente} onOpenChange={(o) => !o && setDeleteCliente(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare <strong>{deleteCliente?.nome}</strong>?
              Questa azione eliminerà anche tutte le sue prenotazioni.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteCliente && elimina.mutate(deleteCliente.id)}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
