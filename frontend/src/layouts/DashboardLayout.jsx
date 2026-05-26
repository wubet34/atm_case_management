import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { useState, useEffect } from "react";
import { useDarkMode } from "../context/DarkModeContext";

function DashboardLayout() {
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar");
    const isDesktop = window.innerWidth >= 1024;
    // On mobile, default to collapsed (showing only menu icon)
    if (!isDesktop) {
      return false;
    }
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const { darkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile if expanded
      if (mobile && expanded) {
        setExpanded(false);
        localStorage.setItem("sidebar", JSON.stringify(false));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [expanded]);

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

  // Calculate margin based on sidebar state and device
  let marginLeft = "ml-0";
  if (!isMobile && expanded) {
    marginLeft = "ml-72";
  } else if (!isMobile && !expanded) {
    marginLeft = "ml-20";
  } else if (isMobile && expanded) {
    marginLeft = "ml-72";
  } else {
    marginLeft = "ml-0"; // On mobile collapsed - full width, no margin
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      <TopNavbar sidebarWidth={expanded && !isMobile ? (expanded ? 288 : 80) : 0} />
      {/* Main content with dynamic margin */}
      <main 
        className={`transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-950 min-h-screen ${marginLeft}`}
        style={{ marginTop: '64px' }}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;