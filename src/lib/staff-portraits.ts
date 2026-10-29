/** Local Unsplash-sourced hospitality staff photography in /public/staff */

export const STAFF_SCENE_IMAGES = {
  briefing: { src: "/staff/team-briefing.jpg", alt: "Managers briefing the service team before doors open" },
  line: { src: "/staff/team-line.jpg", alt: "Kitchen and floor staff aligned before service" },
} as const;

const ROLE_PORTRAITS: { match: RegExp; src: string; alt: string }[] = [
  { match: /barista|cashier/i, src: "/staff/barista.jpg", alt: "Counter staff member" },
  { match: /chef|kitchen|pastry|commis|porter|baker|dishwasher/i, src: "/staff/kitchen.jpg", alt: "Kitchen team member" },
  { match: /waiter|waitress|server|runner|sommelier|breakfast|food and beverage/i, src: "/staff/server.jpg", alt: "Floor service staff member" },
  { match: /bartender|bar\b/i, src: "/staff/bartender.jpg", alt: "Bartender" },
  { match: /host|cashier|concierge|front desk|night auditor|manager/i, src: "/staff/host.jpg", alt: "Front-of-house staff member" },
  { match: /housekeeping|steward|maintenance|engineering/i, src: "/staff/housekeeping.jpg", alt: "Housekeeping or operations staff member" },
  { match: /desk|front office/i, src: "/staff/front-desk.jpg", alt: "Front desk agent" },
];

const FALLBACK_PORTRAITS = [
  "/staff/manager.jpg",
  "/staff/server.jpg",
  "/staff/bartender.jpg",
  "/staff/housekeeping.jpg",
  "/staff/host.jpg",
  "/staff/kitchen.jpg",
];

function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

export function staffPortraitFor(input: { id: string; role: string; name?: string }) {
  const role = input.role.trim();
  for (const entry of ROLE_PORTRAITS) {
    if (entry.match.test(role)) {
      return { src: entry.src, alt: input.name ? `${input.name}, ${role}` : entry.alt };
    }
  }
  const src = FALLBACK_PORTRAITS[hashId(input.id) % FALLBACK_PORTRAITS.length] ?? "/staff/manager.jpg";
  return { src, alt: input.name ? `${input.name}, ${role}` : "Team member" };
}

export const LANDING_STAFF_TILES = [
  { src: "/staff/server.jpg", label: "Floor", alt: "Waitstaff during service" },
  { src: "/staff/kitchen.jpg", label: "Kitchen", alt: "Chef at the pass" },
  { src: "/staff/bartender.jpg", label: "Bar", alt: "Bartender pouring" },
  { src: "/staff/housekeeping.jpg", label: "House", alt: "Housekeeping on rounds" },
  { src: "/staff/front-desk.jpg", label: "Desk", alt: "Front desk greeting a guest" },
  { src: "/staff/barista.jpg", label: "Counter", alt: "Barista at the café counter" },
  { src: "/staff/manager.jpg", label: "Lead", alt: "Shift lead reviewing the plan" },
  { src: "/staff/host.jpg", label: "Host", alt: "Host welcoming guests" },
] as const;
