
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "./UserMenu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, userRole } = useAuth();

  // Different nav items based on authentication status
  const getNavItems = () => {
    if (user) {
      if (userRole === 'interviewer') {
        return [
          { name: "Home", path: "/become-interviewer" },
          { name: "Dashboard", path: "/dashboard" },
          { name: "Profile", path: "/interviewers" },
          { name: "Contact", path: "/contact" },
        ];
      } else {
        return [
          { name: "Home", path: "/" },
          { name: "Dashboard", path: "/dashboard" },
          { name: "Book", path: "/book" },
          { name: "Contact", path: "/contact" },
        ];
      }
    }

    return [
      { name: "Home", path: "/" },
      { name: "For Interviewers", path: "/become-interviewer" },
      { name: "Pricing", path: "/pricing" },
      { name: "FAQ", path: "/faq" },
      { name: "Contact", path: "/contact" },
    ];
  };

  const navItems = getNavItems();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900/95 border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user && userRole === 'interviewer' ? '/become-interviewer' : '/'} className="text-2xl font-bold text-white">
            IntervieWise
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? "text-blue-400"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* User Menu or Sign In Button */}
            {user ? (
              <UserMenu />
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10 bg-slate-900/98 backdrop-blur-sm">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block py-2 px-4 text-sm font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? "text-blue-400 bg-blue-400/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile User Menu */}
            <div className="mt-4 px-4">
              {user ? (
                <UserMenu />
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
