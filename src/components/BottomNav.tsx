import { NavLink } from "./NavLink";
import { Home, Calendar, Video, Trophy, Users, Newspaper } from "lucide-react";

const BottomNav = () => {
  const navItems = [
    { to: "/", icon: Home, label: "홈" },
    { to: "/schedule", icon: Calendar, label: "일정" },
    { to: "/highlights", icon: Video, label: "영상" },
    { to: "/standings", icon: Trophy, label: "순위" },
    { to: "/stats", icon: Users, label: "선수" },
    { to: "/news", icon: Newspaper, label: "뉴스" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border backdrop-blur-lg bg-opacity-95 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
