import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ClienteSchema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  telefono: z.string().min(1, "Il telefono è obbligatorio"),
  email: z.string().email().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const telefono = searchParams.get("telefono");
    const q = searchParams.get("q");

    if (telefono) {
      const cliente = await prisma.cliente.findUnique({
        where: { telefono },
        include: { _count: { select: { prenotazioni: true } } },
      });
      return NextResponse.json(cliente);
    }

    const clienti = await prisma.cliente.findMany({
      where: q
        ? {
            OR: [
              { nome: { contains: q, mode: "insensitive" } },
              { telefono: { contains: q } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: { _count: { select: { prenotazioni: true } } },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(clienti);
  } catch (error) {
    console.error("GET /api/clienti:", error);
    return NextResponse.json({ error: "Errore nel recupero dei clienti" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = ClienteSchema.parse(body);

    const existing = await prisma.cliente.findUnique({ where: { telefono: data.telefono } });
    if (existing) {
      return NextResponse.json({ error: "Cliente con questo numero già esistente", cliente: existing }, { status: 409 });
    }

    const cliente = await prisma.cliente.create({ data });
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/clienti:", error);
    return NextResponse.json({ error: "Errore nella creazione del cliente" }, { status: 500 });
  }
}
