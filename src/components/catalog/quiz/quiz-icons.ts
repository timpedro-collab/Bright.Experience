/** Lucide icon map for recommendation quiz option cards. */
import {
  Megaphone, Target, Gift, Gamepad2,
  Users, Building2, Tent, Sparkles, Music, Briefcase, Mic,
  User, UsersRound, Ruler, Warehouse, Globe, Theater,
  Handshake, ShoppingBag, CircleDot, Wine, Wind, Dice5,
  Landmark, Stethoscope, Lightbulb, Rocket, Share2,
  Calendar, CalendarClock, CalendarRange, Compass,
  MapPin, Store, Network, type LucideIcon,
} from "lucide-react";

export const QUIZ_ICONS: Record<string, LucideIcon> = {
  megaphone: Megaphone, target: Target, gift: Gift, "gamepad-2": Gamepad2,
  lightbulb: Lightbulb, rocket: Rocket, "share-2": Share2,
  users: Users, "building-2": Building2, tent: Tent, sparkles: Sparkles,
  music: Music, briefcase: Briefcase, mic: Mic, user: User,
  "users-round": UsersRound, stadium: Globe, ruler: Ruler,
  warehouse: Warehouse, globe: Globe, theater: Theater,
  handshake: Handshake, "shopping-bag": ShoppingBag, "circle-dot": CircleDot,
  wine: Wine, wind: Wind, "dice-5": Dice5, landmark: Landmark,
  stethoscope: Stethoscope, calendar: Calendar, "calendar-clock": CalendarClock,
  "calendar-range": CalendarRange, compass: Compass, "map-pin": MapPin,
  store: Store, network: Network,
};
