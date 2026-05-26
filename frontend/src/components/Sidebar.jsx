import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import { useState, useEffect, useRef } from "react";
import { useDarkMode } from "../context/DarkModeContext";
import { useAuth } from "../context/AuthContext";
import {
  Menu, X, LayoutDashboard, FileText, ClipboardList,
  Shield, ChevronDown, ChevronRight, Dot, Users,
  Moon, Sun, PlusCircle, UserCheck, XCircle, Wrench, Calendar
} from "lucide-react";

function Sidebar({ expanded: externalExpanded, setExpanded: externalSetExpanded }) {
  // Use props if provided, otherwise use internal state
  const [internalExpanded, setInternalExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar");
    const isDesktop = window.innerWidth >= 1024;
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return isDesktop;
  });

  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const setExpanded = externalSetExpanded || setInternalExpanded;

  const [openATM, setOpenATM] = useState(false);
  const [openTechnician, setOpenTechnician] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  
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
    <div className="relative">
      <NavLink
        to={to}
        onClick={handleLinkClick}
        onMouseEnter={() => setHoveredItem(label)}
        onMouseLeave={() => setHoveredItem(null)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
          ${isActive 
            ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md" 
            : `text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${expanded ? "justify-start" : "justify-center"}`
          }`
        }
      >
        <Icon size={22} />
        {expanded && <span className="font-medium text-base">{label}</span>}
      </NavLink>
      {/* Tooltip for collapsed mode */}
      {!expanded && hoveredItem === label && (
        <div className="fixed left-20 top-1/2 transform -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-100 shadow-lg">
          {label}
          <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </div>
  );

  const SubItem = ({ to, label, icon: Icon }) => (
    <div className="relative">
      <NavLink
        to={to}
        onClick={handleLinkClick}
        onMouseEnter={() => setHoveredItem(label)}
        onMouseLeave={() => setHoveredItem(null)}
        className={({ isActive }) =>
          `flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all duration-200
          ${isActive 
            ? "text-orange-600 bg-orange-50/50 dark:text-orange-400 dark:bg-orange-900/20" 
            : "text-gray-600 hover:text-orange-600 hover:bg-orange-50/30 dark:text-gray-400 dark:hover:text-orange-400 dark:hover:bg-gray-800"
          }`
        }
      >
        {Icon ? <Icon size={16} className="text-orange-500" /> : <Dot size={18} className="text-orange-500" />}
        <span>{label}</span>
      </NavLink>
      {/* Tooltip for collapsed mode */}
      {!expanded && hoveredItem === label && (
        <div className="fixed left-20 top-1/2 transform -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-100 shadow-lg">
          {label}
          <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </div>
  );

  const SectionButton = ({ title, icon: Icon, isOpen, onClick }) => (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setHoveredItem(title)}
        onMouseLeave={() => setHoveredItem(null)}
        className="flex items-center justify-between w-full px-3 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-3">
          <Icon size={22} />
          {expanded && <span className="font-medium text-base">{title}</span>}
        </div>
        {expanded && (
          <div className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
            <ChevronDown size={18} />
          </div>
        )}
      </button>
      {/* Tooltip for collapsed mode */}
      {!expanded && hoveredItem === title && (
        <div className="fixed left-20 top-1/2 transform -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-100 shadow-lg">
          {title}
          <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 shadow-lg flex flex-col transition-all duration-300 ease-in-out z-40
      ${expanded ? "w-72" : "w-20"}
      dark:border-r dark:border-gray-800`}
    >
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
        {expanded && (
          <img src={logo} className="w-28 object-contain dark:brightness-0 dark:invert" alt="Logo" />
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {expanded ? <X size={22} className="dark:text-gray-300" /> : <Menu size={22} className="dark:text-gray-300" />}
        </button>
      </div>

      {/* MAIN NAVIGATION */}
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-1 p-3">
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

      {/* DARK MODE TOGGLE ONLY - No Profile Section */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-4">
        <div className="relative">
          <button
            onClick={toggleDarkMode}
            onMouseEnter={() => setHoveredItem(darkMode ? "Light Mode" : "Dark Mode")}
            onMouseLeave={() => setHoveredItem(null)}
            className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            <div className="flex items-center gap-3">
              {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600 dark:text-gray-400" />}
              {expanded && (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </span>
              )}
            </div>
          </button>
          {/* Tooltip for collapsed mode */}
          {!expanded && hoveredItem === (darkMode ? "Light Mode" : "Dark Mode") && (
            <div className="fixed left-20 bottom-24 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-100 shadow-lg">
              {darkMode ? "Light Mode" : "Dark Mode"}
              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;