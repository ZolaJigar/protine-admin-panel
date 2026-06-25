'use client';

import { useMemo } from 'react';
import { useAdmin } from '@/context/AdminContext';

/**
 * usePermissions
 *
 * Reads the logged-in admin's permission slugs and exposes:
 *   can(slug)        → boolean  — true if the admin has this permission
 *   canAny(...slugs) → boolean  — true if the admin has at least one
 *   canAll(...slugs) → boolean  — true if the admin has all of them
 *   isSuperAdmin     → boolean  — true when role slug is 'super_admin' (bypass all)
 *   permissionSlugs  → Set<string>
 *
 * Permission slugs are sourced from:
 *   admin.rolePermissions[].permission.slug   (populated relation)
 *   OR admin.permissions[].slug               (flat array)
 *   OR admin.role.rolePermissions[].permission.slug
 *
 * Super-admins bypass every check.
 */
export function usePermissions() {
  const { admin } = useAdmin();

  const { permissionSlugs, isSuperAdmin } = useMemo(() => {
    if (!admin) return { permissionSlugs: new Set(), isSuperAdmin: false };

    const superAdmin =
      admin?.role?.slug === 'super_admin' ||
      admin?.role?.slug === 'superadmin'  ||
      admin?.roleName   === 'super_admin';

    const slugs = new Set();

    // Source 1: admin.role.rolePermissions[].permission.slug  ← actual API shape
    if (Array.isArray(admin?.role?.rolePermissions)) {
      admin.role.rolePermissions.forEach((rp) => {
        if (rp?.permission?.slug) slugs.add(rp.permission.slug);
      });
    }

    // Source 2: admin.rolePermissions[].permission.slug  (fallback)
    if (Array.isArray(admin.rolePermissions)) {
      admin.rolePermissions.forEach((rp) => {
        if (rp?.permission?.slug) slugs.add(rp.permission.slug);
        if (rp?.slug) slugs.add(rp.slug);
      });
    }

    // Source 3: admin.permissions[].slug  (fallback)
    if (Array.isArray(admin.permissions)) {
      admin.permissions.forEach((p) => {
        if (p?.slug) slugs.add(p.slug);
      });
    }

    return { permissionSlugs: slugs, isSuperAdmin: superAdmin };
  }, [admin]);

  const can = (slug) => {
    if (!slug) return true;
    if (isSuperAdmin) return true;
    return permissionSlugs.has(slug);
  };

  const canAny = (...slugs) => {
    if (isSuperAdmin) return true;
    return slugs.flat().some((s) => permissionSlugs.has(s));
  };

  const canAll = (...slugs) => {
    if (isSuperAdmin) return true;
    return slugs.flat().every((s) => permissionSlugs.has(s));
  };

  return { can, canAny, canAll, isSuperAdmin, permissionSlugs };
}
