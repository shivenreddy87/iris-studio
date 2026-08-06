import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Bell,
  Bookmark,
  Building2,
  ClipboardList,
  FileText,
  Home,
  LayoutTemplate,
  ListChecks,
  PlayCircle,
  Settings,
  ShieldAlert,
  Trophy,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import type { PlatformRole } from "./roles";

export type NavItem = {
  to: LinkProps["to"];
  label: string;
  Icon: LucideIcon;
  /** Match child routes as active (e.g. detail pages). */
  nested?: boolean;
};

const businessNav: NavItem[] = [
  { to: "/app", label: "Dashboard", Icon: Home },
  { to: "/app/business/requests", label: "Campaign Requests", Icon: FileText, nested: true },
  { to: "/app/business/contests", label: "My Contests", Icon: Trophy, nested: true },
  { to: "/app/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/app/notifications", label: "Notifications", Icon: Bell },
  { to: "/app/profile", label: "Profile", Icon: UserCircle },
];

const influencerNav: NavItem[] = [
  { to: "/app", label: "Dashboard", Icon: Home },
  { to: "/app/contests", label: "Available Contests", Icon: Trophy },
  { to: "/app/contests/saved", label: "Saved Contests", Icon: Bookmark },
  { to: "/app/entries", label: "My Applications", Icon: ClipboardList },
  { to: "/app/contests/active", label: "Active Contests", Icon: PlayCircle },
  { to: "/app/contests/completed", label: "Completed Contests", Icon: ListChecks },
  { to: "/app/contests/won", label: "Won Contests", Icon: Award },
  { to: "/app/rewards", label: "My Rewards", Icon: Wallet },
  { to: "/app/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/app/notifications", label: "Notifications", Icon: Bell },
  { to: "/app/profile", label: "Profile", Icon: UserCircle },
];

const adminNav: NavItem[] = [
  { to: "/app/admin", label: "Dashboard", Icon: Home },
  { to: "/app/admin/businesses", label: "Businesses", Icon: Building2, nested: true },
  { to: "/app/admin/influencers", label: "Influencers", Icon: Users, nested: true },
  { to: "/app/admin/requests", label: "Campaign Requests", Icon: FileText, nested: true },
  { to: "/app/admin/contests", label: "Contests", Icon: Trophy, nested: true },
  { to: "/app/admin/entries", label: "Participants", Icon: ClipboardList },
  { to: "/app/admin/winners", label: "Winners", Icon: Award },
  { to: "/app/admin/payouts", label: "Manual Payouts", Icon: Wallet },
  { to: "/app/admin/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/app/admin/reports", label: "Reports", Icon: FileText },
  { to: "/app/admin/moderation", label: "Moderation", Icon: ShieldAlert },
  { to: "/app/admin/templates", label: "Templates", Icon: LayoutTemplate },
  { to: "/app/admin/settings", label: "Platform Settings", Icon: Settings },
  { to: "/app/notifications", label: "Notifications", Icon: Bell },
];

export const NAVIGATION: Record<PlatformRole, NavItem[]> = {
  business: businessNav,
  influencer: influencerNav,
  admin: adminNav,
};

export function navigationFor(role: PlatformRole | null): NavItem[] {
  return role ? NAVIGATION[role] : businessNav;
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const to = item.to as string;
  if (pathname === to) return true;
  return Boolean(item.nested) && pathname.startsWith(`${to}/`);
}
