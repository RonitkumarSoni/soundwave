import React from 'react';
import { User } from 'lucide-react';
import SidebarBottomNavItem from './SidebarBottomNavItem';

export interface SidebarProfileProps {
  active?: boolean;
  collapsed?: boolean;
  badge?: string;
  avatar?: string;
  onClick?: () => void;
}

export default function SidebarProfile({
  active = true,
  collapsed = false,
  badge = 'PRO',
  avatar,
  onClick
}: SidebarProfileProps) {
  return (
    <SidebarBottomNavItem
      icon={User}
      label="Profile"
      variant="profile"
      active={active}
      collapsed={collapsed}
      badge={badge}
      badgeStyle={badge === 'PRO' ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black' : undefined}
      avatar={avatar}
      onClick={onClick}
    />
  );
}
