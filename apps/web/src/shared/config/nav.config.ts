export interface NavItem {
  href:  string;
  label: string;
  icon:  string;
}

export interface NavGroup {
  label?: string;
  items:  NavItem[];
}

export const NAV_CONFIG: Record<string, NavGroup[]> = {
  SUPER_ADMIN: [
    {
      label: "Overview",
      items: [
        { href: "/super-admin",          label: "Dashboard",     icon: "LayoutDashboard" },
        { href: "/super-admin/activity", label: "Activity Logs", icon: "Activity"        },
        { href: "/super-admin/audit",    label: "Audit Log",     icon: "ScrollText"      },
      ],
    },
    {
      label: "Platform",
      items: [
        { href: "/super-admin/admins",       label: "Admin Accounts", icon: "Shield"       },
        { href: "/super-admin/flags",        label: "Feature Flags",  icon: "ToggleLeft"   },
        { href: "/super-admin/integrations", label: "Integrations",   icon: "Plug"         },
      ],
    },
    {
      label: "Configuration",
      items: [
        { href: "/super-admin/system", label: "Settings", icon: "Settings" },
      ],
    },
  ],
  ADMIN: [
    {
      items: [
        { href: "/admin", label: "Overview", icon: "LayoutDashboard" },
      ],
    },
    {
      label: "Catalog",
      items: [
        { href: "/admin/music", label: "Music", icon: "Music"      },
        { href: "/admin/merch", label: "Merch", icon: "ShoppingBag" },
      ],
    },
    {
      label: "Content",
      items: [
        { href: "/admin/events",   label: "Events",   icon: "CalendarDays" },
        { href: "/admin/gallery",  label: "Gallery",  icon: "Images"       },
        { href: "/admin/bookings", label: "Bookings", icon: "Mail"         },
        { href: "/admin/content",  label: "Content",  icon: "FileText"     },
      ],
    },
    {
      label: "Team",
      items: [
        { href: "/admin/customers", label: "Customers", icon: "Users"      },
        { href: "/admin/managers",  label: "Managers",  icon: "UsersRound" },
        { href: "/admin/activity",  label: "Activity",  icon: "Activity"   },
      ],
    },
  ],
  MANAGER: [
    {
      items: [
        { href: "/manager",        label: "Overview", icon: "LayoutDashboard" },
        { href: "/manager/orders", label: "Orders",   icon: "Receipt"         },
      ],
    },
  ],
};
