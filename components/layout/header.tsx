"use client";

import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { formatData, labelGiorno } from "@/lib/date";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
  date?: Date;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  showDateNav?: boolean;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Vista Giornaliera",
  "/prenotazioni": "Prenotazioni",
  "/calendario": "Calendario",
  "/clienti": "Clienti",
  "/sale": "Sale & Aree",
  "/eventi": "Eventi Speciali",
};

export function Header({ onMenuClick, date, onPrevDay, onNextDay, showDateNav }: HeaderProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k)) || ""] || "Alcazar";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 md:px-6">
      {/* Menu burger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-xl p-2 text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Apri menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Title + date nav */}
      <div className="flex flex-1 items-center gap-3">
        <h1 className="text-base md:text-lg font-semibold text-gray-900">{title}</h1>

        {showDateNav && date && (
          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="icon" onClick={onPrevDay} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 min-w-[160px] text-center">
              {labelGiorno(date)} — {formatData(date)}
            </span>
            <Button variant="ghost" size="icon" onClick={onNextDay} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Today button */}
      {showDateNav && (
        <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent("go-to-today"))}>
          Oggi
        </Button>
      )}
    </header>
  );
}
