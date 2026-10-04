import React from 'react';
import { Mic } from 'lucide-react';
import SidebarNavItem from './SidebarNavItem';

export interface SidebarPodcastsProps {
  active?: boolean;
  collapsed?: boolean;
  badge?: string;
  onClick?: () => void;
}

export default function SidebarPodcasts({
  active = false,
  collapsed = false,
  badge,
  onClick
}: SidebarPodcastsProps) {
  return (
    <SidebarNavItem
      icon={Mic}
      label="Podcasts"
      variant="podcasts"
      active={active}
      collapsed={collapsed}
      badge={badge}
      onClick={onClick}
    />
  );
}
