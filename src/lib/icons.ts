import {
  Briefcase,
  Building2,
  Car,
  Film,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Category `icon` values are plain strings stored in SQLite (docs/database/SCHEMA.md).
 * This is the closed set the category icon picker offers — keep it in sync with
 * both the seed data in src-tauri/migrations/001_init.sql and the picker UI.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  home: Home,
  zap: Zap,
  car: Car,
  smartphone: Smartphone,
  repeat: Repeat,
  users: Users,
  briefcase: Briefcase,
  'building-2': Building2,
  'heart-pulse': HeartPulse,
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  film: Film,
  'more-horizontal': MoreHorizontal,
  wallet: Wallet,
  'trending-up': TrendingUp,
  laptop: Laptop,
}

export function getCategoryIcon(icon: string): LucideIcon {
  return CATEGORY_ICONS[icon] ?? MoreHorizontal
}
