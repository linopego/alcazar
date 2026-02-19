import { formatData } from "./date";

interface DatiNotifica {
  nomeCliente: string;
  telefono: string;
  email?: string | null;
  data: Date | string;
  orario: string;
  coperti: number;
  nomeSala: string;
  prenotazioneId: string;
}

function messaggioConferma(dati: DatiNotifica): string {
  return `Gentile ${dati.nomeCliente}, la sua prenotazione è confermata per il ${formatData(dati.data)} alle ${dati.orario} (${dati.coperti} coperti, ${dati.nomeSala}). Grazie e a presto!`;
}

function messaggioPromemoria(dati: DatiNotifica): string {
  return `Gentile ${dati.nomeCliente}, le ricordiamo la prenotazione di domani, ${formatData(dati.data)} alle ${dati.orario} (${dati.coperti} coperti). A presto!`;
}

function messaggioCancellazione(dati: DatiNotifica): string {
  return `Gentile ${dati.nomeCliente}, la sua prenotazione del ${formatData(dati.data)} alle ${dati.orario} è stata cancellata. Per informazioni contatti il ristorante.`;
}

export async function inviaConferma(dati: DatiNotifica): Promise<{ sms: boolean; email: boolean }> {
  const results = { sms: false, email: false };
  const messaggio = messaggioConferma(dati);

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && dati.telefono) {
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: messaggio,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: dati.telefono,
      });
      results.sms = true;
    } catch (err) {
      console.error("Errore invio SMS conferma:", err);
    }
  }

  if (process.env.RESEND_API_KEY && dati.email) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "ristorante@example.com",
        to: dati.email,
        subject: "Conferma prenotazione",
        text: messaggio,
      });
      results.email = true;
    } catch (err) {
      console.error("Errore invio email conferma:", err);
    }
  }

  return results;
}

export async function inviaPromemoria(dati: DatiNotifica): Promise<{ sms: boolean; email: boolean }> {
  const results = { sms: false, email: false };
  const messaggio = messaggioPromemoria(dati);

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && dati.telefono) {
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: messaggio,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: dati.telefono,
      });
      results.sms = true;
    } catch (err) {
      console.error("Errore invio SMS promemoria:", err);
    }
  }

  if (process.env.RESEND_API_KEY && dati.email) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "ristorante@example.com",
        to: dati.email,
        subject: "Promemoria prenotazione",
        text: messaggio,
      });
      results.email = true;
    } catch (err) {
      console.error("Errore invio email promemoria:", err);
    }
  }

  return results;
}

export async function inviaCancellazione(dati: DatiNotifica): Promise<{ sms: boolean; email: boolean }> {
  const results = { sms: false, email: false };
  const messaggio = messaggioCancellazione(dati);

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && dati.telefono) {
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: messaggio,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: dati.telefono,
      });
      results.sms = true;
    } catch (err) {
      console.error("Errore invio SMS cancellazione:", err);
    }
  }

  if (process.env.RESEND_API_KEY && dati.email) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "ristorante@example.com",
        to: dati.email,
        subject: "Cancellazione prenotazione",
        text: messaggio,
      });
      results.email = true;
    } catch (err) {
      console.error("Errore invio email cancellazione:", err);
    }
  }

  return results;
}
