/** Viewports below this width use drawer navigation in ops (phones + tablets). */
export const OPS_DRAWER_MAX_PX = 1023;

export function opsDrawerMediaQuery() {
  return `(max-width: ${OPS_DRAWER_MAX_PX}px)`;
}
