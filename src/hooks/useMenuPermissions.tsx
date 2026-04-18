import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_MENU_ITEMS } from '@/lib/menuRegistry';
import type { AppRole } from '@/hooks/useAuth';

export interface MenuPermissionRow {
  role: AppRole;
  menu_key: string;
  enabled: boolean;
}

/**
 * Returns a map of "role::menu_key" -> enabled.
 * Falls back to defaultRoles when no row exists for that (role, menu_key).
 */
export function useMenuPermissions() {
  const [rows, setRows] = useState<MenuPermissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPerms = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('role_menu_permissions').select('role, menu_key, enabled');
    setRows((data as MenuPermissionRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPerms(); }, [fetchPerms]);

  const isEnabled = useCallback(
    (role: AppRole, menuKey: string): boolean => {
      const row = rows.find((r) => r.role === role && r.menu_key === menuKey);
      if (row) return row.enabled;
      // fallback to default registry
      const item = ALL_MENU_ITEMS.find((i) => i.key === menuKey);
      return item ? item.defaultRoles.includes(role) : false;
    },
    [rows]
  );

  return { rows, isEnabled, loading, refetch: fetchPerms };
}
