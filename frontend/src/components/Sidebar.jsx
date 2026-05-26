import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import { useState, useEffect, useRef } from "react";
import { useDarkMode } from "../context/DarkModeContext";
import { useAuth } from "../context/AuthContext";
import {
  Menu, X, LayoutDashboard, FileText, ClipboardList,
  Shield, ChevronDown, Users,
  Moon, Sun, PlusCircle, UserCheck, XCircle, Wrench, Calendar
} from "lucide-react";

function Sidebar({ expanded: externalExpanded, setExpanded: externalSetExpanded }) {
  // Use props if provided, otherwise use internal state
  const [internalExpanded, setInternalExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar");
    const isDesktop = window.innerWidth >= 1024;
    // On mobile, always start collapsed (only show menu icon)
    if (!isDesktop) {
      return false;
    }
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return isDesktop;
  });

  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const setExpanded = externalSetExpanded || setInternalExpanded;

  const [openATM, setOpenATM] = useState(false);
  const [openTechnician, setOpenTechnician] = useState(false);
  
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user } = useAuth();
  
  const [userData, setUserData] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : { name: "Wubet Tesfaye", role: "admin", email: "admin@example.com" };
  });

  const atmRef = useRef();
  const technicianRef = useRef();

  const isAdmin = user?.role === 'admin' || userData?.role === 'admin';
  const isTechnician = user?.role === 'technician' || userData?.role === 'technician';

  // Handle window resize - auto collapse on mobile, expand on desktop
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (!isDesktop && expanded) {
        setExpanded(false);
        localStorage.setItem("sidebar", JSON.stringify(false));
      } else if (isDesktop && !expanded) {
        const saved = localStorage.getItem("sidebar");
        if (saved === null) {
          setExpanded(true);
          localStorage.setItem("sidebar", JSON.stringify(true));
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [expanded, setExpanded]);

  useEffect(() => {
    localStorage.setItem("sidebar", JSON.stringify(expanded));
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { expanded } }));
  }, [expanded]);

  useEffect(() => {
    if (!expanded) {
      setOpenATM(false);
      setOpenTechnician(false);
    }
  }, [expanded]);

  const isMobile = () => window.innerWidth < 768;
  const handleLinkClick = () => {
    if (isMobile()) setExpanded(false);
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      onClick={handleLinkClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        ${isActive 
          ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md" 
          : `text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${expanded ? "justify-start" : "justify-center"}`
        }`
      }
    >
      <Icon size={18} />
      {expanded && <span className="font-medium text-sm">{label}</span>}
    </NavLink>
  );

  const SubItem = ({ to, label, icon: Icon }) => (
    <NavLink
      to={to}
      onClick={handleLinkClick}
      className={({ isActive }) =>
        `flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all duration-200
        ${isActive 
          ? "text-orange-600 bg-orange-50/50 dark:text-orange-400 dark:bg-orange-900/20" 
          : "text-gray-600 hover:text-orange-600 hover:bg-orange-50/30 dark:text-gray-400 dark:hover:text-orange-400 dark:hover:bg-gray-800"
        }`
      }
    >
      {Icon ? <Icon size={14} className="text-orange-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
      {expanded && <span>{label}</span>}
    </NavLink>
  );

  const SectionButton = ({ title, icon: Icon, isOpen, onClick }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        {expanded && <span className="font-medium text-sm">{title}</span>}
      </div>
      {expanded && (
        <div className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown size={16} />
        </div>
      )}
    </button>
  );

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 shadow-lg flex flex-col transition-all duration-300 ease-in-out z-40
      ${expanded ? "w-72" : "w-16"}
      dark:border-r dark:border-gray-800`}
    >
      {/* HEADER SECTION - Only menu icon on mobile */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        {expanded && (
          <img src={logo} className="w-24 object-contain dark:brightness-0 dark:invert" alt="Logo" />
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${!expanded ? "mx-auto" : ""}`}
        >
          {expanded ? <X size={18} className="dark:text-gray-300" /> : <Menu size={18} className="dark:text-gray-300" />}
        </button>
      </div>

      {/* MAIN NAVIGATION */}
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-1 p-2">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/cases" icon={FileText} label="Case Tracking" />

          {/* TECHNICIAN SECTION */}
          {isTechnician && (
            <div ref={technicianRef}>
              <SectionButton 
                title="Technician" 
                icon={Wrench} 
                isOpen={openTechnician}
                onClick={() => {
                  if (!expanded) {
                    setExpanded(true);
                    setTimeout(() => setOpenTechnician(true), 200);
                  } else {
                    setOpenTechnician(!openTechnician);
                  }
                }}
              />
              {openTechnician && expanded && (
                <div className="ml-7 mt-1 flex flex-col gap-1">
                  <SubItem to="/technician/my-cases" label="My Assigned Cases" icon={FileText} />
                  <SubItem to="/technician/schedule" label="My Schedule" icon={Calendar} />
                </div>
              )}
            </div>
          )}

          {/* ATM CASE SECTION - Admin */}
          {isAdmin && (
            <div ref={atmRef}>
              <SectionButton 
                title="ATM Case" 
                icon={Shield} 
                isOpen={openATM}
                onClick={() => {
                  if (!expanded) {
                    setExpanded(true);
                    setTimeout(() => setOpenATM(true), 200);
                  } else {
                    setOpenATM(!openATM);
                  }
                }}
              />
              {openATM && expanded && (
                <div className="ml-7 mt-1 flex flex-col gap-1">
                  <SubItem to="/atm/manage" label="Manage Case" icon={PlusCircle} />
                  <SubItem to="/atm/appoint" label="Appoint Technician" icon={UserCheck} />
                  <SubItem to="/atm/terminate" label="Terminate Case" icon={XCircle} />
                </div>
              )}
            </div>
          )}

          {/* TECHNICIANS - Admin only */}
          {isAdmin && (
            <NavItem to="/technicians" icon={Users} label="Technicians" />
          )}

          {/* REPORTS */}
          <NavItem to="/reports" icon={ClipboardList} label="Reports" />
        </nav>
      </div>

      {/* DARK MODE TOGGLE */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        <button
          onClick={toggleDarkMode}
          className={`w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center ${expanded ? "justify-start" : "justify-center"}`}
        >
          <div className={`flex items-center gap-3 ${!expanded && "justify-center"}`}>
            {darkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-gray-600 dark:text-gray-400" />}
            {expanded && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {darkMode ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;