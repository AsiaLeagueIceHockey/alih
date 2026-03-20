import { cn } from "@/lib/utils";

export const getInstagramTheme = (isPlayoff: boolean) => ({
  frameClass: cn(
    "relative overflow-hidden",
    isPlayoff
      ? "bg-gradient-to-b from-zinc-950 via-amber-950 to-red-950"
      : "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
  ),
  topGlowClass: cn(
    "absolute top-0 left-0 h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
    isPlayoff
      ? "from-amber-300/25 via-transparent to-transparent"
      : "from-primary/30 via-transparent to-transparent"
  ),
  bottomGlowClass: cn(
    "absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl",
    isPlayoff ? "bg-red-500/20" : "bg-primary/20"
  ),
  sideGlowClass: cn(
    "absolute top-1/4 left-0 w-64 h-64 rounded-full blur-3xl",
    isPlayoff ? "bg-amber-500/15" : "bg-blue-500/10"
  ),
  headerEyebrowClass: isPlayoff ? "text-amber-200/90" : "text-primary/80",
  accentTextClass: isPlayoff ? "text-amber-300" : "text-primary",
  panelClass: cn(
    "backdrop-blur-sm border",
    isPlayoff ? "bg-zinc-900/50 border-amber-300/20" : "bg-slate-800/50 border-slate-700/50"
  ),
  strongPanelClass: cn(
    "backdrop-blur-sm border",
    isPlayoff ? "bg-zinc-900/60 border-amber-300/35" : "bg-slate-800/60 border-primary/40"
  ),
  accentChipClass: cn(
    "border rounded-full",
    isPlayoff ? "bg-amber-300/12 border-amber-300/35 text-amber-200" : "bg-primary/20 border-primary/40 text-primary"
  ),
  badgeClass: cn(
    "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold tracking-[0.25em] uppercase border",
    isPlayoff ? "bg-amber-300/12 text-amber-100 border-amber-300/30" : "bg-primary/15 text-primary border-primary/25"
  ),
  footerDotClass: isPlayoff ? "bg-amber-300" : "bg-primary",
});
