import { cn } from "@/lib/utils";

export const getInstagramTheme = (isPlayoff: boolean, isFinal = false) => ({
  frameClass: cn(
    "relative overflow-hidden",
    isFinal
      ? "bg-[linear-gradient(180deg,_#190b0b_0%,_#341010_35%,_#120f14_100%)]"
      : isPlayoff
      ? "bg-gradient-to-b from-zinc-950 via-amber-950 to-red-950"
      : "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
  ),
  topGlowClass: cn(
    "absolute top-0 left-0 h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
    isFinal
      ? "from-amber-200/35 via-transparent to-transparent"
      : isPlayoff
      ? "from-amber-300/25 via-transparent to-transparent"
      : "from-primary/30 via-transparent to-transparent"
  ),
  bottomGlowClass: cn(
    "absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl",
    isFinal ? "bg-red-500/30" : isPlayoff ? "bg-red-500/20" : "bg-primary/20"
  ),
  sideGlowClass: cn(
    "absolute top-1/4 left-0 w-64 h-64 rounded-full blur-3xl",
    isFinal ? "bg-amber-400/25" : isPlayoff ? "bg-amber-500/15" : "bg-blue-500/10"
  ),
  headerEyebrowClass: isFinal ? "text-amber-100" : isPlayoff ? "text-amber-200/90" : "text-primary/80",
  accentTextClass: isFinal ? "text-amber-100" : isPlayoff ? "text-amber-300" : "text-primary",
  panelClass: cn(
    "backdrop-blur-sm border",
    isFinal
      ? "bg-zinc-950/55 border-amber-200/30 shadow-[0_18px_60px_-30px_rgba(251,191,36,0.55)]"
      : isPlayoff
      ? "bg-zinc-900/50 border-amber-300/20"
      : "bg-slate-800/50 border-slate-700/50"
  ),
  strongPanelClass: cn(
    "backdrop-blur-sm border",
    isFinal
      ? "bg-zinc-950/70 border-amber-200/40 shadow-[0_20px_70px_-32px_rgba(251,191,36,0.65)]"
      : isPlayoff
      ? "bg-zinc-900/60 border-amber-300/35"
      : "bg-slate-800/60 border-primary/40"
  ),
  accentChipClass: cn(
    "border rounded-full",
    isFinal
      ? "bg-amber-200/15 border-amber-200/40 text-amber-50"
      : isPlayoff
      ? "bg-amber-300/12 border-amber-300/35 text-amber-200"
      : "bg-primary/20 border-primary/40 text-primary"
  ),
  badgeClass: cn(
    "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold tracking-[0.25em] uppercase border",
    isFinal
      ? "bg-amber-200/12 text-amber-50 border-amber-200/40"
      : isPlayoff
      ? "bg-amber-300/12 text-amber-100 border-amber-300/30"
      : "bg-primary/15 text-primary border-primary/25"
  ),
  footerDotClass: isFinal ? "bg-amber-200" : isPlayoff ? "bg-amber-300" : "bg-primary",
});
