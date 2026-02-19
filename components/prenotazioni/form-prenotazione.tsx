"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { UserCheck, UserPlus, Phone, Loader2 } from "lucide-react";
import { TUTTI_ORARI } from "@/lib/date";
import type { Prenotazione, Sala, Cliente } from "@/types";

const schema = z.object({
  telefono: z.string().min(1, "Inserisci il numero di telefono"),
  nome: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  noteCliente: z.string().optional(),
  salaId: z.string().min(1, "Seleziona una sala"),
  data: z.string().min(1, "Seleziona la data"),
  orario: z.string().min(1, "Seleziona l'orario"),
  coperti: z.number().min(1, "Minimo 1 coperti").max(50),
  stato: z.enum(["CONFERMATA", "IN_ATTESA", "CANCELLATA", "NON_PRESENTATO"]),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  prenotazione?: Prenotazione;
  defaultData?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormPrenotazione({ prenotazione, defaultData, onSuccess, onCancel }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clienteTrovato, setClienteTrovato] = useState<Cliente | null>(
    prenotazione?.cliente ?? null
  );
  const [cercandoCliente, setCercandoCliente] = useState(false);

  const { data: sale = [] } = useQuery<Sala[]>({
    queryKey: ["sale"],
    queryFn: () => fetch("/api/sale").then((r) => r.json()),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      telefono: prenotazione?.cliente.telefono ?? "",
      nome: prenotazione?.cliente.nome ?? "",
      email: prenotazione?.cliente.email ?? "",
      noteCliente: prenotazione?.cliente.note ?? "",
      salaId: prenotazione?.salaId ?? sale[0]?.id ?? "",
      data: prenotazione?.data?.split("T")[0] ?? defaultData ?? "",
      orario: prenotazione?.orario ?? "20:00",
      coperti: prenotazione?.coperti ?? 2,
      stato: prenotazione?.stato ?? "IN_ATTESA",
      note: prenotazione?.note ?? "",
    },
  });

  const telefono = watch("telefono");

  const cercaCliente = async () => {
    if (!telefono || telefono.length < 6) return;
    setCercandoCliente(true);
    try {
      const res = await fetch(`/api/clienti?telefono=${encodeURIComponent(telefono)}`);
      const data = await res.json();
      if (data?.id) {
        setClienteTrovato(data);
        setValue("nome", data.nome);
        setValue("email", data.email ?? "");
        setValue("noteCliente", data.note ?? "");
        toast({ title: "Cliente trovato", description: `Bentornato, ${data.nome}!`, variant: "default" });
      } else {
        setClienteTrovato(null);
      }
    } catch {
      setClienteTrovato(null);
    } finally {
      setCercandoCliente(false);
    }
  };

  const mutazione = useMutation({
    mutationFn: async (dati: FormData) => {
      let clienteId = clienteTrovato?.id;

      // Crea o aggiorna cliente
      if (!clienteId) {
        const resCliente = await fetch("/api/clienti", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: dati.nome,
            telefono: dati.telefono,
            email: dati.email || null,
            note: dati.noteCliente || null,
          }),
        });
        if (resCliente.status === 409) {
          const body = await resCliente.json();
          clienteId = body.cliente.id;
        } else if (resCliente.ok) {
          const c = await resCliente.json();
          clienteId = c.id;
        } else {
          throw new Error("Errore nella creazione del cliente");
        }
      } else {
        // Aggiorna note cliente se cambiate
        await fetch(`/api/clienti/${clienteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: dati.noteCliente || null }),
        });
      }

      const url = prenotazione ? `/api/prenotazioni/${prenotazione.id}` : "/api/prenotazioni";
      const method = prenotazione ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          salaId: dati.salaId,
          data: dati.data,
          orario: dati.orario,
          coperti: dati.coperti,
          stato: dati.stato,
          note: dati.note || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore nel salvataggio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prenotazioni"] });
      queryClient.invalidateQueries({ queryKey: ["disponibilita"] });
      toast({
        title: prenotazione ? "Prenotazione aggiornata" : "Prenotazione creata",
        variant: "success" as never,
      });
      onSuccess();
    },
    onError: (err: Error) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutazione.mutate(d))} className="space-y-4">
      {/* Ricerca cliente */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Cerca cliente</span>
          {clienteTrovato && (
            <Badge variant="success">
              <UserCheck className="h-3 w-3 mr-1" /> Cliente trovato
            </Badge>
          )}
          {!clienteTrovato && telefono.length > 5 && (
            <Badge variant="warning">
              <UserPlus className="h-3 w-3 mr-1" /> Nuovo cliente
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              {...register("telefono")}
              placeholder="Numero di telefono"
              type="tel"
              onBlur={cercaCliente}
            />
            {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono.message}</p>}
          </div>
          <Button type="button" variant="outline" size="default" onClick={cercaCliente} disabled={cercandoCliente}>
            {cercandoCliente ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cerca"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register("nome")} placeholder="Nome e cognome" className="mt-1" />
            {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register("email")} type="email" placeholder="Email" className="mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="noteCliente">Note cliente (allergie, preferenze)</Label>
          <Textarea
            id="noteCliente"
            {...register("noteCliente")}
            placeholder="Allergie, occasioni speciali, preferenze..."
            className="mt-1 min-h-[60px]"
          />
        </div>
      </div>

      {/* Dettagli prenotazione */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="data">Data *</Label>
          <Input id="data" {...register("data")} type="date" className="mt-1" />
          {errors.data && <p className="text-xs text-red-500 mt-1">{errors.data.message}</p>}
        </div>
        <div>
          <Label>Orario *</Label>
          <Select onValueChange={(v) => setValue("orario", v)} defaultValue={watch("orario")}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Seleziona orario" />
            </SelectTrigger>
            <SelectContent>
              {TUTTI_ORARI.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.orario && <p className="text-xs text-red-500 mt-1">{errors.orario.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Sala *</Label>
          <Select onValueChange={(v) => setValue("salaId", v)} defaultValue={watch("salaId")}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Seleziona sala" />
            </SelectTrigger>
            <SelectContent>
              {sale.filter(s => s.attiva).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.salaId && <p className="text-xs text-red-500 mt-1">{errors.salaId.message}</p>}
        </div>
        <div>
          <Label htmlFor="coperti">Coperti *</Label>
          <Input
            id="coperti"
            type="number"
            min={1}
            max={50}
            {...register("coperti", { valueAsNumber: true })}
            className="mt-1"
          />
          {errors.coperti && <p className="text-xs text-red-500 mt-1">{errors.coperti.message}</p>}
        </div>
      </div>

      <div>
        <Label>Stato</Label>
        <Select onValueChange={(v) => setValue("stato", v as FormData["stato"])} defaultValue={watch("stato")}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN_ATTESA">In attesa</SelectItem>
            <SelectItem value="CONFERMATA">Confermata</SelectItem>
            <SelectItem value="CANCELLATA">Cancellata</SelectItem>
            <SelectItem value="NON_PRESENTATO">Non presentato</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="note">Note interne</Label>
        <Textarea
          id="note"
          {...register("note")}
          placeholder="Note per lo staff..."
          className="mt-1"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Annulla
        </Button>
        <Button type="submit" disabled={isSubmitting || mutazione.isPending} className="flex-1">
          {(isSubmitting || mutazione.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {prenotazione ? "Aggiorna" : "Crea prenotazione"}
        </Button>
      </div>
    </form>
  );
}
