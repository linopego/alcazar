import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isYesterday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  subDays,
} from "date-fns";
import { it } from "date-fns/locale";

export { it as localeIt };

export function formatData(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMMM yyyy", { locale: it });
}

export function formatDataBreve(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM", { locale: it });
}

export function formatDataISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatGiornoSettimana(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE", { locale: it });
}

export function formatGiornoSettimanaBreve(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEE", { locale: it });
}

export function labelGiorno(date: Date): string {
  if (isToday(date)) return "Oggi";
  if (isTomorrow(date)) return "Domani";
  if (isYesterday(date)) return "Ieri";
  return formatData(date);
}

export function giorniSettimana(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function giorniMese(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

export function parseData(dateStr: string): Date {
  return parseISO(dateStr);
}

export { addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO, isToday };

export const ORARI_PRANZO = [
  "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00",
];

export const ORARI_CENA = [
  "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30",
];

export const TUTTI_ORARI = [...ORARI_PRANZO, ...ORARI_CENA];
