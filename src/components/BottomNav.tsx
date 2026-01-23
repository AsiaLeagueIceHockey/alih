import { NavLink } from "./NavLink";
import { Home, Calendar, Video, Trophy, Newspaper } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { to: "/", icon: Home, labelKey: "nav.home" },
    { to: "/schedule", icon: Calendar, labelKey: "nav.schedule" },
    { to: "/highlights", icon: Video, labelKey: "nav.highlights" },
    { to: "/standings", icon: Trophy, labelKey: "nav.standings" },
    { to: "/news", icon: Newspaper, labelKey: "nav.news" },
  ];

  const handleNavClick = (to: string) => {
    if (location.pathname === to) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border backdrop-blur-lg bg-opacity-95 pb-safe">
      <div className="flex justify-around items-center h-12 max-w-screen-xl mx-auto px-2">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => handleNavClick(to)}
            className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-all duration-200 hover:text-primary"
            activeClassName="text-primary"
            aria-label={t(labelKey)}
          >
            <Icon className="w-6 h-6" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
