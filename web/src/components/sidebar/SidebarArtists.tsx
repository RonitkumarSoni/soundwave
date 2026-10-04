import React from 'react';
import { Music2 } from 'lucide-react';
import SidebarNavItem from './SidebarNavItem';

export interface SidebarArtistsProps {
  active?: boolean;
  collapsed?: boolean;
  badge?: string;
  onClick?: () => void;
}

export default function SidebarArtists({
  active = false,
  collapsed = false,
  badge,
  onClick
}: SidebarArtistsProps) {
  return (
    <SidebarNavItem
      icon={Music2}
      label="Artists"
      variant="artists"
      active={active}
      collapsed={collapsed}
      badge={badge}
      onClick={onClick}
    />
  );
}
