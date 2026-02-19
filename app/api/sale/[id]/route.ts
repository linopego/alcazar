import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SalaUpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  tavoli: z.number().int().min(1).optional(),
  capienzaMax: z.number().int().min(1).optional(),
  colore: z.string().optional(),
  attiva: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sala = await prisma.sala.findUnique({ where: { id } });
    if (!sala) return NextResponse.json({ error: "Sala non trovata" }, { status: 404 });
    return NextResponse.json(sala);
  } catch (error) {
    console.error("GET /api/sale/[id]:", error);
    return NextResponse.json({ error: "Errore nel recupero della sala" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = SalaUpdateSchema.parse(body);
    const sala = await prisma.sala.update({ where: { id }, data });
    return NextResponse.json(sala);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH /api/sale/[id]:", error);
    return NextResponse.json({ error: "Errore nell'aggiornamento della sala" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.sala.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/sale/[id]:", error);
    return NextResponse.json({ error: "Errore nell'eliminazione della sala" }, { status: 500 });
  }
}
