import React from 'react';
import { Settings } from 'lucide-react';
import SidebarBottomNavItem from './SidebarBottomNavItem';

export interface SidebarSettingsProps {
  active?: boolean;
  collapsed?: boolean;
  badge?: string;
  onClick?: () => void;
}

export default function SidebarSettings({
  active = false,
  collapsed = false,
  badge = 'NEW',
  onClick
}: SidebarSettingsProps) {
  return (
    <SidebarBottomNavItem
      icon={Settings}
      label="Settings"
      variant="settings"
      active={active}
      collapsed={collapsed}
      badge={badge}
      badgeStyle="bg-[#8B5CF6] text-white"
      onClick={onClick}
    />
  );
}
