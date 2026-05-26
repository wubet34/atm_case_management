import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { useState, useEffect } from "react";
import { useDarkMode } from "../context/DarkModeContext";

function DashboardLayout() {
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar");
    const isDesktop = window.innerWidth >= 1024;
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

  // Desktop sidebar widths: expanded = w-72 (288px), collapsed = w-16 (64px)
  const sidebarWidth = !isMobile && expanded ? 288 : (!isMobile && !expanded ? 64 : 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      
      <TopNavbar sidebarWidth={sidebarWidth} />
      
      {/* Main content - margin matches sidebar width exactly */}
      <main 
        className={`bg-gray-50 dark:bg-gray-950 min-h-screen`}
        style={{ 
          marginLeft: !isMobile ? (expanded ? '288px' : '64px') : '0px',
          marginTop: '64px',
          transition: 'margin-left 0.3s ease-in-out'
        }}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;