import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Sale predefinite
  const sale = await Promise.all([
    prisma.sala.upsert({
      where: { id: "sala-interna" },
      update: {},
      create: {
        id: "sala-interna",
        nome: "Sala Interna",
        tavoli: 10,
        capienzaMax: 40,
        colore: "#6366f1",
        attiva: true,
      },
    }),
    prisma.sala.upsert({
      where: { id: "terrazza" },
      update: {},
      create: {
        id: "terrazza",
        nome: "Terrazza",
        tavoli: 6,
        capienzaMax: 24,
        colore: "#22c55e",
        attiva: true,
      },
    }),
    prisma.sala.upsert({
      where: { id: "sala-privata" },
      update: {},
      create: {
        id: "sala-privata",
        nome: "Sala Privata",
        tavoli: 3,
        capienzaMax: 12,
        colore: "#f59e0b",
        attiva: true,
      },
    }),
  ]);

  console.log(`✅ Create ${sale.length} sale`);

  // Cliente demo
  const cliente = await prisma.cliente.upsert({
    where: { telefono: "+393331234567" },
    update: {},
    create: {
      nome: "Mario Rossi",
      telefono: "+393331234567",
      email: "mario.rossi@esempio.it",
      note: "Allergia alle arachidi. Preferisce tavolo vicino alla finestra.",
    },
  });

  console.log(`✅ Cliente demo: ${cliente.nome}`);

  // Prenotazione demo per oggi
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  await prisma.prenotazione.create({
    data: {
      clienteId: cliente.id,
      salaId: "sala-interna",
      data: oggi,
      orario: "20:00",
      coperti: 4,
      stato: "CONFERMATA",
      note: "Anniversario di matrimonio - preparare un piccolo dessert",
    },
  });

  console.log("✅ Prenotazione demo creata");
  console.log("🎉 Seeding completato!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
