import { NavLink } from "./NavLink";
import { Home, Calendar, Video, Trophy, Users, Newspaper } from "lucide-react";
import { useLocation } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { to: "/", icon: Home, label: "홈" },
    { to: "/schedule", icon: Calendar, label: "일정" },
    { to: "/highlights", icon: Video, label: "영상" },
    { to: "/standings", icon: Trophy, label: "순위" },
    { to: "/news", icon: Newspaper, label: "뉴스" },
  ];

  const handleNavClick = (to: string) => {
    if (location.pathname === to) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border backdrop-blur-lg bg-opacity-95 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => handleNavClick(to)}
            className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-all duration-200 hover:text-primary"
            activeClassName="text-primary"
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
