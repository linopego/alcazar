import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const EventoSchema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  orarioInizio: z.string().optional().nullable(),
  orarioFine: z.string().optional().nullable(),
  salaId: z.string().optional().nullable(),
  tipo: z.enum(["CENA_PRIVATA", "SERATA_A_TEMA", "CHIUSURA_STRAORDINARIA", "ALTRO"]),
  note: z.string().optional().nullable(),
  menuFisso: z.boolean().optional().default(false),
  caparra: z.boolean().optional().default(false),
  importoCaparra: z.number().optional().nullable(),
  referente: z.string().optional().nullable(),
  telefonoReferente: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const data = searchParams.get("data");

    const where: Record<string, unknown> = {};
    if (data) {
      where.data = new Date(data);
    } else if (from && to) {
      where.data = { gte: new Date(from), lte: new Date(to) };
    }

    const eventi = await prisma.evento.findMany({
      where,
      include: { sala: true },
      orderBy: [{ data: "asc" }, { orarioInizio: "asc" }],
    });
    return NextResponse.json(eventi);
  } catch (error) {
    console.error("GET /api/eventi:", error);
    return NextResponse.json({ error: "Errore nel recupero degli eventi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = EventoSchema.parse(body);
    const evento = await prisma.evento.create({
      data: { ...parsed, data: new Date(parsed.data) },
      include: { sala: true },
    });
    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/eventi:", error);
    return NextResponse.json({ error: "Errore nella creazione dell'evento" }, { status: 500 });
  }
}
