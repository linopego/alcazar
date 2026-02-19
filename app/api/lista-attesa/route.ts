import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ListaAttesaSchema = z.object({
  clienteId: z.string().min(1),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  orarioPreferito: z.string().optional().nullable(),
  coperti: z.number().int().min(1),
  note: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");
    const where = data ? { data: new Date(data), stato: "IN_ATTESA" as const } : { stato: "IN_ATTESA" as const };

    const lista = await prisma.listaAttesa.findMany({
      where,
      include: { cliente: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(lista);
  } catch (error) {
    console.error("GET /api/lista-attesa:", error);
    return NextResponse.json({ error: "Errore nel recupero della lista d'attesa" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = ListaAttesaSchema.parse(body);
    const entry = await prisma.listaAttesa.create({
      data: { ...data, data: new Date(data.data) },
      include: { cliente: true },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/lista-attesa:", error);
    return NextResponse.json({ error: "Errore nell'aggiunta alla lista d'attesa" }, { status: 500 });
  }
}
