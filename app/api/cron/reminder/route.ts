import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inviaPromemoria } from "@/lib/notifiche";
import { addDays, formatDataISO } from "@/lib/date";

// Cron: da chiamare ogni giorno (es. Vercel Cron alle 10:00)
// curl -X POST /api/cron/reminder -H "x-cron-secret: <secret>"
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const domani = addDays(new Date(), 1);
    const dataDomani = formatDataISO(domani);

    const prenotazioni = await prisma.prenotazione.findMany({
      where: {
        data: new Date(dataDomani),
        stato: "CONFERMATA",
      },
      include: { cliente: true, sala: true },
    });

    let inviati = 0;
    let falliti = 0;

    for (const p of prenotazioni) {
      try {
        await inviaPromemoria({
          nomeCliente: p.cliente.nome,
          telefono: p.cliente.telefono,
          email: p.cliente.email,
          data: p.data,
          orario: p.orario,
          coperti: p.coperti,
          nomeSala: p.sala.nome,
          prenotazioneId: p.id,
        });

        await prisma.notifica.create({
          data: {
            prenotazioneId: p.id,
            tipo: "PROMEMORIA",
            canale: p.cliente.telefono ? "SMS" : "EMAIL",
            stato: "INVIATA",
            inviattoAt: new Date(),
          },
        });
        inviati++;
      } catch {
        await prisma.notifica.create({
          data: {
            prenotazioneId: p.id,
            tipo: "PROMEMORIA",
            canale: "SMS",
            stato: "FALLITA",
          },
        });
        falliti++;
      }
    }

    return NextResponse.json({
      success: true,
      totale: prenotazioni.length,
      inviati,
      falliti,
    });
  } catch (error) {
    console.error("CRON /api/cron/reminder:", error);
    return NextResponse.json({ error: "Errore nel cron job reminder" }, { status: 500 });
  }
}
