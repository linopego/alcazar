import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { inviaConferma, inviaCancellazione } from "@/lib/notifiche";

const PrenotazioneUpdateSchema = z.object({
  clienteId: z.string().optional(),
  salaId: z.string().optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  orario: z.string().optional(),
  coperti: z.number().int().min(1).optional(),
  stato: z.enum(["CONFERMATA", "IN_ATTESA", "CANCELLATA", "NON_PRESENTATO"]).optional(),
  note: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const prenotazione = await prisma.prenotazione.findUnique({
      where: { id },
      include: { cliente: true, sala: true, notifiche: true },
    });
    if (!prenotazione) return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });
    return NextResponse.json(prenotazione);
  } catch (error) {
    console.error("GET /api/prenotazioni/[id]:", error);
    return NextResponse.json({ error: "Errore nel recupero della prenotazione" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updates = PrenotazioneUpdateSchema.parse(body);

    const old = await prisma.prenotazione.findUnique({
      where: { id },
      include: { cliente: true, sala: true },
    });
    if (!old) return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });

    const updateData: Record<string, unknown> = { ...updates };
    if (updates.data) updateData.data = new Date(updates.data);

    const prenotazione = await prisma.prenotazione.update({
      where: { id },
      data: updateData,
      include: { cliente: true, sala: true },
    });

    // Invio notifiche per cambio stato
    if (updates.stato && updates.stato !== old.stato) {
      const datiNotifica = {
        nomeCliente: prenotazione.cliente.nome,
        telefono: prenotazione.cliente.telefono,
        email: prenotazione.cliente.email,
        data: prenotazione.data,
        orario: prenotazione.orario,
        coperti: prenotazione.coperti,
        nomeSala: prenotazione.sala.nome,
        prenotazioneId: prenotazione.id,
      };
      if (updates.stato === "CONFERMATA") {
        inviaConferma(datiNotifica).catch(console.error);
      } else if (updates.stato === "CANCELLATA") {
        inviaCancellazione(datiNotifica).catch(console.error);
      }
    }

    return NextResponse.json(prenotazione);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH /api/prenotazioni/[id]:", error);
    return NextResponse.json({ error: "Errore nell'aggiornamento della prenotazione" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const prenotazione = await prisma.prenotazione.findUnique({
      where: { id },
      include: { cliente: true, sala: true },
    });
    if (!prenotazione) return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });

    // Notifica cancellazione
    inviaCancellazione({
      nomeCliente: prenotazione.cliente.nome,
      telefono: prenotazione.cliente.telefono,
      email: prenotazione.cliente.email,
      data: prenotazione.data,
      orario: prenotazione.orario,
      coperti: prenotazione.coperti,
      nomeSala: prenotazione.sala.nome,
      prenotazioneId: prenotazione.id,
    }).catch(console.error);

    await prisma.prenotazione.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/prenotazioni/[id]:", error);
    return NextResponse.json({ error: "Errore nell'eliminazione della prenotazione" }, { status: 500 });
  }
}
