import React from "react";
import { isMobile } from "react-device-detect";
import { SidebarMobileHeader } from "../Sidebar";
import Appearance from "@/models/appearance";

export default function DefaultChatContainer() {
  const { showScrollbar } = Appearance.getSettings();

  return (
    <div
      style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
      className={`transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary light:border-[1px] light:border-theme-sidebar-border w-full h-full overflow-y-scroll ${
        showScrollbar ? "show-scrollbar" : "no-scroll"
      }`}
    >
      {isMobile && <SidebarMobileHeader />}
    </div>
  );
}
