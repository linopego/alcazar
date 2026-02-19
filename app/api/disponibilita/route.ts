import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");
    const orario = searchParams.get("orario");

    if (!data) {
      return NextResponse.json({ error: "Parametro 'data' obbligatorio" }, { status: 400 });
    }

    const dataDate = new Date(data);

    const [sale, prenotazioni, eventi] = await Promise.all([
      prisma.sala.findMany({ where: { attiva: true }, orderBy: { nome: "asc" } }),
      prisma.prenotazione.findMany({
        where: {
          data: dataDate,
          stato: { in: ["CONFERMATA", "IN_ATTESA"] },
          ...(orario ? { orario } : {}),
        },
      }),
      prisma.evento.findMany({
        where: { data: dataDate },
      }),
    ]);

    const disponibilita = sale.map((sala: typeof sale[number]) => {
      // Verifica blocco sala
      const eventoBloccante = eventi.find(
        (e: typeof eventi[number]) =>
          (e.salaId === null || e.salaId === sala.id) &&
          e.tipo === "CHIUSURA_STRAORDINARIA"
      );

      const prenotazioniSala = prenotazioni.filter((p: typeof prenotazioni[number]) => p.salaId === sala.id);
      const coperttiOccupati = prenotazioniSala.reduce((sum: number, p: typeof prenotazioni[number]) => sum + p.coperti, 0);

      return {
        salaId: sala.id,
        nomeSala: sala.nome,
        colore: sala.colore,
        capienzaMax: sala.capienzaMax,
        tavoli: sala.tavoli,
        coperttiOccupati,
        coperttiDisponibili: Math.max(0, sala.capienzaMax - coperttiOccupati),
        bloccata: !!eventoBloccante,
        motivoBlockco: eventoBloccante?.nome,
      };
    });

    return NextResponse.json(disponibilita);
  } catch (error) {
    console.error("GET /api/disponibilita:", error);
    return NextResponse.json({ error: "Errore nel calcolo della disponibilità" }, { status: 500 });
  }
}
