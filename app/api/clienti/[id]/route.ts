import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ClienteUpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  telefono: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        prenotazioni: {
          include: { sala: true },
          orderBy: { data: "desc" },
        },
        _count: { select: { prenotazioni: true } },
      },
    });
    if (!cliente) return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
    return NextResponse.json(cliente);
  } catch (error) {
    console.error("GET /api/clienti/[id]:", error);
    return NextResponse.json({ error: "Errore nel recupero del cliente" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = ClienteUpdateSchema.parse(body);
    const cliente = await prisma.cliente.update({ where: { id }, data });
    return NextResponse.json(cliente);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH /api/clienti/[id]:", error);
    return NextResponse.json({ error: "Errore nell'aggiornamento del cliente" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.cliente.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/clienti/[id]:", error);
    return NextResponse.json({ error: "Errore nell'eliminazione del cliente" }, { status: 500 });
  }
}
