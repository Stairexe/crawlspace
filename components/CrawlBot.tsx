/**
 * The crawl-bot — Crawlspace's inspector.
 *
 * Drawn as survey line-work, not a mascot: a hexapod inspection unit with a torch
 * lens, jointed legs with pin joints, and drafted foot terminators. One geometry,
 * two renderings:
 *   - <CrawlBot detail="full">  the intro protagonist; every leg is its own group so
 *                               the Descent sequence can walk and stretch it.
 *   - <CrawlBot detail="mark">  the 28px logo; four legs, heavier stroke, no pins.
 *
 * Geometry lives in a 120 x 84 viewBox. Ground line is y = 78.
 */

export type Pt = readonly [number, number];

export interface Leg {
  id: string;
  side: "l" | "r";
  hip: Pt;
  knee: Pt;
  foot: Pt;
}

export const GROUND = 78;

// Insect stance: knee arched ABOVE the body, foot planted far out. This is what makes
// the silhouette read as a crawler rather than a camera on a tripod.
const LEFT: Omit<Leg, "side" | "id">[] = [
  { hip: [38, 40], knee: [14, 6], foot: [2, GROUND] },
  { hip: [38, 49], knee: [19, 22], foot: [16, GROUND] },
  { hip: [38, 58], knee: [25, 38], foot: [31, GROUND] },
];

const mirror = ([x, y]: Pt): Pt => [120 - x, y];

export const LEGS: Leg[] = [
  ...LEFT.map((l, i) => ({ ...l, side: "l" as const, id: `l${i + 1}` })),
  ...LEFT.map((l, i) => ({
    id: `r${i + 1}`,
    side: "r" as const,
    hip: mirror(l.hip),
    knee: mirror(l.knee),
    foot: mirror(l.foot),
  })),
];

/** Legs shown on the small mark: the outer pair each side. */
const MARK_LEGS = new Set(["l1", "l3", "r1", "r3"]);

export const LENS: Pt = [60, 49];

export function CrawlBot({
  detail = "full",
  size,
  className = "",
  lensLit = false,
  title,
}: {
  detail?: "full" | "mark";
  /** Rendered width in px. Height follows the 120:84 ratio. */
  size?: number;
  className?: string;
  lensLit?: boolean;
  title?: string;
}) {
  const full = detail === "full";
  const sw = full ? 2.4 : 6;
  const legs = full ? LEGS : LEGS.filter((l) => MARK_LEGS.has(l.id));

  return (
    <svg
      viewBox="0 0 120 84"
      width={size}
      height={size ? (size * 84) / 120 : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      overflow="visible"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title ? <title>{title}</title> : null}

      {/* Legs — each a group so the intro can articulate it from the hip */}
      {legs.map((l) => (
        <g
          key={l.id}
          data-leg={l.id}
          data-side={l.side}
          style={{
            transformBox: "view-box",
            transformOrigin: `${l.hip[0]}px ${l.hip[1]}px`,
          }}
        >
          <polyline
            data-part="limb"
            points={`${l.hip[0]},${l.hip[1]} ${l.knee[0]},${l.knee[1]} ${l.foot[0]},${l.foot[1]}`}
            stroke="currentColor"
            strokeWidth={sw}
          />
          {full && (
            <>
              <circle data-part="pin" cx={l.knee[0]} cy={l.knee[1]} r={1.9} fill="var(--color-surface)" stroke="currentColor" strokeWidth={1.4} />
              <line data-part="foot" x1={l.foot[0] - 3} y1={GROUND} x2={l.foot[0] + 3} y2={GROUND} stroke="currentColor" strokeWidth={sw} />
            </>
          )}
        </g>
      ))}

      {/* Torch beam — dark until the Descent lights the lens */}
      {full && (
        <polygon data-beam points="55,60 65,60 86,79 34,79" fill="var(--color-lamp)" opacity={0} />
      )}

      {/* Chassis */}
      <rect
        x={38}
        y={37}
        width={44}
        height={25}
        rx={full ? 5 : 7}
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth={sw}
      />
      {full && (
        <>
          {/* panel seam + survey mast */}
          <line x1={44} y1={43} x2={51} y2={43} stroke="currentColor" strokeWidth={1.4} />
          <line x1={69} y1={43} x2={76} y2={43} stroke="currentColor" strokeWidth={1.4} />
          <line x1={73} y1={37} x2={73} y2={28} stroke="currentColor" strokeWidth={1.6} />
          <circle cx={73} cy={26} r={2.2} fill="currentColor" />
        </>
      )}

      {/* Torch lens */}
      <circle
        cx={LENS[0]}
        cy={LENS[1]}
        r={full ? 7.5 : 8.5}
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth={full ? 2.2 : 5}
      />
      <circle
        data-lens
        cx={LENS[0]}
        cy={LENS[1]}
        r={full ? 3.2 : 3.6}
        fill={lensLit ? "var(--color-lamp)" : "currentColor"}
      />
    </svg>
  );
}
