import { commands } from "@commands/index";
import { Vectors, Points, RGB, RGBA } from "@utils/types";

export async function fetchJSONAsObject<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const json: T = await response.json();
  return json;
}

export async function fetchHTMLAsFragment(
  url: string,
): Promise<DocumentFragment> {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const htmlText = await response.text();

  return document.createRange().createContextualFragment(htmlText);
}

export function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

export function createGestureThumbnail(pattern: Vectors): SVGSVGElement {
  const viewBoxWidth = 100;
  const viewBoxHeight = 100;

  const points: Points = pattern.reduce<Points>(
    (acc, [dx, dy]) => {
      const last = acc[acc.length - 1];
      acc.push({ x: last.x + dx, y: last.y + dy });
      return acc;
    },
    [{ x: 0, y: 0 }],
  );

  const svg = createSvgElement("svg", {
    preserveAspectRatio: "xMidYMid meet",
    viewBox: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
  });

  const group = createSvgElement("g");
  svg.append(group);

  const gesturePath = createCatmullRomSVGPath(points);
  gesturePath.classList.add("gl-thumbnail-trail");

  const arrow = createSvgElement("path", { d: "M0,-7 L14,0 L0,7 z" });
  arrow.classList.add("gl-thumbnail-arrow");
  arrow.style.setProperty(
    "offset-path",
    `path('${gesturePath.getAttribute("d") ?? ""}')`,
  );

  group.append(gesturePath, arrow);

  svg.style.cssText = "position:absolute;visibility:hidden;";
  document.body.appendChild(svg);
  const bbox = gesturePath.getBBox();
  document.body.removeChild(svg);
  svg.style.cssText = "";

  const scale =
    Math.min(viewBoxWidth / bbox.width, viewBoxHeight / bbox.height) * 0.75;
  let translateX =
    -bbox.x * scale + viewBoxWidth / 2 - (bbox.width * scale) / 2;
  let translateY =
    -bbox.y * scale + viewBoxHeight / 2 - (bbox.height * scale) / 2;

  group.setAttribute(
    "transform",
    `translate(${translateX},${translateY}) scale(${scale})`,
  );

  const pathLength = gesturePath.getTotalLength();
  svg.style.setProperty("--pathLength", pathLength.toString());
  svg.style.setProperty("--pathScale", scale.toString());

  return svg;
}

export function createCatmullRomSVGPath(
  points: Points,
  alpha = 0.5,
): SVGPathElement {
  if (points.length < 2)
    throw new Error("Need at least two points to create a path");

  let d = `M${points[0].x},${points[0].y} C`;
  const n = points.length - 1;

  for (let i = 0; i < n; i++) {
    const p0 = points[i - 1] ?? points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const d1 = Math.hypot(p0.x - p1.x, p0.y - p1.y);
    const d2 = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const d3 = Math.hypot(p2.x - p3.x, p2.y - p3.y);

    const d1a = d1 ** alpha,
      d1a2 = d1a ** 2;
    const d2a = d2 ** alpha,
      d2a2 = d2a ** 2;
    const d3a = d3 ** alpha,
      d3a2 = d3a ** 2;

    const A = 2 * d1a2 + 3 * d1a * d2a + d2a2;
    const B = 2 * d3a2 + 3 * d3a * d2a + d2a2;

    const N = 1 / (3 * d1a * (d1a + d2a) || 1);
    const M = 1 / (3 * d3a * (d3a + d2a) || 1);

    let x1 = (-d2a2 * p0.x + A * p1.x + d1a2 * p2.x) * N;
    let y1 = (-d2a2 * p0.y + A * p1.y + d1a2 * p2.y) * N;

    let x2 = (d3a2 * p1.x + B * p2.x - d2a2 * p3.x) * M;
    let y2 = (d3a2 * p1.y + B * p2.y - d2a2 * p3.y) * M;

    if (!x1 && !y1) ({ x: x1, y: y1 } = p1);
    if (!x2 && !y2) ({ x: x2, y: y2 } = p2);

    d += ` ${x1},${y1},${x2},${y2},${p2.x},${p2.y}`;
  }

  return createSvgElement("path", { d });
}

export function clamp(number: number, min: number, max: number): number {
  return Math.min(Math.max(number, min), max);
}

export function rgbToHSV(r: number, g: number, b: number): RGB {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

export function RGBAToHexA(r: number, g: number, b: number, a: number): string {
  const arr = [r, g, b, Math.round(a * 255)].map((v) =>
    v.toString(16).padStart(2, "0"),
  );
  return `#${arr.join("")}`;
}

export function HexAToRGBA(hex: string): RGBA {
  if (hex[0] === "#") hex = hex.slice(1);
  const bigint = parseInt(hex, 16);
  return [
    (bigint >> 24) & 255,
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    Math.round(((bigint & 255) / 255) * 100) / 100,
  ];
}

export const COMMAND_ITEMS = Object.entries(commands).map(([name, def]) => ({
  command: name,
  settings: def.defaults,
  group: def.group,
  permissions: def.permissions,
}));

export const COMMAND_SETTING_TEMPLATES = fetchHTMLAsFragment(
  "/options/components/command-setting-templates.html",
);
