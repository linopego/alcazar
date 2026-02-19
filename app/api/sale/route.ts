import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SalaSchema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  tavoli: z.number().int().min(1),
  capienzaMax: z.number().int().min(1),
  colore: z.string().optional().default("#6366f1"),
  attiva: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const sale = await prisma.sala.findMany({
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(sale);
  } catch (error) {
    console.error("GET /api/sale:", error);
    return NextResponse.json({ error: "Errore nel recupero delle sale" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = SalaSchema.parse(body);
    const sala = await prisma.sala.create({ data });
    return NextResponse.json(sala, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/sale:", error);
    return NextResponse.json({ error: "Errore nella creazione della sala" }, { status: 500 });
  }
}
