import { t } from 'i18next';
import {
  Bell,
  GitBranch,
  Puzzle,
  Settings,
  SunMoon,
  Users,
  Bot,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

import SidebarLayout, { SidebarItem } from '@/app/components/sidebar-layout';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { isNil, Permission } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

const iconSize = 20;

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function ProjectSettingsLayout({
  children,
}: SettingsLayoutProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const currentProjectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  if (isNil(currentProjectId)) {
    return <Navigate to="/sign-in" replace />;
  }
  const sidebarNavItems: SidebarItem[] = [
    {
      title: t('General'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/general'),
      icon: <Settings size={iconSize} />,
    },
    {
      title: t('Appearance'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/appearance'),
      icon: <SunMoon size={iconSize} />,
    },
    {
      title: t('AI Settings'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/ai'),
      icon: <Bot size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_PROJECT_MEMBER),
    },
  ];

  const filterAlerts = (item: SidebarItem) =>
    platform.alertsEnabled || item.title !== t('Alerts');
  const filterOnPermission = (item: SidebarItem) =>
    isNil(item.hasPermission) || item.hasPermission;

  const filteredNavItems = sidebarNavItems
    .filter(filterAlerts)
    .filter(filterOnPermission);

  return (
    <SidebarLayout title={t('Settings')} items={filteredNavItems}>
      {children}
    </SidebarLayout>
  );
}
