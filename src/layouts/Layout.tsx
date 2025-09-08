import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebarToggle } from "@/hooks/use-side-bar-toggle";
import { Sidebar } from "@/components/side-bar/side-bar";
import { Navbar } from "@/components/nav-bar/bar";

export default function AppLayout() {
  const { isOpen } = useSidebarToggle();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "relative z-[70] shrink-0 bg-card overflow-visible",
            "transition-[width] duration-300 ease-in-out",
            isOpen ? "w-60" : "w-[90px]"
          )}
        >
          <Sidebar />
        </aside>
        <div className="relative z-0 flex min-w-0 grow flex-col">
          <Navbar brand="Chrono Flow First Customer" />
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
