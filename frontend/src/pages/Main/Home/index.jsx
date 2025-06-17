import React from "react";
import { isMobile } from "react-device-detect";

export default function Home() {
  return (
    <div
      style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
      className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-container w-full h-full"
    >
    </div>
  );
}
