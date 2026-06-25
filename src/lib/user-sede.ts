export function getUserAllowedSedeIds(user: { role?: string | null; sedeId?: string | null; allowedSedeIds?: string | null }): string[] | null {
  if (user.allowedSedeIds) {
    try {
      const ids = JSON.parse(user.allowedSedeIds);
      if (Array.isArray(ids) && ids.length > 0) return ids;
    } catch {}
  }
  if (user.sedeId) return [user.sedeId];
  return null;
}

export function canAccessSede(user: { role?: string | null; sedeId?: string | null; allowedSedeIds?: string | null }, sedeId: string): boolean {
  if (user.role !== "user") return true;
  const allowed = getUserAllowedSedeIds(user as any);
  if (allowed === null) return true;
  return allowed.includes(sedeId);
}
