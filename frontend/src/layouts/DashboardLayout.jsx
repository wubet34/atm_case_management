import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { useState, useEffect } from "react";
import { useDarkMode } from "../context/DarkModeContext";

function DashboardLayout() {
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar");
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const { darkMode } = useDarkMode();

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("sidebar");
      setExpanded(saved !== null ? JSON.parse(saved) : true);
    };
    
    const handleSidebarToggle = (event) => {
      setExpanded(event.detail.expanded);
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("sidebarToggle", handleSidebarToggle);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
    };
  }, []);

  // Calculate margin based on sidebar state
  const sidebarWidth = expanded ? 288 : 80;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      <TopNavbar sidebarWidth={sidebarWidth} />
      {/* Main content with dynamic margin based on sidebar state */}
      <main 
        className={`transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-950 min-h-screen
          ${expanded ? "ml-72" : "ml-20"}
        `}
        style={{ marginTop: '64px' }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;