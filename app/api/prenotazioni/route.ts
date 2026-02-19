import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { inviaConferma } from "@/lib/notifiche";

const PrenotazioneSchema = z.object({
  clienteId: z.string().min(1),
  salaId: z.string().min(1),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  orario: z.string().min(1),
  coperti: z.number().int().min(1),
  stato: z.enum(["CONFERMATA", "IN_ATTESA", "CANCELLATA", "NON_PRESENTATO"]).optional().default("IN_ATTESA"),
  note: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");
    const clienteId = searchParams.get("clienteId");
    const salaId = searchParams.get("salaId");
    const stato = searchParams.get("stato");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (data) {
      where.data = new Date(data);
    } else if (from && to) {
      where.data = { gte: new Date(from), lte: new Date(to) };
    }
    if (clienteId) where.clienteId = clienteId;
    if (salaId) where.salaId = salaId;
    if (stato) where.stato = stato;

    const prenotazioni = await prisma.prenotazione.findMany({
      where,
      include: { cliente: true, sala: true },
      orderBy: [{ data: "asc" }, { orario: "asc" }],
    });
    return NextResponse.json(prenotazioni);
  } catch (error) {
    console.error("GET /api/prenotazioni:", error);
    return NextResponse.json({ error: "Errore nel recupero delle prenotazioni" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = PrenotazioneSchema.parse(body);

    // Verifica blocco sala per eventi
    const eventoBloccante = await prisma.evento.findFirst({
      where: {
        data: new Date(data.data),
        OR: [{ salaId: null }, { salaId: data.salaId }],
        tipo: "CHIUSURA_STRAORDINARIA",
      },
    });
    if (eventoBloccante) {
      return NextResponse.json(
        { error: `Impossibile prenotare: la sala è bloccata per "${eventoBloccante.nome}"` },
        { status: 409 }
      );
    }

    const prenotazione = await prisma.prenotazione.create({
      data: {
        ...data,
        data: new Date(data.data),
      },
      include: { cliente: true, sala: true },
    });

    // Notifica conferma asincrona
    if (data.stato === "CONFERMATA") {
      inviaConferma({
        nomeCliente: prenotazione.cliente.nome,
        telefono: prenotazione.cliente.telefono,
        email: prenotazione.cliente.email,
        data: prenotazione.data,
        orario: prenotazione.orario,
        coperti: prenotazione.coperti,
        nomeSala: prenotazione.sala.nome,
        prenotazioneId: prenotazione.id,
      }).catch(console.error);
    }

    return NextResponse.json(prenotazione, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/prenotazioni:", error);
    return NextResponse.json({ error: "Errore nella creazione della prenotazione" }, { status: 500 });
  }
}
