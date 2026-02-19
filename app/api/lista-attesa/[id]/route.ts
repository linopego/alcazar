import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  stato: z.enum(["IN_ATTESA", "PROMOSSO", "CANCELLATO"]).optional(),
  note: z.string().optional().nullable(),
  orarioPreferito: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = UpdateSchema.parse(body);
    const entry = await prisma.listaAttesa.update({
      where: { id },
      data,
      include: { cliente: true },
    });
    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH /api/lista-attesa/[id]:", error);
    return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.listaAttesa.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/lista-attesa/[id]:", error);
    return NextResponse.json({ error: "Errore nell'eliminazione" }, { status: 500 });
  }
}
