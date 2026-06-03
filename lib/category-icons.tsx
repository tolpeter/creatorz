import {
  UtensilsCrossed,
  Plane,
  Shirt,
  Trophy,
  Sparkles,
  Heart,
  Monitor,
  Home,
  Baby,
  Car,
  Dumbbell,
  Leaf,
  Coffee,
  Smile,
  PawPrint,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

/**
 * Lucide line-piktogram ikonok minden kategóriához (az emojik helyett).
 * Lookup CREATOR_CATEGORIES `value` mezőre.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  gasztro: UtensilsCrossed,
  utazas: Plane,
  divat: Shirt,
  sport: Trophy,
  beauty: Sparkles,
  lifestyle: Leaf,
  tech: Monitor,
  otthon: Home,
  anyukak: Baby,
  auto: Car,
  fitness: Dumbbell,
  wellness: Heart,
  vendeglatas: Coffee,
  gyerek: Smile,
  allatok: PawPrint,
  egyeb: MoreHorizontal,
};
