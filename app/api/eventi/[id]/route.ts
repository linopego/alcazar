import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const EventoUpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  orarioInizio: z.string().optional().nullable(),
  orarioFine: z.string().optional().nullable(),
  salaId: z.string().optional().nullable(),
  tipo: z.enum(["CENA_PRIVATA", "SERATA_A_TEMA", "CHIUSURA_STRAORDINARIA", "ALTRO"]).optional(),
  note: z.string().optional().nullable(),
  menuFisso: z.boolean().optional(),
  caparra: z.boolean().optional(),
  importoCaparra: z.number().optional().nullable(),
  referente: z.string().optional().nullable(),
  telefonoReferente: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const evento = await prisma.evento.findUnique({ where: { id }, include: { sala: true } });
    if (!evento) return NextResponse.json({ error: "Evento non trovato" }, { status: 404 });
    return NextResponse.json(evento);
  } catch (error) {
    console.error("GET /api/eventi/[id]:", error);
    return NextResponse.json({ error: "Errore nel recupero dell'evento" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updates = EventoUpdateSchema.parse(body);
    const updateData: Record<string, unknown> = { ...updates };
    if (updates.data) updateData.data = new Date(updates.data);
    const evento = await prisma.evento.update({ where: { id }, data: updateData, include: { sala: true } });
    return NextResponse.json(evento);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH /api/eventi/[id]:", error);
    return NextResponse.json({ error: "Errore nell'aggiornamento dell'evento" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.evento.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/eventi/[id]:", error);
    return NextResponse.json({ error: "Errore nell'eliminazione dell'evento" }, { status: 500 });
  }
}
