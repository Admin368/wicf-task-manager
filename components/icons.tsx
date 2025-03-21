import {
  Loader2,
  Github,
  User,
  LogOut,
  Settings,
  Users,
  Plus,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  spinner: Loader2,
  gitHub: Github,
  user: User,
  logout: LogOut,
  settings: Settings,
  users: Users,
  plus: Plus,
  tasks: CheckSquare,
} as const;
