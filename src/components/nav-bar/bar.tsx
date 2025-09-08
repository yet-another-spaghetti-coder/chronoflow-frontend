import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { UserNav } from "./user-nav";

type NavbarProps = {
  brand?: React.ReactNode;
};

export function Navbar({ brand }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Brand */}
        {brand ?? (
          <Link to="/" className="text-lg font-semibold tracking-tight">
            MyApp
          </Link>
        )}

        {/* Main nav */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  to="/"
                  className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Dashboard
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>More</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[200px] gap-2 p-3">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/members"
                        className="block rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        Members
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  {/* add more links here */}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
