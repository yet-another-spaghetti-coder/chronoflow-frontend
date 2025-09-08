import { ChevronLeft, ChevronRight } from "lucide-react";

export function SidebarToggle({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      className="grid h-10 w-10 place-items-center rounded-xl border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
    >
      {isOpen ? (
        <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
      ) : (
        <ChevronRight className="h-4 w-4 transition-transform duration-300" />
      )}
    </button>
  );
}
