// src/components/nav-bar/bar.tsx
import { Link, useMatch } from "react-router-dom";
import { UserNav } from "./user-nav";
import BackButton from "../navigation/back-button";

type NavbarProps = {
  brand?: React.ReactNode;
};

export function Navbar({ brand }: NavbarProps) {
  const onEventRoute = !!useMatch("/event/:id/*");

  const brandNode = onEventRoute ? (
    <BackButton to="/events" label="Back to all events page" />
  ) : (
    brand ?? (
      <Link to="/" className="text-lg font-semibold tracking-tight">
        MyApp
      </Link>
    )
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-6 sm:px-8">
        {/* Brand / Back */}
        {brandNode}

        {/* Main nav */}
        {/* <NavigationMenu>
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
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu> */}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
