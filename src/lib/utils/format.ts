import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(parseISO(isoString), "dd/MM/yyyy HH:mm 'UTC'", { locale: es });
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(parseISO(isoString), "dd/MM/yyyy", { locale: es });
  } catch {
    return isoString;
  }
}

export function formatDuration(hhmm: string | null | undefined): string {
  if (!hhmm || hhmm.length < 4) return "—";
  const hours = parseInt(hhmm.substring(0, 2), 10);
  const minutes = parseInt(hhmm.substring(2, 4), 10);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatRoute(departure: string, destination: string): string {
  return `${departure} → ${destination}`;
}
