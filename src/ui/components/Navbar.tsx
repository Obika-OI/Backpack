import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { Briefcase, GraduationCap, LogOut, Moon, Sun, Menu, X, Coffee } from "lucide-react";
import { useTheme } from "../../store/ThemeContext";

export const Navbar = () => {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getLinkStyle = (path: string) =>
    `text-sm font-medium transition-colors ${
      pathname === path ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
    }`;

  const getMobileLinkStyle = (path: string) =>
    `block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${
      pathname === path
        ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold"
        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

  const handleLogout = async () => {
    await signOut(auth);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/60 sticky top-0 z-50 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" onClick={closeMenu} className="flex items-center space-x-2">
          <span className="text-2xl">🎒</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">BACKPACK</span>
        </Link>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center space-x-6">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <Link to="/" className={getLinkStyle("/")}>Home</Link>
          
          {currentUser && currentUser.role === 'student' && (
            <Link to="/explore" className={getLinkStyle("/explore")}>Explore Orgs</Link>
          )}

          {currentUser && (currentUser.role === 'organization' || currentUser.role === 'instructor') && (
            <Link to="/upload-course" className={getLinkStyle("/upload-course")}>Add Course</Link>
          )}

          {currentUser && (
            <>
              <Link to="/dashboard" className={getLinkStyle("/dashboard")}>Dashboard</Link>
              <Link to="/settings" className={getLinkStyle("/settings")}>Settings</Link>
            </>
          )}

          <Link to="/lunch" className={`${getLinkStyle("/lunch")} flex items-center space-x-1`}>
            <Coffee className="w-3.5 h-3.5" />
            <span>Lunch</span>
          </Link>
          
          {currentUser && currentUser.role === 'organization' && (
            <Link
              to="/onboard"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition duration-200 flex items-center shadow-sm"
            >
              <Briefcase className="w-4 h-4 mr-2" /> Org Settings
            </Link>
          )}

          {currentUser ? (
             <div className="flex items-center space-x-4 ml-4 border-l border-slate-200 dark:border-slate-700 pl-4">
                <div className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300">
                  {currentUser.role === 'student' ? <GraduationCap className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Briefcase className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
                  <span>{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
             </div>
          ) : (
            <div className="flex space-x-3">
               <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2">Login</Link>
               <Link to="/signup" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-sm">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger & Theme Button */}
        <div className="flex items-center space-x-2 md:hidden">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2 animate-in slide-in-from-top-2">
          <Link to="/" onClick={closeMenu} className={getMobileLinkStyle("/")}>Home</Link>
          
          {currentUser && currentUser.role === 'student' && (
            <Link to="/explore" onClick={closeMenu} className={getMobileLinkStyle("/explore")}>Explore Orgs</Link>
          )}

          {currentUser && (currentUser.role === 'organization' || currentUser.role === 'instructor') && (
            <Link to="/upload-course" onClick={closeMenu} className={getMobileLinkStyle("/upload-course")}>Add Course</Link>
          )}

          {currentUser && (
            <>
              <Link to="/dashboard" onClick={closeMenu} className={getMobileLinkStyle("/dashboard")}>Dashboard</Link>
              <Link to="/settings" onClick={closeMenu} className={getMobileLinkStyle("/settings")}>Settings</Link>
            </>
          )}

          <Link to="/lunch" onClick={closeMenu} className={`${getMobileLinkStyle("/lunch")} flex items-center space-x-2`}>
            <Coffee className="w-4 h-4 text-indigo-500" />
            <span>Lunch & Games</span>
          </Link>

          {currentUser && currentUser.role === 'organization' && (
            <Link to="/onboard" onClick={closeMenu} className={getMobileLinkStyle("/onboard")}>
              Org Settings
            </Link>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60">
            {currentUser ? (
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {currentUser.role === 'student' ? <GraduationCap className="w-4 h-4 text-emerald-500" /> : <Briefcase className="w-4 h-4 text-amber-500" />}
                  <span>{currentUser.name} ({currentUser.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-2 pt-2">
                <Link to="/login" onClick={closeMenu} className="text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200">Login</Link>
                <Link to="/signup" onClick={closeMenu} className="text-center py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
