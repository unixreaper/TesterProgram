import { useState, useEffect } from "react";

export function useLayout() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [viewMode, setViewMode] = useState("dashboard");
  const [isResultsDetached, setIsResultsDetached] = useState(false);
  const [isChecklistDetached, setIsChecklistDetached] = useState(false);
  const [layoutMode, setLayoutMode] = useState("classic"); // classic, horizontal, full, zen

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingSidebar) setSidebarWidth(Math.max(150, Math.min(500, e.clientX - 48)));
      if (isResizingRight) setRightPanelWidth(Math.max(200, Math.min(600, globalThis.innerWidth - e.clientX)));
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingRight(false);
    };

    if (isResizingSidebar || isResizingRight) {
      globalThis.addEventListener("mousemove", handleMouseMove);
      globalThis.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      globalThis.removeEventListener("mousemove", handleMouseMove);
      globalThis.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar, isResizingRight]);

  return {
    showSidebar, setShowSidebar,
    showRightPanel, setShowRightPanel,
    sidebarWidth, setSidebarWidth,
    rightPanelWidth, setRightPanelWidth,
    isResizingSidebar, setIsResizingSidebar,
    isResizingRight, setIsResizingRight,
    viewMode, setViewMode,
    isResultsDetached, setIsResultsDetached,
    isChecklistDetached, setIsChecklistDetached,
    layoutMode, setLayoutMode
  };
}
