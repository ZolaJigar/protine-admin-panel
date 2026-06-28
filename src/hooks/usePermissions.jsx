'use client';

import { useMemo } from 'react';
import { useAdmin } from '@/context/AdminContext';

/**
 * usePermissions
 *
 * Reads the logged-in admin's permissions from context.permissions which has
 * the shape returned by /one/permissions/detail:
 *   {
 *     operations: string[],  // e.g. ["users_list", "users_create", ...]
 *     menu:       string[],  // e.g. ["users", "roles", ...]
 *     tabs:       string[],  // e.g. ["masters"]
 *   }
 *
 * Exposes:
 *   can(op)          → boolean  — true if op is in operations
 *   canAny(...ops)   → boolean  — true if at least one op is in operations
 *   canAll(...ops)   → boolean  — true if all ops are in operations
 *   hasMenu(key)     → boolean  — true if key is in menu array
 *   hasTab(key)      → boolean  — true if key is in tabs array
 *   isSuperAdmin     → boolean  — true when role_id === 1 (bypasses all checks)
 *   operations       → Set<string>
 *   menu             → Set<string>
 *   tabs             → Set<string>
 */
export function usePermissions() {
  const { admin, permissions } = useAdmin();

  const { operations, menu, tabs, isSuperAdmin } = useMemo(() => {
    // role_id 1 is super admin — bypass all permission checks
    const superAdmin = admin?.role_id === 1;

    const ops = new Set(Array.isArray(permissions?.operations) ? permissions.operations : []);
    const mn  = new Set(Array.isArray(permissions?.menu)       ? permissions.menu       : []);
    const tb  = new Set(Array.isArray(permissions?.tabs)       ? permissions.tabs       : []);

    return { operations: ops, menu: mn, tabs: tb, isSuperAdmin: superAdmin };
  }, [admin, permissions]);

  /** Check a single operation slug, e.g. can('users_list') */
  const can = (op) => {
    if (!op) return true;
    if (isSuperAdmin) return true;
    return operations.has(op);
  };

  /** True if the admin has at least one of the given operations */
  const canAny = (...ops) => {
    if (isSuperAdmin) return true;
    return ops.flat().some((o) => operations.has(o));
  };

  /** True if the admin has all of the given operations */
  const canAll = (...ops) => {
    if (isSuperAdmin) return true;
    return ops.flat().every((o) => operations.has(o));
  };

  /** Check sidebar/menu visibility, e.g. hasMenu('users') */
  const hasMenu = (key) => {
    if (isSuperAdmin) return true;
    return menu.has(key);
  };

  /** Check tab visibility, e.g. hasTab('masters') */
  const hasTab = (key) => {
    if (isSuperAdmin) return true;
    return tabs.has(key);
  };

  return { can, canAny, canAll, hasMenu, hasTab, isSuperAdmin, operations, menu, tabs };
}
