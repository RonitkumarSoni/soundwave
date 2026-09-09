import React from 'react';
import { Download } from 'lucide-react';
import SidebarBottomNavItem from './SidebarBottomNavItem';

export interface SidebarDownloadsProps {
  active?: boolean;
  collapsed?: boolean;
  badge?: string;
  onClick?: () => void;
}

export default function SidebarDownloads({
  active = false,
  collapsed = false,
  badge = '12',
  onClick
}: SidebarDownloadsProps) {
  return (
    <SidebarBottomNavItem
      icon={Download}
      label="Downloads"
      variant="downloads"
      active={active}
      collapsed={collapsed}
      badge={badge}
      badgeStyle="bg-[#1DB954] text-white"
      onClick={onClick}
    />
  );
}
