export interface PublicNavItem {
  href:  string;
  label: string;
  icon:  string;
}

export const PUBLIC_NAV: PublicNavItem[] = [
  { href: "/",         label: "Sanctum", icon: "Sparkles"    },
  { href: "/music",    label: "Music",   icon: "Music"       },
  { href: "/harinam",  label: "Harinam", icon: "Flame"       },
  { href: "/merch",    label: "Merch",   icon: "ShoppingBag" },
  { href: "/gallery",  label: "Gallery", icon: "Images"      },
  { href: "/events",   label: "Events",  icon: "CalendarDays"},
  { href: "/about",    label: "About",   icon: "Info"        },
  { href: "/contact",  label: "Contact", icon: "Mail"        },
];

export const ACCOUNT_NAV_ITEM: PublicNavItem = {
  href: "/account", label: "Account", icon: "UserCircle",
};
