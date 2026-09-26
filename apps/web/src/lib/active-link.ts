/**
 * The href whose page the member is on: an exact match or a parent path, with the most specific
 * (longest) match winning, so `/dashboard/next-steps` marks "Next steps" and not "Check-ins".
 * Hash links never match, because a pathname carries no hash.
 */
export function activeHref<T extends string>(pathname: string, hrefs: readonly T[]): T | undefined {
  let active: T | undefined;
  for (const href of hrefs) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (active === undefined || href.length > active.length)) {
      active = href;
    }
  }
  return active;
}
