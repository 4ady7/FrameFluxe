const POSTER_W = 600;
const POSTER_H = 900;
const PRINT_SCALES = {
  4: { scale: 4, width: 2400, height: 3600, inches: "8×12 in", dpi: 300 },
  8: { scale: 8, width: 4800, height: 7200, inches: "16×24 in", dpi: 300 },
};

// Font families keyed by letterform language, with the weights actually loaded
// in index.html so we never fall back to a synthesised face.
const FONT_FAMILIES = {
  "Playfair Display": { weights: [400, 500, 700, 900], italic: true },
  "Cormorant Garamond": { weights: [400, 500, 600], italic: true },
  Cinzel: { weights: [400, 500, 700, 900], italic: false },
  "Roboto Slab": { weights: [100, 300, 400, 700, 900], italic: false },
  Jost: { weights: [200, 300, 400, 500, 700], italic: false },
  "Space Grotesk": { weights: [300, 400, 500, 700], italic: false },
  Oswald: { weights: [200, 300, 400, 500, 700], italic: false },
  Archivo: { weights: [100, 300, 400, 700, 900], italic: false },
  "Saira Stencil One": { weights: [400], italic: false },
  Caveat: { weights: [400, 500, 600, 700], italic: false },
  "IBM Plex Mono": { weights: [400, 600], italic: false },
  "IBM Plex Sans": { weights: [400, 500, 600], italic: false },
};

const LETTERFORM_FAMILY = {
  "classical-serif": "Playfair Display",
  "slab-serif": "Roboto Slab",
  "geometric-sans": "Jost",
  grotesque: "Space Grotesk",
  condensed: "Oswald",
  extended: "Archivo",
  "hand-lettered": "Caveat",
  distressed: "Cinzel",
  "technical-stencil": "Saira Stencil One",
};

const WEIGHT_VALUE = { hairline: 100, light: 300, regular: 400, bold: 700, black: 900 };

const TRACKING_EM = { tight: -0.035, normal: 0, wide: 0.14 };

// Each quote style carries its own face, slant, and size relationship to the title.
const QUOTE_STYLE_FACE = {
  "editorial-italic": { family: "Cormorant Garamond", italic: true, weight: 500, ratio: 0.34, min: 15, lead: 1.45 },
  caption: { family: "IBM Plex Sans", italic: false, weight: 500, ratio: 0.26, min: 12, lead: 1.55, upper: true, track: 0.08 },
  "cinematic-subtitle": { family: "Space Grotesk", italic: false, weight: 400, ratio: 0.3, min: 14, lead: 1.5 },
  typewriter: { family: "IBM Plex Mono", italic: false, weight: 400, ratio: 0.26, min: 12, lead: 1.6 },
  handwritten: { family: "Caveat", italic: false, weight: 600, ratio: 0.42, min: 18, lead: 1.35 },
};

function snapWeight(family, requested) {
  const meta = FONT_FAMILIES[family];
  if (!meta) {
    return requested;
  }
  return meta.weights.reduce(
    (best, w) => (Math.abs(w - requested) < Math.abs(best - requested) ? w : best),
    meta.weights[0]
  );
}

function cssFont(family, weight, size, italic) {
  const slant = italic && FONT_FAMILIES[family]?.italic ? "italic " : "";
  return `${slant}${weight} ${Math.round(size)}px "${family}", sans-serif`;
}

const LETTER_SPACING_SUPPORTED =
  typeof CanvasRenderingContext2D !== "undefined" &&
  "letterSpacing" in CanvasRenderingContext2D.prototype;

/**
 * Title and quote faces resolved from Visual DNA. Genre is deliberately absent:
 * it informs the DNA upstream but never selects a face here.
 */
function titleFace(dna) {
  const dir = dna.typography?.title || {};
  const letterforms = dir.letterforms || "grotesque";
  const family = LETTERFORM_FAMILY[letterforms] || "Space Grotesk";
  return {
    family,
    weight: snapWeight(family, WEIGHT_VALUE[dir.weight] ?? 400),
    italic: false,
    tracking: TRACKING_EM[dir.tracking] ?? 0,
    letterforms,
    case: dir.case || "uppercase",
    structure: dir.structure || "solid",
    placement: dir.placement || "centered",
  };
}

function quoteFace(dna) {
  const dir = dna.typography?.quote || {};
  const style = dir.style || "editorial-italic";
  const face = QUOTE_STYLE_FACE[style] || QUOTE_STYLE_FACE["editorial-italic"];
  return {
    ...face,
    style,
    weight: snapWeight(face.family, face.weight),
    legibility: dir.legibility || "scrim",
    placement: dir.placement || "below-title",
  };
}

/**
 * Ask the browser for the exact faces this DNA needs. Resolves to true when a
 * font arrived that was not previously available, meaning a redraw is worthwhile.
 */
function ensureTypeFaces(dna) {
  if (typeof document === "undefined" || !document.fonts || !document.fonts.load) {
    return Promise.resolve(false);
  }
  const title = titleFace(dna);
  const quote = quoteFace(dna);
  const specs = [
    cssFont(title.family, title.weight, 48, false),
    cssFont(quote.family, quote.weight, 16, quote.italic),
  ];
  const missing = specs.filter((s) => {
    try {
      return !document.fonts.check(s);
    } catch (err) {
      return true;
    }
  });
  if (!missing.length) {
    return Promise.resolve(false);
  }
  return Promise.all(missing.map((s) => document.fonts.load(s).catch(() => null))).then(() => true);
}

function applyCase(text, mode) {
  const raw = String(text || "");
  if (mode === "uppercase") {
    return raw.toUpperCase();
  }
  if (mode === "lowercase") {
    return raw.toLowerCase();
  }
  if (mode === "title") {
    return raw.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  if (mode === "mixed") {
    return raw
      .split(/\s+/)
      .map((w, i) => (i % 2 === 0 ? w.toUpperCase() : w.toLowerCase()))
      .join(" ");
  }
  return raw;
}

function hexToRgb(hex) {
  const n = String(hex || "#000000").replace("#", "");
  if (n.length !== 6) {
    return [0, 0, 0];
  }
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ];
}

function nx(n) {
  return n * POSTER_W;
}

function ny(n) {
  return n * POSTER_H;
}

function styleCtx(ctx, face, size) {
  ctx.font = cssFont(face.family, face.weight, size, face.italic);
  const track = Number(face.tracking ?? face.track ?? 0);
  if (LETTER_SPACING_SUPPORTED) {
    ctx.letterSpacing = `${track}em`;
  }
}

function measureStyled(ctx, face, size, str) {
  styleCtx(ctx, face, size);
  let w = ctx.measureText(str).width;
  if (!LETTER_SPACING_SUPPORTED) {
    const track = Number(face.tracking ?? face.track ?? 0);
    w += track * size * Math.max(0, str.length - 1);
  }
  return w;
}

/**
 * Character-break a fragment that still cannot fit, adding a hyphen only when
 * the fragment does not already end on one.
 */
function breakByCharacters(ctx, face, size, word, maxWidth) {
  const chunks = [];
  let chunk = "";
  for (const ch of word) {
    const next = chunk + ch;
    const probe = /[-–—]$/.test(next) ? next : `${next}-`;
    if (chunk && measureStyled(ctx, face, size, probe) > maxWidth) {
      chunks.push(/[-–—]$/.test(chunk) ? chunk : `${chunk}-`);
      chunk = ch;
    } else {
      chunk = next;
    }
  }
  if (chunk) {
    chunks.push(chunk);
  }
  return chunks.length ? chunks : [word];
}

/**
 * Split a word that can never fit on one line into chunks that can.
 * Prefer existing hyphens (RENT-A-MANSION → RENT-A- / MANSION) so titles do
 * not character-break in the middle of a segment.
 */
function breakLongWord(ctx, face, size, word, maxWidth) {
  const parts = String(word).split(/(?<=[-–—])/).filter(Boolean);
  if (parts.length > 1) {
    const packed = [];
    for (const part of parts) {
      if (measureStyled(ctx, face, size, part) > maxWidth) {
        packed.push(...breakByCharacters(ctx, face, size, part, maxWidth));
      } else {
        packed.push(part);
      }
    }
    return packed.length ? packed : [word];
  }
  return breakByCharacters(ctx, face, size, word, maxWidth);
}

function wrapStyled(ctx, face, size, text, maxWidth, maxLines) {
  const raw = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!raw.length) {
    return [];
  }
  // Pre-split any single word that is wider than the whole safe area.
  const words = [];
  for (const word of raw) {
    if (measureStyled(ctx, face, size, word) > maxWidth) {
      words.push(...breakLongWord(ctx, face, size, word, maxWidth));
    } else {
      words.push(word);
    }
  }
  const lines = [];
  let current = "";
  for (let i = 0; i < words.length; i += 1) {
    const glue = /[-–—]$/.test(current) ? "" : " ";
    const next = current ? `${current}${glue}${words[i]}` : words[i];
    const isLastSlot = lines.length === maxLines - 1;
    if (measureStyled(ctx, face, size, next) > maxWidth && current) {
      if (isLastSlot) {
        // Rejoin without reintroducing spaces inside a hard-broken word.
        let clipped = [current]
          .concat(words.slice(i))
          .reduce((acc, part) => (acc && /[-–—]$/.test(acc) ? acc + part : acc ? `${acc} ${part}` : part), "")
          .replace(/-\s+/g, "-");
        while (
          clipped.length > 1 &&
          measureStyled(ctx, face, size, `${clipped}…`) > maxWidth
        ) {
          clipped = clipped.slice(0, -1).trim();
        }
        lines.push(`${clipped}…`);
        return lines;
      }
      lines.push(current);
      current = words[i];
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

/**
 * Title scale is derived from length and the available safe width. Long titles
 * break to more lines before they are allowed to shrink below a legible floor.
 */
function fitTitleBlock(ctx, face, text, maxWidth, maxSize, minSize) {
  for (let maxLines = 1; maxLines <= 3; maxLines += 1) {
    // A single long word can never wrap, so allow it to scale down further.
    const floor = maxLines === 3 ? minSize : Math.max(minSize, maxSize * (maxLines === 1 ? 0.62 : 0.46));
    for (let size = maxSize; size >= floor; size -= 2) {
      const lines = wrapStyled(ctx, face, size, text, maxWidth, maxLines);
      if (lines.length > maxLines) {
        continue;
      }
      const widest = Math.max(...lines.map((l) => measureStyled(ctx, face, size, l)), 0);
      if (widest <= maxWidth && !lines.some((l) => l.endsWith("…"))) {
        return { lines, size };
      }
    }
  }
  const lines = wrapStyled(ctx, face, minSize, text, maxWidth, 3);
  return { lines, size: minSize };
}

/**
 * Resolve where the title and quote sit, based on the DNA placement decision and
 * the focal mass, so type lands in negative space rather than a fixed slot.
 * Returns an extended spec; titleSafe is updated so procedural marks stay clear.
 */
function typeLayout(dna, spec, plan) {
  if (plan) {
    return window.FrameFluxSystems.specFromPlan(spec, plan);
  }
  const face = titleFace(dna);
  const quote = quoteFace(dna);
  const focalY = Number(dnaComp(dna).focalY ?? 0.42);
  let placement = face.placement;

  // Never stack the title on top of the focal mass.
  if (placement === "centered" && Math.abs(focalY - 0.5) < 0.12) {
    placement = focalY <= 0.5 ? "lower-third" : "upper-third";
  }

  const isSplitColumn = spec.id === "split-editorial";
  const bandFor = (id) => {
    if (id === "upper-third") return 0.19;
    if (id === "lower-third") return 0.79;
    if (id === "split") return focalY <= 0.5 ? 0.76 : 0.22;
    return 0.5;
  };
  const titleY = bandFor(placement);

  const align = isSplitColumn ? "left" : spec.align;
  const titleX = isSplitColumn ? 0.07 : align === "center" ? 0.5 : 0.08;
  const halfH = placement === "centered" ? 0.16 : 0.13;

  let quoteY;
  if (quote.placement === "bottom-anchored") {
    quoteY = 0.9;
  } else if (quote.placement === "focal-adjacent") {
    quoteY = Math.min(0.9, Math.max(0.12, focalY + (focalY > titleY ? -0.24 : 0.24)));
  } else {
    quoteY = null; // below-title, resolved against the measured title block
  }

  return {
    ...spec,
    align,
    title: { x: titleX, y: titleY },
    titleSafe: {
      x: Math.max(0.02, titleX - (align === "center" ? 0.42 : 0.04)),
      y: Math.max(0.02, titleY - halfH),
      w: isSplitColumn ? 0.46 : align === "center" ? 0.84 : 0.86,
      h: halfH * 2,
    },
    quoteAnchor: quoteY,
    titlePlacement: placement,
  };
}

function layoutSpec(layout) {
  const id = layout || "centered";
  if (id === "off-center-top") {
    return {
      id,
      align: "left",
      title: { x: 0.08, y: 0.18 },
      crop: { x: 0.5, y: 0.62, scale: 1.18 },
      inset: 0,
      split: 0,
      titleSafe: { x: 0.04, y: 0.08, w: 0.72, h: 0.28 },
    };
  }
  if (id === "off-center-bottom") {
    return {
      id,
      align: "left",
      title: { x: 0.08, y: 0.78 },
      crop: { x: 0.5, y: 0.36, scale: 1.16 },
      inset: 0,
      split: 0,
      titleSafe: { x: 0.04, y: 0.66, w: 0.78, h: 0.28 },
    };
  }
  if (id === "split-editorial") {
    return {
      id,
      align: "left",
      title: { x: 0.07, y: 0.22 },
      crop: { x: 0.68, y: 0.48, scale: 1.28 },
      inset: 0,
      split: 0.38,
      titleSafe: { x: 0.03, y: 0.1, w: 0.4, h: 0.55 },
    };
  }
  if (id === "frame-inset") {
    return {
      id,
      align: "center",
      title: { x: 0.5, y: 0.76 },
      crop: { x: 0.5, y: 0.44, scale: 1.08 },
      inset: 0.055,
      split: 0,
      titleSafe: { x: 0.12, y: 0.64, w: 0.76, h: 0.26 },
    };
  }
  return {
    id: "centered",
    align: "center",
    title: { x: 0.5, y: 0.5 },
    crop: { x: 0.5, y: 0.48, scale: 1.12 },
    inset: 0,
    split: 0,
    titleSafe: { x: 0.12, y: 0.36, w: 0.76, h: 0.3 },
  };
}

function dnaPalette(dna) {
  return dna.palette || {};
}

function dnaProc(dna) {
  return dna.procedural || {};
}

function dnaComp(dna) {
  return dna.composition || {};
}

function dnaCinematic(dna) {
  return dna.cinematic || {};
}

function dnaSemantic(dna) {
  return dna.semantic || {};
}

function dnaLight(dna) {
  return dna.lighting || {};
}

function grammarFamily(dna) {
  return dnaSemantic(dna).grammarFamily || "drama";
}

function isTechFamily(family) {
  return family === "thriller" || family === "scifi" || family === "horror";
}

function isLightGround(dna) {
  const tone = dnaSemantic(dna).groundTone;
  if (tone === "light") {
    return true;
  }
  if (tone === "dark") {
    return false;
  }
  return relativeLuminance(hexToRgb(dnaPalette(dna).background || "#111111")) > 0.42;
}

function inRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function lightOrigin(dna, seed) {
  const base = Number(dnaLight(dna).direction ?? dna.lightDirection ?? 0.35);
  // Seed varies lighting direction slightly without changing Visual DNA.
  const wobble = ((seed % 17) / 17 - 0.5) * 0.12;
  const t = Math.max(0, Math.min(1, base + wobble));
  return { x: 0.12 + t * 0.76, y: 0.1 + ((seed % 11) / 11) * 0.22, t };
}

function materialEmphasis(dna, seed) {
  const base = Number(dnaProc(dna).materialEmphasis ?? 0.7);
  return Math.max(0.35, Math.min(1, base + ((seed % 9) / 9 - 0.5) * 0.08));
}

function anchorScale(dna, seed) {
  const base = Number(dnaComp(dna).anchorScale ?? 0.92);
  return Math.max(0.7, Math.min(1.2, base + ((seed % 13) / 13 - 0.5) * 0.08));
}

function protectionWeight(u, v, dna, spec) {
  let w = 1;
  if (spec.titleSafe && inRect(u, v, spec.titleSafe)) {
    w *= 0.12;
  }
  if (spec.quoteSafe && inRect(u, v, spec.quoteSafe)) {
    w *= 0.12;
  }
  const fx = Number(dna.anchors?.focalX ?? dnaComp(dna).focalX ?? 0.5);
  const fy = Number(dna.anchors?.focalY ?? dnaComp(dna).focalY ?? 0.42);
  const d = Math.hypot(u - fx, (v - fy) * 1.15);
  if (d < 0.14) {
    w *= 0.18 + d / 0.14 * 0.5;
  }
  return w;
}

function drawContrastBackdrop(p, centerY, blockHeight, contrast) {
  const ctx = p.drawingContext;
  const padding = 44;
  const top = centerY - blockHeight / 2 - padding;
  const bottom = centerY + blockHeight / 2 + padding;
  const mid = 0.42 + Number(contrast || 0.75) * 0.4;

  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.28, `rgba(0,0,0,${mid})`);
  gradient.addColorStop(0.72, `rgba(0,0,0,${mid})`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, top, p.width, bottom - top);
  ctx.restore();
}

function drawMaterialGrain(p, dna, seed, intensity) {
  const material = dnaSemantic(dna).material || "paper";
  const texture = dnaSemantic(dna).texture || "grainy";
  const pal = dnaPalette(dna);
  const ink = hexToRgb(pal.text || pal.ink || "#1a1410");
  const bg = hexToRgb(pal.background);
  p.randomSeed(seed + 401);
  p.noiseSeed(seed + 401);

  const papery = ["paper", "cardstock", "linen", "fabric", "ink", "pressed-leaves"].includes(material);
  const hide = ["leather", "wood", "fur", "bark", "bone"].includes(material);
  const metallic = ["metal", "brass", "foil", "rust"].includes(material);
  const glassy = ["glass", "plastic"].includes(material);
  const stony = ["stone", "granite", "slate"].includes(material);

  const count = papery ? 3400 : hide ? 2200 : metallic ? 1600 : glassy ? 900 : stony ? 2000 : 1800;
  const alphaBase = 8 + intensity * 16;
  for (let i = 0; i < count; i += 1) {
    const x = p.random(POSTER_W);
    const y = p.random(POSTER_H);
    const n = p.noise(x * 0.018, y * 0.018);
    let a = alphaBase * (0.35 + n);
    let w = 1.1;
    let h = 1.1;
    if (metallic || texture === "scratched") {
      w = p.random(2, 11);
      h = 0.7;
      a *= 0.7;
    } else if (papery || texture === "fibrous") {
      w = 0.7 + n;
      h = p.random(2, 9);
      a *= papery ? 1.15 : 1;
    } else if (material === "smoke" || material === "water") {
      a *= 0.45;
      w = p.random(1.5, 4);
      h = w;
    } else if (hide) {
      w = p.random(1.2, 3.2);
      h = p.random(0.8, 2.4);
    }
    p.noStroke();
    const speck = isLightGround(dna) ? ink : [255, 255, 255];
    p.fill(speck[0], speck[1], speck[2], a);
    p.rect(x, y, w, h);
  }

  if (papery) {
    p.noStroke();
    for (let i = 0; i < 7; i += 1) {
      const cx = p.random(POSTER_W);
      const cy = p.random(POSTER_H);
      p.fill(...ink, 8 + intensity * 10);
      p.ellipse(cx, cy, p.random(40, 120), p.random(18, 48));
    }
    // Edge wear
    p.stroke(...ink, 18);
    p.strokeWeight(6);
    p.noFill();
    p.rect(8, 8, POSTER_W - 16, POSTER_H - 16);
  }

  if (material === "leather" || material === "wood" || material === "bark") {
    p.noFill();
    p.stroke(...ink, 22);
    p.strokeWeight(1.1);
    for (let i = 0; i < 9; i += 1) {
      let x = p.random(POSTER_W);
      let y = p.random(POSTER_H);
      p.beginShape();
      for (let s = 0; s < 18; s += 1) {
        p.vertex(x, y);
        x += (p.noise(i, s * 0.2) - 0.5) * 14;
        y += 6;
      }
      p.endShape();
    }
  }

  if (material === "brass" || material === "foil") {
    p.noStroke();
    for (let i = 0; i < 14; i += 1) {
      p.fill(...hexToRgb(pal.highlight || pal.accent), 16);
      p.ellipse(p.random(POSTER_W), p.random(POSTER_H), p.random(12, 40), p.random(4, 14));
    }
  }

  if (glassy) {
    p.noStroke();
    p.fill(255, 255, 255, 12);
    p.quad(POSTER_W * 0.1, 0, POSTER_W * 0.22, 0, POSTER_W * 0.08, POSTER_H, 0, POSTER_H);
  }
}

function drawDirectionalLight(p, dna, seed, fx, fy) {
  const pal = dnaPalette(dna);
  const cine = dnaCinematic(dna);
  const lighting = cine.lighting || "chiaroscuro";
  const shadow = Number(dnaLight(dna).shadowDensity ?? dna.shadowDensity ?? 0.55);
  const origin = lightOrigin(dna, seed);
  const accent = hexToRgb(pal.accent);
  const secondary = hexToRgb(pal.secondary);
  const highlight = hexToRgb(pal.highlight || pal.accent);

  let glow = secondary;
  let glowAlpha = 0.42;
  const lightGround = isLightGround(dna);
  if (lighting === "neon") {
    glow = accent;
    glowAlpha = 0.58;
  } else if (lighting === "golden-hour" || lighting === "coastal-haze" || lighting === "bloom") {
    glow = highlight;
    glowAlpha = lightGround ? 0.38 : 0.5;
  } else if (lighting === "high-key" || lighting === "theatrical") {
    glow = highlight;
    glowAlpha = 0.55;
  } else if (lighting === "domestic-warm" || lighting === "window-light") {
    glow = highlight;
    glowAlpha = 0.4;
  } else if (lighting === "moonlit" || lighting === "backlit") {
    glow = secondary;
    glowAlpha = 0.48;
  } else if (lighting === "harsh" || lighting === "hard-sun" || lighting === "shaft") {
    glow = highlight;
    glowAlpha = 0.35;
  } else if (lighting === "rim") {
    glow = accent;
    glowAlpha = 0.32;
  }

  p.drawingContext.save();
  const key = p.drawingContext.createRadialGradient(
    nx(origin.x),
    ny(origin.y),
    10,
    nx(fx),
    ny(fy),
    POSTER_W * (0.55 + (1 - shadow) * 0.25)
  );
  key.addColorStop(0, `rgba(${glow[0]},${glow[1]},${glow[2]},${glowAlpha})`);
  key.addColorStop(1, "rgba(0,0,0,0)");
  p.drawingContext.fillStyle = key;
  p.drawingContext.fillRect(0, 0, POSTER_W, POSTER_H);

  if (lighting === "coastal-haze" || lighting === "bloom") {
    const haze = p.drawingContext.createLinearGradient(0, 0, 0, POSTER_H);
    haze.addColorStop(0, `rgba(${highlight[0]},${highlight[1]},${highlight[2]},0.18)`);
    haze.addColorStop(0.55, "rgba(255,255,255,0)");
    haze.addColorStop(1, `rgba(${secondary[0]},${secondary[1]},${secondary[2]},0.12)`);
    p.drawingContext.fillStyle = haze;
    p.drawingContext.fillRect(0, 0, POSTER_W, POSTER_H);
  }

  if (lighting === "high-key") {
    p.drawingContext.fillStyle = "rgba(255,255,255,0.12)";
    p.drawingContext.fillRect(0, 0, POSTER_W, POSTER_H);
  }

  const shadeStrength = lightGround || lighting === "high-key" ? 0.08 + shadow * 0.12 : 0.25 + shadow * 0.45;
  const shade = p.drawingContext.createRadialGradient(
    nx(1 - origin.x),
    ny(Math.min(0.95, fy + 0.28)),
    20,
    nx(fx),
    ny(fy),
    POSTER_H * 0.75
  );
  const shadeRgb = lightGround ? hexToRgb(pal.text || pal.ink || "#1a1410") : [0, 0, 0];
  shade.addColorStop(0, `rgba(${shadeRgb[0]},${shadeRgb[1]},${shadeRgb[2]},${shadeStrength})`);
  shade.addColorStop(1, "rgba(0,0,0,0)");
  p.drawingContext.fillStyle = shade;
  p.drawingContext.fillRect(0, 0, POSTER_W, POSTER_H);
  p.drawingContext.restore();
}

function drawMountainAnchor(p, metaphor, scale, emphasis, primary, secondary, accent, bg) {
  p.rectMode(p.CORNER);
  const alpine = metaphor === "alpine-peak";
  const j = (n) => (p.noise(n * 0.37) - 0.5) * 0.05;
  const far = alpine
    ? [-0.46 + j(1), 0.23, -0.22 + j(2), -0.02, 0.08 + j(3), 0.23]
    : [-0.52 + j(1), 0.26, -0.28 + j(2), 0.04, -0.02 + j(3), 0.26];
  const mid = alpine
    ? [-0.26 + j(4), 0.23, -0.04 + j(5), -0.3, 0.22 + j(6), -0.08, 0.34 + j(7), 0.23]
    : [-0.34 + j(4), 0.25, -0.12 + j(5), -0.2, 0.1 + j(6), -0.04, 0.28 + j(7), 0.25];
  const near = alpine
    ? [-0.08 + j(8), 0.23, 0.1 + j(9), -0.14, 0.3 + j(10), 0.06, 0.48 + j(11), 0.23]
    : [0.0 + j(8), 0.25, 0.18 + j(9), -0.08, 0.36 + j(10), 0.08, 0.54 + j(11), 0.25];
  const drawMass = (pts, fillCol, alpha, strokeCol) => {
    p.noStroke();
    p.fill(...fillCol, alpha * emphasis);
    p.beginShape();
    for (let i = 0; i < pts.length; i += 2) {
      p.vertex(POSTER_W * pts[i] * scale, POSTER_H * pts[i + 1] * scale);
    }
    p.endShape(p.CLOSE);
    p.noFill();
    p.stroke(...strokeCol, 140 * emphasis);
    p.strokeWeight(alpine ? 1.8 : 1.4);
    p.beginShape();
    for (let i = 0; i < pts.length - 2; i += 2) {
      p.vertex(POSTER_W * pts[i] * scale, POSTER_H * pts[i + 1] * scale);
    }
    p.endShape();
  };
  drawMass(far, secondary, 120, secondary);
  drawMass(mid, primary, 205, accent);
  drawMass(near, accent, 110, primary);
  p.stroke(...bg, 70 * emphasis);
  p.strokeWeight(1);
  p.line(POSTER_W * mid[2] * scale, POSTER_H * mid[3] * scale, POSTER_W * (mid[2] + 0.05) * scale, POSTER_H * 0.2 * scale);
  p.line(POSTER_W * near[2] * scale, POSTER_H * near[3] * scale, POSTER_W * (near[2] + 0.04) * scale, POSTER_H * 0.18 * scale);
}

function drawCanineAnchor(p, metaphor, scale, emphasis, primary, secondary, accent, bg, fx) {
  const facing = fx < 0.5 ? 1 : -1;
  p.push();
  p.scale(facing, 1);
  p.noStroke();
  p.fill(...primary, 210 * emphasis);
  p.beginShape();
  p.vertex(POSTER_W * -0.18 * scale, POSTER_H * 0.16 * scale);
  p.vertex(POSTER_W * -0.16 * scale, POSTER_H * -0.02 * scale);
  p.vertex(POSTER_W * -0.02 * scale, POSTER_H * -0.08 * scale);
  p.vertex(POSTER_W * 0.12 * scale, POSTER_H * -0.04 * scale);
  p.vertex(POSTER_W * 0.22 * scale, POSTER_H * 0.02 * scale);
  p.vertex(POSTER_W * 0.18 * scale, POSTER_H * 0.08 * scale);
  p.vertex(POSTER_W * 0.08 * scale, POSTER_H * 0.06 * scale);
  p.vertex(POSTER_W * 0.04 * scale, POSTER_H * 0.18 * scale);
  p.vertex(POSTER_W * -0.04 * scale, POSTER_H * 0.18 * scale);
  p.vertex(POSTER_W * -0.08 * scale, POSTER_H * 0.08 * scale);
  p.endShape(p.CLOSE);
  p.fill(...secondary, 220 * emphasis);
  p.triangle(
    POSTER_W * -0.02 * scale,
    POSTER_H * -0.08 * scale,
    POSTER_W * -0.08 * scale,
    POSTER_H * -0.22 * scale,
    POSTER_W * 0.06 * scale,
    POSTER_H * -0.1 * scale
  );
  p.fill(...accent, 180 * emphasis);
  p.triangle(
    POSTER_W * 0.12 * scale,
    POSTER_H * -0.04 * scale,
    POSTER_W * 0.28 * scale,
    POSTER_H * -0.02 * scale,
    POSTER_W * 0.18 * scale,
    POSTER_H * 0.06 * scale
  );
  p.fill(...bg, 200);
  p.ellipse(POSTER_W * 0.08 * scale, POSTER_H * -0.01 * scale, POSTER_W * 0.028 * scale, POSTER_H * 0.02 * scale);
  p.stroke(...accent, 140 * emphasis);
  p.strokeWeight(2);
  p.noFill();
  p.beginShape();
  p.vertex(POSTER_W * -0.16 * scale, POSTER_H * 0.04 * scale);
  p.quadraticVertex(
    POSTER_W * -0.32 * scale,
    POSTER_H * 0.0 * scale,
    POSTER_W * -0.28 * scale,
    POSTER_H * 0.14 * scale
  );
  p.endShape();
  p.pop();
  if (metaphor === "animal-tracks") {
    p.noStroke();
    p.fill(...accent, 140 * emphasis);
    for (let i = 0; i < 5; i += 1) {
      const tx = POSTER_W * (-0.22 + i * 0.1) * scale;
      const ty = POSTER_H * (0.2 + (i % 2) * 0.03) * scale;
      p.ellipse(tx, ty, 10 * scale, 14 * scale);
      p.ellipse(tx - 6 * scale, ty - 8 * scale, 4 * scale, 5 * scale);
      p.ellipse(tx + 5 * scale, ty - 8 * scale, 4 * scale, 5 * scale);
    }
  }
}

function drawBotanicalAnchor(p, metaphor, scale, emphasis, primary, secondary, accent, bg) {
  const pressed = metaphor === "botanical-press";
  const fringe = metaphor === "forest-fringe";
  p.stroke(...primary, 220 * emphasis);
  p.strokeWeight(pressed ? 1.6 : 2.2);
  p.noFill();
  const stems = fringe ? 7 : pressed ? 5 : 6;
  for (let i = 0; i < stems; i += 1) {
    const lean = (i - (stems - 1) / 2) * (pressed ? 0.28 : 0.18);
    let x = POSTER_W * lean * 0.12 * scale;
    let y = POSTER_H * 0.18 * scale;
    p.beginShape();
    const steps = pressed ? 14 : 22;
    for (let s = 0; s < steps; s += 1) {
      p.vertex(x, y);
      const n = p.noise(i * 0.4, s * 0.16);
      x += (n - 0.5 + lean) * (pressed ? 7 : 9) * scale;
      y -= (pressed ? 8 : 11) * scale;
    }
    p.endShape();
    p.stroke(...(i % 2 ? accent : secondary), 190 * emphasis);
    p.strokeWeight(pressed ? 1.3 : 1.7);
    const leaflets = pressed ? 4 : 6;
    for (let L = 1; L <= leaflets; L += 1) {
      const t = L / (leaflets + 1);
      const lx = POSTER_W * lean * 0.12 * scale + (p.noise(i, L) - 0.5) * 20 * scale;
      const ly = POSTER_H * (0.16 - t * 0.28) * scale;
      const dir = L % 2 === 0 ? 1 : -1;
      p.beginShape();
      p.vertex(lx, ly);
      p.quadraticVertex(
        lx + dir * 18 * scale,
        ly - 10 * scale,
        lx + dir * 6 * scale,
        ly - 22 * scale
      );
      p.endShape();
      if (!pressed) {
        p.fill(...(L % 2 ? accent : secondary), 70 * emphasis);
        p.noStroke();
        p.beginShape();
        p.vertex(lx, ly);
        p.quadraticVertex(
          lx + dir * 18 * scale,
          ly - 10 * scale,
          lx + dir * 6 * scale,
          ly - 22 * scale
        );
        p.vertex(lx, ly - 4 * scale);
        p.endShape(p.CLOSE);
        p.noFill();
        p.stroke(...(i % 2 ? accent : secondary), 190 * emphasis);
        p.line(lx, ly, lx + dir * 14 * scale, ly - 8 * scale);
      }
    }
  }
  if (pressed) {
    p.noFill();
    p.stroke(...accent, 90 * emphasis);
    p.strokeWeight(1);
    p.rectMode(p.CENTER);
    p.rect(0, POSTER_H * 0.02 * scale, POSTER_W * 0.42 * scale, POSTER_H * 0.36 * scale);
  }
}

function drawNarrativeAnchor(p, dna, seed, fx, fy) {
  const pal = dnaPalette(dna);
  const semantic = dnaSemantic(dna);
  const metaphor = (() => {
    const anchor = semantic.narrativeAnchor || "";
    const visual = semantic.visualMetaphor || "";
    if (anchor && anchor !== "silhouette-threshold") {
      return anchor;
    }
    return visual || "silhouette-threshold";
  })();
  const material = semantic.material || "paper";
  const spatial = semantic.spatial || "isolated";
  const scale = anchorScale(dna, seed);
  const emphasis = materialEmphasis(dna, seed);
  const primary = hexToRgb(pal.primary);
  const secondary = hexToRgb(pal.secondary);
  const accent = hexToRgb(pal.accent);
  const bg = hexToRgb(pal.background);
  const cx = nx(fx);
  const cy = ny(fy);
  const origin = lightOrigin(dna, seed);

  p.randomSeed(seed + 77);
  p.noiseSeed(seed + 77);
  p.push();
  p.translate(cx, cy);

  // Soft contact shadow under the anchor.
  p.noStroke();
  p.fill(0, 0, 0, isLightGround(dna) ? 28 + emphasis * 18 : 70 + emphasis * 40);
  p.ellipse(12, POSTER_H * 0.12 * scale, POSTER_W * 0.28 * scale, POSTER_H * 0.04 * scale);

  const metalish = material === "metal" || material === "rust" || material === "plastic" || material === "brass" || material === "foil";
  const glassy = material === "glass" || material === "water" || material === "plastic";
  const papery = material === "paper" || material === "ink" || material === "film-stock" || material === "cardstock" || material === "linen";

  if (metaphor === "fractured-glass" || metaphor === "distorted-reflection") {
    // Dominant cracked pane — one clear glass object, not decorative sparkle.
    p.noStroke();
    p.fill(...secondary, glassy ? 70 : 100);
    p.rectMode(p.CENTER);
    p.rect(0, 0, POSTER_W * 0.46 * scale, POSTER_H * 0.34 * scale, 2);
    p.fill(...primary, 40);
    p.rect(-POSTER_W * 0.02 * scale, -POSTER_H * 0.01 * scale, POSTER_W * 0.42 * scale, POSTER_H * 0.3 * scale, 2);
    p.stroke(...accent, 170 * emphasis);
    p.strokeWeight(1.6);
    const shards = 9;
    for (let i = 0; i < shards; i += 1) {
      const a0 = (i / shards) * p.TWO_PI + p.random(-0.08, 0.08);
      const a1 = a0 + p.TWO_PI / shards * (0.45 + p.random() * 0.35);
      const r0 = POSTER_W * (0.06 + p.random() * 0.08) * scale;
      const r1 = POSTER_W * (0.16 + p.random() * 0.14) * scale;
      p.fill(...primary, glassy ? 45 : 75);
      p.beginShape();
      p.vertex(0, 0);
      p.vertex(Math.cos(a0) * r0, Math.sin(a0) * r1 * 0.75);
      p.vertex(Math.cos(a1) * r1, Math.sin(a1) * r0);
      p.endShape(p.CLOSE);
      p.stroke(...accent, 120);
      p.line(0, 0, Math.cos(a0) * r1 * 1.15, Math.sin(a0) * r1 * 1.15);
    }
    if (metaphor === "distorted-reflection") {
      p.noFill();
      p.stroke(...accent, 90);
      p.ellipse(0, 0, POSTER_W * 0.22 * scale, POSTER_H * 0.28 * scale);
    }
  } else if (metaphor === "eclipse" || metaphor === "orbital-system" || metaphor === "biological-cell" || metaphor === "signal") {
    const rings = metaphor === "orbital-system" ? 5 : metaphor === "biological-cell" ? 4 : 3;
    p.noFill();
    for (let i = 1; i <= rings; i += 1) {
      const t = i / rings;
      p.stroke(...(i === rings ? accent : secondary), (150 - i * 18) * emphasis);
      p.strokeWeight(metaphor === "signal" ? 1.3 : 2);
      p.ellipse(0, 0, POSTER_W * (0.16 + t * 0.5) * scale, POSTER_H * (0.1 + t * 0.34) * scale);
    }
    p.noStroke();
    p.fill(...(metaphor === "eclipse" ? bg : primary), metaphor === "eclipse" ? 230 : 180);
    p.circle(0, 0, POSTER_W * 0.22 * scale);
    if (metaphor === "eclipse") {
      p.fill(...accent, 50);
      p.circle(-POSTER_W * 0.04 * scale, -POSTER_H * 0.015 * scale, POSTER_W * 0.23 * scale);
      p.noFill();
      p.stroke(...accent, 120);
      p.strokeWeight(2);
      p.circle(0, 0, POSTER_W * 0.34 * scale);
    }
    if (metaphor === "orbital-system" || metaphor === "signal") {
      p.stroke(...accent, 170);
      p.strokeWeight(1.6);
      p.noFill();
      const ox = POSTER_W * 0.22 * scale;
      const oy = -POSTER_H * 0.07 * scale;
      p.circle(ox, oy, 16);
      p.line(0, 0, ox, oy);
      p.fill(...accent, 160);
      p.noStroke();
      p.circle(ox, oy, 6);
    }
  } else if (metaphor === "chaotic-key" || metaphor === "tangled-cords" || metaphor === "chandelier-cluster") {
    // Oversized comedy key — must read as a key fighting for space, not a door.
    p.rotate(-0.55);
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill(...primary, 230);
    p.circle(-POSTER_W * 0.18 * scale, 0, POSTER_W * 0.28 * scale);
    p.fill(...bg, 235);
    p.circle(-POSTER_W * 0.18 * scale, 0, POSTER_W * 0.14 * scale);
    p.fill(...hexToRgb(pal.highlight || pal.accent), 230);
    p.rect(POSTER_W * 0.08 * scale, 0, POSTER_W * 0.52 * scale, POSTER_H * 0.07 * scale, 6);
    const teeth = [0.18, 0.08, 0.22, 0.1, 0.16];
    for (let i = 0; i < teeth.length; i += 1) {
      p.fill(...(i % 2 ? secondary : accent), 230);
      p.rect(
        POSTER_W * (0.02 + i * 0.08) * scale,
        POSTER_H * (0.06 + (i % 2) * 0.02) * scale,
        POSTER_W * 0.055 * scale,
        POSTER_H * teeth[i] * scale,
        2
      );
    }
    p.noFill();
    p.stroke(...accent, 180);
    p.strokeWeight(5);
    p.circle(-POSTER_W * 0.18 * scale, 0, POSTER_W * 0.28 * scale);
    p.strokeWeight(2.6);
    for (let i = 0; i < 14; i += 1) {
      p.stroke(...(i % 2 ? accent : secondary), 170);
      p.strokeWeight(2 + (i % 4));
      let x = p.random(-POSTER_W * 0.36, POSTER_W * 0.4) * scale;
      let y = p.random(-POSTER_H * 0.22, POSTER_H * 0.24) * scale;
      p.beginShape();
      for (let s = 0; s < 20; s += 1) {
        p.vertex(x, y);
        x += Math.cos(s * 0.55 + i) * 12 * scale;
        y += Math.sin(s * 0.8 + i * 0.35) * 11 * scale;
      }
      p.endShape();
    }
    p.noStroke();
    for (let i = 0; i < 10; i += 1) {
      p.push();
      p.translate(p.random(-110, 120) * scale, p.random(-90, 100) * scale);
      p.rotate(p.random(-1, 1));
      p.fill(...hexToRgb(pal.highlight || pal.accent), 120);
      p.quad(-10, 0, 0, -22, 10, 0, 0, 12);
      p.pop();
    }
  } else if (metaphor === "coastal-compass" || metaphor === "compass-rose") {
    p.noStroke();
    p.fill(...hexToRgb(pal.highlight || pal.accent), 40);
    p.circle(POSTER_W * 0.06 * scale, -POSTER_H * 0.08 * scale, POSTER_W * 0.42 * scale);
    p.rectMode(p.CENTER);
    p.fill(...secondary, 170);
    p.rotate(0.12);
    p.rect(POSTER_W * 0.2 * scale, POSTER_H * 0.16 * scale, POSTER_W * 0.34 * scale, POSTER_H * 0.2 * scale);
    p.rotate(-0.12);
    p.stroke(...primary, 80);
    p.strokeWeight(1);
    p.line(POSTER_W * 0.08 * scale, POSTER_H * 0.1 * scale, POSTER_W * 0.32 * scale, POSTER_H * 0.14 * scale);
    p.line(POSTER_W * 0.1 * scale, POSTER_H * 0.16 * scale, POSTER_W * 0.3 * scale, POSTER_H * 0.19 * scale);
    p.noFill();
    p.stroke(...primary, 220);
    p.strokeWeight(6);
    p.circle(0, 0, POSTER_W * 0.56 * scale);
    p.strokeWeight(2);
    p.circle(0, 0, POSTER_W * 0.42 * scale);
    p.stroke(...accent, 190);
    for (let i = 0; i < 32; i += 1) {
      const a = (i / 32) * p.TWO_PI;
      const inner = i % 8 === 0 ? 0.14 : i % 4 === 0 ? 0.18 : 0.2;
      p.strokeWeight(i % 8 === 0 ? 3 : 1.4);
      p.line(
        Math.cos(a) * POSTER_W * inner * scale,
        Math.sin(a) * POSTER_W * inner * scale,
        Math.cos(a) * POSTER_W * 0.26 * scale,
        Math.sin(a) * POSTER_W * 0.26 * scale
      );
    }
    p.noStroke();
    p.fill(...accent, 230);
    p.triangle(0, -POSTER_H * 0.2 * scale, -16 * scale, 10 * scale, 16 * scale, 10 * scale);
    p.fill(...primary, 200);
    p.triangle(0, POSTER_H * 0.16 * scale, -12 * scale, 0, 12 * scale, 0);
    p.fill(...bg, 255);
    p.circle(0, 0, 14);
    p.fill(...accent, 255);
    p.circle(0, 0, 6);
  } else if (metaphor === "correspondence-clock") {
    p.rectMode(p.CENTER);
    p.noFill();
    p.stroke(...accent, 80);
    p.strokeWeight(1.5);
    for (let i = 0; i < 7; i += 1) {
      p.beginShape();
      for (let x = -POSTER_W * 0.48; x < POSTER_W * 0.48; x += 12) {
        p.vertex(x * scale, (Math.sin(x * 0.014 + i) * 20 + i * 16 - 64) * scale);
      }
      p.endShape();
    }
    p.noStroke();
    const highlight = hexToRgb(pal.highlight || pal.accent);
    for (let i = 0; i < 8; i += 1) {
      p.fill(...highlight, 160);
      p.circle((-POSTER_W * 0.28 + i * 42) * scale, (-52 + Math.sin(i) * 18) * scale, 5 * scale);
    }
    const sheets = 9;
    for (let i = 0; i < sheets; i += 1) {
      p.push();
      p.rotate((i / sheets) * p.TWO_PI + 0.12);
      p.translate(0, -POSTER_H * 0.09 * scale);
      p.noStroke();
      p.fill(0, 0, 0, 28);
      p.rect(5, 7, POSTER_W * 0.2 * scale, POSTER_H * 0.13 * scale);
      p.fill(245, 236, 220, 240);
      p.rect(0, 0, POSTER_W * 0.2 * scale, POSTER_H * 0.13 * scale);
      p.fill(...accent, 170);
      p.triangle(
        -POSTER_W * 0.1 * scale,
        -POSTER_H * 0.065 * scale,
        POSTER_W * 0.1 * scale,
        -POSTER_H * 0.065 * scale,
        0,
        POSTER_H * 0.008 * scale
      );
      p.stroke(...primary, 130);
      p.strokeWeight(1);
      p.line(-POSTER_W * 0.06 * scale, 10, POSTER_W * 0.05 * scale, 12);
      p.line(-POSTER_W * 0.055 * scale, 18, POSTER_W * 0.04 * scale, 20);
      p.pop();
    }
    p.noStroke();
    p.fill(...accent, 55);
    p.ellipse(POSTER_W * 0.16 * scale, POSTER_H * 0.16 * scale, 72 * scale, 48 * scale);
    p.noFill();
    p.stroke(...accent, 80);
    p.strokeWeight(1.4);
    p.ellipse(POSTER_W * 0.16 * scale, POSTER_H * 0.16 * scale, 76 * scale, 52 * scale);
    p.stroke(...primary, 220);
    p.strokeWeight(3.4);
    p.circle(0, 0, POSTER_W * 0.64 * scale);
    p.strokeWeight(5);
    p.line(0, 0, 0, -POSTER_H * 0.18 * scale);
    p.strokeWeight(3.6);
    p.line(0, 0, POSTER_W * 0.16 * scale, 30 * scale);
    p.fill(...accent, 240);
    p.noStroke();
    p.circle(0, 0, 14);
    p.push();
    p.translate(-POSTER_W * 0.28 * scale, POSTER_H * 0.24 * scale);
    p.rotate(-0.38);
    p.fill(...accent, 210);
    p.rect(0, 0, 58 * scale, 22 * scale, 2);
    p.fill(...bg, 255);
    p.circle(-20 * scale, 0, 6);
    p.circle(20 * scale, 0, 6);
    p.pop();
    p.push();
    p.translate(POSTER_W * 0.26 * scale, POSTER_H * 0.22 * scale);
    p.rotate(0.42);
    p.fill(...primary, 200);
    p.rect(0, 0, 58 * scale, 22 * scale, 2);
    p.fill(...bg, 255);
    p.circle(-20 * scale, 0, 6);
    p.circle(20 * scale, 0, 6);
    p.pop();
  } else if (metaphor === "handwritten-letter" || metaphor === "postcard") {
    p.rectMode(p.CENTER);
    for (let i = 0; i < 3; i += 1) {
      p.push();
      p.rotate((i - 1) * 0.12);
      p.noStroke();
      p.fill(0, 0, 0, 24);
      p.rect(8, 10, POSTER_W * 0.38 * scale, POSTER_H * 0.22 * scale);
      p.fill(245, 236, 220, 230 - i * 12);
      p.rect(0, 0, POSTER_W * 0.38 * scale, POSTER_H * 0.22 * scale);
      p.stroke(...primary, 100);
      p.strokeWeight(1);
      p.line(-POSTER_W * 0.14 * scale, -18, POSTER_W * 0.14 * scale, -12);
      p.line(-POSTER_W * 0.13 * scale, -2, POSTER_W * 0.12 * scale, 4);
      p.line(-POSTER_W * 0.12 * scale, 14, POSTER_W * 0.08 * scale, 18);
      p.pop();
    }
    if (metaphor === "postcard") {
      p.stroke(...accent, 150);
      p.line(0, -POSTER_H * 0.14 * scale, 0, POSTER_H * 0.14 * scale);
    }
  } else if (metaphor === "railway-route") {
    p.noFill();
    p.stroke(...accent, 120);
    p.strokeWeight(2);
    for (let i = 0; i < 8; i += 1) {
      p.beginShape();
      for (let x = -POSTER_W * 0.48; x < POSTER_W * 0.48; x += 10) {
        p.vertex(x * scale, (Math.sin(x * 0.012 + i * 0.4) * 28 + i * 14 - 50) * scale);
      }
      p.endShape();
    }
    p.noStroke();
    for (let i = 0; i < 10; i += 1) {
      p.fill(...hexToRgb(pal.highlight || pal.accent), 180);
      p.circle((-POSTER_W * 0.3 + i * 38) * scale, (Math.sin(i * 0.9) * 40) * scale, 6 * scale);
    }
  } else if (metaphor === "paired-objects") {
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill(...secondary, 200);
    p.ellipse(-POSTER_W * 0.1 * scale, 8, POSTER_W * 0.16 * scale, POSTER_H * 0.08 * scale);
    p.ellipse(POSTER_W * 0.12 * scale, 4, POSTER_W * 0.16 * scale, POSTER_H * 0.08 * scale);
    p.fill(...primary, 120);
    p.rect(-POSTER_W * 0.1 * scale, -20, 8, 36, 3);
    p.rect(POSTER_W * 0.12 * scale, -24, 8, 36, 3);
  } else if (metaphor === "weathered-door") {
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill(...primary, 190);
    p.rect(0, 0, POSTER_W * 0.34 * scale, POSTER_H * 0.58 * scale, 4);
    p.fill(...bg, 160);
    p.rect(0, -POSTER_H * 0.04 * scale, POSTER_W * 0.22 * scale, POSTER_H * 0.38 * scale);
    p.fill(...accent, 200);
    p.circle(POSTER_W * 0.1 * scale, 0, 14 * scale);
  } else if (metaphor === "locked-mechanism" || metaphor === "clock-mechanism" || metaphor === "keyhole") {
    p.noStroke();
    p.fill(...primary, metalish ? 200 : 150);
    p.circle(0, 0, POSTER_W * 0.46 * scale);
    p.fill(...secondary, 90);
    p.circle(0, 0, POSTER_W * 0.38 * scale);
    p.fill(...bg, 220);
    p.circle(0, 0, POSTER_W * 0.24 * scale);
    if (metaphor === "keyhole") {
      // Unmistakable keyhole void.
      p.fill(...bg, 255);
      p.circle(0, -POSTER_H * 0.02 * scale, POSTER_W * 0.12 * scale);
      p.rectMode(p.CENTER);
      p.rect(0, POSTER_H * 0.05 * scale, POSTER_W * 0.07 * scale, POSTER_H * 0.12 * scale, 4);
      p.noFill();
      p.stroke(...accent, 160);
      p.strokeWeight(2);
      p.circle(0, 0, POSTER_W * 0.46 * scale);
    } else {
      p.stroke(...accent, 200);
      p.strokeWeight(2.4);
      p.noFill();
      const teeth = metaphor === "clock-mechanism" ? 12 : 8;
      for (let i = 0; i < teeth; i += 1) {
        const a = (i / teeth) * p.TWO_PI;
        p.line(
          Math.cos(a) * POSTER_W * 0.14 * scale,
          Math.sin(a) * POSTER_W * 0.14 * scale,
          Math.cos(a) * POSTER_W * 0.21 * scale,
          Math.sin(a) * POSTER_W * 0.21 * scale
        );
      }
      p.strokeWeight(2.6);
      p.line(0, 0, Math.cos(-0.7) * POSTER_W * 0.14 * scale, Math.sin(-0.7) * POSTER_W * 0.14 * scale);
      p.line(0, 0, Math.cos(1.1) * POSTER_W * 0.09 * scale, Math.sin(1.1) * POSTER_W * 0.09 * scale);
      p.fill(...accent, 180);
      p.noStroke();
      p.circle(0, 0, 10);
    }
  } else if (metaphor === "decaying-photograph" || metaphor === "burning-document" || metaphor === "map-fold") {
    const w = POSTER_W * 0.52 * scale;
    const h = POSTER_H * 0.36 * scale;
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill(0, 0, 0, 70);
    p.rect(10, 14, w, h);
    p.fill(...(papery ? secondary : primary), 190);
    p.rect(0, 0, w, h);
    p.stroke(...accent, 90);
    p.strokeWeight(1.2);
    p.noFill();
    p.rect(0, 0, w * 0.92, h * 0.9);
    if (metaphor === "map-fold") {
      p.line(-w * 0.5, 0, w * 0.5, 0);
      p.line(0, -h * 0.5, 0, h * 0.5);
      for (let i = 0; i < 5; i += 1) {
        p.noFill();
        p.stroke(...primary, 110);
        p.beginShape();
        for (let x = -w * 0.4; x <= w * 0.4; x += 8) {
          p.vertex(x, Math.sin(x * 0.08 + i) * 10 + i * 8 - 16);
        }
        p.endShape();
      }
    } else if (metaphor === "burning-document") {
      p.noStroke();
      for (let i = 0; i < 22; i += 1) {
        const bx = p.random(-w * 0.45, w * 0.45);
        const by = h * 0.5 - p.random(0, h * 0.6);
        p.fill(...accent, 50 + p.random(90));
        p.ellipse(bx, by, p.random(8, 22), p.random(12, 34));
      }
    } else {
      // Faded portrait plane inside the photograph.
      p.noStroke();
      p.fill(...bg, 110);
      p.rect(0, -h * 0.04, w * 0.62, h * 0.55);
      p.fill(...primary, 80);
      p.ellipse(0, -h * 0.08, w * 0.28, h * 0.28);
      p.fill(...accent, 45);
      p.ellipse(w * 0.16, h * 0.14, w * 0.34, h * 0.28);
      // Emulsion damage.
      for (let i = 0; i < 14; i += 1) {
        p.fill(...bg, 40 + p.random(50));
        p.ellipse(p.random(-w * 0.4, w * 0.4), p.random(-h * 0.4, h * 0.4), p.random(4, 18), p.random(3, 12));
      }
    }
  } else if (metaphor === "tangled-roots" || metaphor === "maze" || metaphor === "architectural-ruin") {
    p.noFill();
    p.stroke(...primary, 180 * emphasis);
    p.strokeWeight(metaphor === "tangled-roots" ? 2.2 : 1.6);
    const branches = metaphor === "maze" ? 12 : 18;
    for (let i = 0; i < branches; i += 1) {
      let x = 0;
      let y = metaphor === "architectural-ruin" ? POSTER_H * 0.14 * scale : POSTER_H * 0.08 * scale;
      p.beginShape();
      for (let s = 0; s < 28; s += 1) {
        p.vertex(x, y);
        const n = p.noise(i * 0.35, s * 0.12);
        if (metaphor === "maze") {
          x += (n > 0.5 ? 1 : -1) * 10 * scale;
          y += 8 * scale;
        } else if (metaphor === "architectural-ruin") {
          x += (p.random() - 0.5) * 12;
          y -= 9 * scale;
        } else {
          x += Math.cos(n * p.TWO_PI + i * 0.2) * 9 * scale;
          y -= Math.abs(Math.sin(n * p.TWO_PI + i)) * 8 * scale + 1;
        }
      }
      p.endShape();
    }
    if (metaphor === "architectural-ruin") {
      p.stroke(...accent, 120);
      p.strokeWeight(1.8);
      p.rectMode(p.CENTER);
      p.rect(0, POSTER_H * 0.02 * scale, POSTER_W * 0.34 * scale, POSTER_H * 0.22 * scale);
    } else if (metaphor === "tangled-roots") {
      p.noStroke();
      p.fill(...accent, 70);
      p.ellipse(0, POSTER_H * 0.1 * scale, POSTER_W * 0.2 * scale, POSTER_H * 0.06 * scale);
    }
  } else if (metaphor === "mountain-ridge" || metaphor === "alpine-peak") {
    drawMountainAnchor(p, metaphor, scale, emphasis, primary, secondary, accent, bg);
  } else if (metaphor === "canine-silhouette" || metaphor === "animal-tracks") {
    drawCanineAnchor(p, metaphor, scale, emphasis, primary, secondary, accent, bg, fx);
  } else if (metaphor === "wild-canopy" || metaphor === "botanical-press" || metaphor === "forest-fringe") {
    drawBotanicalAnchor(p, metaphor, scale, emphasis, primary, secondary, accent, bg);
  } else {
    // silhouette-threshold default — figure at a doorway / threshold
    p.noStroke();
    p.fill(...primary, 170);
    p.rectMode(p.CENTER);
    p.rect(0, POSTER_H * 0.02 * scale, POSTER_W * 0.28 * scale, POSTER_H * 0.5 * scale, 2);
    p.fill(...bg, 200);
    p.rect(0, POSTER_H * 0.02 * scale, POSTER_W * 0.16 * scale, POSTER_H * 0.4 * scale);
    p.fill(...secondary, 180);
    p.ellipse(0, -POSTER_H * 0.1 * scale, POSTER_W * 0.11 * scale, POSTER_H * 0.14 * scale);
    p.rect(0, POSTER_H * 0.07 * scale, POSTER_W * 0.09 * scale, POSTER_H * 0.26 * scale, 8);
  }

  // Specular / material highlight from light origin.
  if (metalish || glassy) {
    const hx = (origin.x - fx) * POSTER_W * 0.15;
    const hy = (origin.y - fy) * POSTER_H * 0.12;
    p.noStroke();
    p.fill(255, 255, 255, glassy ? 55 : 35);
    p.ellipse(hx, hy, POSTER_W * 0.08 * scale, POSTER_H * 0.04 * scale);
  }

  if (spatial === "fragmented" || spatial === "collapsing") {
    p.stroke(...accent, 50);
    p.strokeWeight(1);
    for (let i = 0; i < 5; i += 1) {
      const a = p.random(p.TWO_PI);
      p.line(0, 0, Math.cos(a) * POSTER_W * 0.2 * scale, Math.sin(a) * POSTER_H * 0.14 * scale);
    }
  }

  p.pop();
}

function drawHumanTraces(p, dna, seed, fx, fy) {
  const human = dnaSemantic(dna).humanElements || "none";
  const family = grammarFamily(dna);
  if (human === "none" && !["romance", "contemporary", "coming-of-age", "family", "drama"].includes(family)) {
    return;
  }
  const pal = dnaPalette(dna);
  const primary = hexToRgb(pal.primary);
  const accent = hexToRgb(pal.accent);
  const secondary = hexToRgb(pal.secondary);
  p.randomSeed(seed + 911);
  p.push();
  const kind = human === "none" ? "paired-objects" : human;
  if (kind === "tickets" || kind === "letter" || kind === "paired-objects") {
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill(...secondary, 180);
    p.translate(nx(0.18), ny(0.82));
    p.rotate(-0.2);
    p.rect(0, 0, 70, 32, 3);
    p.fill(...accent, 160);
    p.rect(18, 22, 70, 32, 3);
  } else if (kind === "cups") {
    p.noStroke();
    p.fill(...secondary, 170);
    p.ellipse(nx(0.2), ny(0.8), 36, 16);
    p.ellipse(nx(0.3), ny(0.81), 36, 16);
  } else if (kind === "hands") {
    p.noFill();
    p.stroke(...primary, 90);
    p.strokeWeight(2);
    p.arc(nx(fx - 0.16), ny(fy + 0.18), 70, 40, 0.2, 2.6);
    p.arc(nx(fx + 0.16), ny(fy + 0.2), 70, 40, 0.6, 3.1);
  } else if (kind === "signage") {
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill(...accent, 200);
    p.rect(nx(0.82), ny(0.22), 86, 28, 3);
  } else if (kind === "animal-silhouette") {
    p.noStroke();
    p.fill(...primary, 150);
    p.beginShape();
    const ax = nx(0.18);
    const ay = ny(0.78);
    p.vertex(ax, ay);
    p.vertex(ax + 18, ay - 22);
    p.vertex(ax + 42, ay - 16);
    p.vertex(ax + 58, ay - 8);
    p.vertex(ax + 48, ay + 6);
    p.vertex(ax + 22, ay + 8);
    p.endShape(p.CLOSE);
    p.triangle(ax + 18, ay - 22, ax + 10, ay - 40, ax + 28, ay - 20);
  } else if (kind === "flora") {
    p.noFill();
    p.stroke(...accent, 120);
    p.strokeWeight(1.4);
    const fx0 = nx(0.82);
    const fy0 = ny(0.76);
    p.line(fx0, fy0 + 28, fx0, fy0 - 24);
    for (let i = 0; i < 5; i += 1) {
      const dir = i % 2 === 0 ? -1 : 1;
      p.bezier(fx0, fy0 - i * 8, fx0 + dir * 18, fy0 - i * 8 - 6, fx0 + dir * 22, fy0 - i * 8 - 16, fx0 + dir * 8, fy0 - i * 8 - 22);
    }
  }
  if (kind === "letter" || family === "contemporary" || family === "romance") {
    p.noFill();
    p.stroke(...primary, 70);
    p.strokeWeight(1.1);
    p.beginShape();
    let x = nx(0.12);
    let y = ny(0.72);
    for (let s = 0; s < 24; s += 1) {
      p.vertex(x, y);
      x += 8;
      y += Math.sin(s * 0.9) * 3;
    }
    p.endShape();
  }
  p.pop();
}

function drawCinematicPlate(p, dna, seed, spec) {
  const pal = dnaPalette(dna);
  const semantic = dnaSemantic(dna);
  const bg = hexToRgb(pal.background);
  const primary = hexToRgb(pal.primary);
  const secondary = hexToRgb(pal.secondary);
  const plan = spec.plan;
  const fx = plan ? plan.focalX : Number(dnaComp(dna).focalX ?? 0.5);
  const fy = plan ? plan.focalY : Number(dnaComp(dna).focalY ?? 0.42);
  const material = semantic.material || "paper";
  const spatial = semantic.spatial || "isolated";
  const family = grammarFamily(dna);

  p.background(...bg);
  p.noiseSeed(seed);
  p.randomSeed(seed);

  if (window.FrameFluxSystems) {
    window.FrameFluxSystems.drawTopographyShade(p, dna, seed, plan || {});
    window.FrameFluxSystems.drawContourField(p, dna, seed, plan || spec);
    window.FrameFluxSystems.drawCentralFrame(p, dna, seed, plan || {});
  }

  const horizon =
    spatial === "rising" || spatial === "expanding"
      ? 0.62
      : spatial === "claustrophobic" || spatial === "compressed"
        ? 0.4
        : spec.id === "off-center-top"
          ? 0.42
          : spec.id === "off-center-bottom"
            ? 0.58
            : 0.52;

  if (!window.FrameFluxSystems) {
    p.noStroke();
    for (let y = 0; y < POSTER_H; y += 3) {
      const t = y / POSTER_H;
      const sky = t < horizon;
      const mixAmt = sky ? t / horizon : (t - horizon) / (1 - horizon);
      const a = sky ? bg : primary;
      const b = sky ? secondary : bg;
      const depth = sky ? 55 : 75;
      p.fill(
        a[0] + (b[0] - a[0]) * mixAmt,
        a[1] + (b[1] - a[1]) * mixAmt,
        a[2] + (b[2] - a[2]) * mixAmt,
        depth
      );
      p.rect(0, y, POSTER_W, 4);
    }
  }

  // Mid-ground haze / material atmosphere before the anchor.
  if (material === "smoke" || material === "dust" || material === "water") {
    p.drawingContext.save();
    const haze = p.drawingContext.createRadialGradient(nx(fx), ny(fy), 10, nx(fx), ny(fy), POSTER_W * 0.55);
    const c = material === "water" ? secondary : primary;
    haze.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.28)`);
    haze.addColorStop(1, "rgba(0,0,0,0)");
    p.drawingContext.fillStyle = haze;
    p.drawingContext.fillRect(0, 0, POSTER_W, POSTER_H);
    p.drawingContext.restore();
  }

  if (!window.FrameFluxSystems) {
    drawDirectionalLight(p, dna, seed, fx, fy);
  }
  drawNarrativeAnchor(p, dna, seed, fx, fy);

  drawMaterialGrain(p, dna, seed, materialEmphasis(dna, seed));
  drawHumanTraces(p, dna, seed, fx, fy);

  if (["adventure", "thriller", "scifi", "horror", "mystery", "historical"].includes(family)) {
    p.stroke(...secondary, material === "concrete" || material === "stone" ? 55 : 28);
    p.strokeWeight(1.1);
    const groundLines = spatial === "expansive" ? 4 : spatial === "claustrophobic" ? 10 : 6;
    for (let i = 0; i < groundLines; i += 1) {
      const x = nx(0.06 + i * (0.88 / Math.max(1, groundLines - 1)));
      p.line(x, ny(horizon), x + (p.noise(i * 0.4) - 0.5) * 36, ny(0.94));
    }
    p.noFill();
    p.stroke(...hexToRgb(pal.accent), 14);
    p.strokeWeight(1);
    p.line(0, ny(horizon), POSTER_W, ny(horizon));
  } else if (family === "romance") {
    p.noFill();
    p.stroke(...secondary, 40);
    p.strokeWeight(1.4);
    p.beginShape();
    for (let x = 0; x <= POSTER_W; x += 8) {
      p.vertex(x, ny(horizon) + Math.sin(x * 0.018) * 10);
    }
    p.endShape();
  }

  if (!window.FrameFluxSystems) {
  const shadow = Number(dnaLight(dna).shadowDensity ?? 0.55);
  p.drawingContext.save();
  const vig = p.drawingContext.createRadialGradient(
    POSTER_W / 2,
    POSTER_H / 2,
    POSTER_H * 0.16,
    POSTER_W / 2,
    POSTER_H / 2,
    POSTER_H * (0.68 + shadow * 0.08)
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  if (isLightGround(dna)) {
    const paper = hexToRgb(pal.background);
    vig.addColorStop(1, `rgba(${paper[0]},${paper[1]},${paper[2]},${0.18 + shadow * 0.12})`);
  } else {
    vig.addColorStop(1, `rgba(0,0,0,${0.4 + shadow * 0.28})`);
  }
  p.drawingContext.fillStyle = vig;
  p.drawingContext.fillRect(0, 0, POSTER_W, POSTER_H);
  p.drawingContext.restore();
  }
}

function drawKeyArt(p, img, spec) {
  const crop = spec.crop;
  const scale = Math.max(POSTER_W / img.width, POSTER_H / img.height) * (crop.scale || 1.12);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = POSTER_W / 2 - dw * crop.x;
  const dy = POSTER_H / 2 - dh * crop.y;
  p.image(img, dx, dy, dw, dh);
}

function drawPureStill(p, img) {
  const scale = Math.max(POSTER_W / img.width, POSTER_H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  p.background(9, 8, 7);
  p.image(img, (POSTER_W - dw) / 2, (POSTER_H - dh) / 2, dw, dh);
}

function buildSampler(p) {
  const cols = 40;
  const rows = 60;
  const grid = [];
  let brightest = { u: 0.5, v: 0.4, l: 0 };
  for (let y = 0; y < rows; y += 1) {
    grid[y] = [];
    for (let x = 0; x < cols; x += 1) {
      const px = ((x + 0.5) / cols) * POSTER_W;
      const py = ((y + 0.5) / rows) * POSTER_H;
      const c = p.get(px, py);
      const l = (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114) / 255;
      grid[y][x] = l;
      if (l > brightest.l) {
        brightest = { u: (x + 0.5) / cols, v: (y + 0.5) / rows, l };
      }
    }
  }
  const at = (u, v) => {
    const x = Math.max(0, Math.min(cols - 1, Math.floor(u * cols)));
    const y = Math.max(0, Math.min(rows - 1, Math.floor(v * rows)));
    return grid[y][x];
  };
  const edge = (u, v) => {
    const step = 1 / cols;
    return Math.abs(at(u + step, v) - at(u - step, v)) + Math.abs(at(u, v + step) - at(u, v - step));
  };
  return { at, edge, brightest };
}

function drawFlowField(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  const density = dnaProc(dna).density || 0.6;
  const lineKind = dnaSemantic(dna).lineSemantics || dnaProc(dna).lineSemantics || "threads";
  const count = Math.floor(280 * density * weight);
  p.noiseSeed(seed);
  p.randomSeed(seed);
  p.noFill();
  const strokeW =
    lineKind === "cracks" || lineKind === "wiring"
      ? 1.2
      : lineKind === "roots" || lineKind === "veins"
        ? 1.35
        : lineKind === "cords" || lineKind === "ribbons"
          ? 2.1
          : lineKind === "waves" || lineKind === "coastline" || lineKind === "horizon"
            ? 1.5
            : lineKind === "railway" || lineKind === "trails" || lineKind === "contour"
              ? 1.25
              : lineKind === "handwriting"
                ? 1.05
                : lineKind === "plans" || lineKind === "roads"
                  ? 0.95
                  : 1.05;
  p.strokeWeight(strokeW);
  for (let i = 0; i < count; i += 1) {
    let x = p.random(POSTER_W);
    let y = p.random(POSTER_H);
    const u = x / POSTER_W;
    const v = y / POSTER_H;
    const protect = protectionWeight(u, v, dna, spec);
    if (protect < 0.2) {
      continue;
    }
    const lum = sampler.at(u, v);
    const mix = i / count;
    const c = mix < 0.45 ? pal.primary : mix < 0.8 ? pal.secondary : pal.accent;
    p.stroke(...hexToRgb(c), 85 + lum * 75);
    p.beginShape();
    for (let s = 0; s < 36; s += 1) {
      const uu = x / POSTER_W;
      const vv = y / POSTER_H;
      if (protectionWeight(uu, vv, dna, spec) < 0.18) {
        break;
      }
      p.vertex(x, y);
      const n = p.noise(x * 0.004, y * 0.004);
      const edgeBias = sampler.edge(uu, vv);
      let angle = n * p.TWO_PI * 2.4 + edgeBias * 1.8;
      if (lineKind === "cracks") {
        angle = Math.round(angle / (p.HALF_PI / 2)) * (p.HALF_PI / 2) + (n - 0.5) * 0.35;
      } else if (lineKind === "roads" || lineKind === "plans") {
        angle = Math.round(angle / p.HALF_PI) * p.HALF_PI + (n - 0.5) * 0.15;
      } else if (lineKind === "circuitry" || lineKind === "wiring") {
        angle = s % 5 < 3 ? Math.round(angle / p.HALF_PI) * p.HALF_PI : angle;
      } else if (lineKind === "roots" || lineKind === "veins") {
        angle = n * p.TWO_PI * 1.4 + edgeBias;
      } else if (lineKind === "cords" || lineKind === "ribbons") {
        angle = n * p.TWO_PI * 3.2 + Math.sin(s * 0.4 + i) * 0.8;
      } else if (lineKind === "waves" || lineKind === "coastline" || lineKind === "horizon") {
        angle = 0.15 + Math.sin(x * 0.01 + i) * 0.45 + (n - 0.5) * 0.3;
      } else if (lineKind === "railway" || lineKind === "trails") {
        angle = 0.55 + (n - 0.5) * 0.35 + Math.sin(s * 0.12) * 0.08;
      } else if (lineKind === "handwriting") {
        angle = n * 4 + Math.sin(s * 1.7) * 1.2;
      } else if (lineKind === "contour") {
        angle = Math.sin(y * 0.02 + i) * 0.6 + 0.2;
      } else if (lineKind === "tendrils") {
        angle = n * p.TWO_PI * 1.6 + Math.sin(s * 0.55 + i) * 0.9 + edgeBias;
      } else if (lineKind === "fault-lines") {
        angle = Math.round(angle / (p.HALF_PI / 3)) * (p.HALF_PI / 3) + (n - 0.5) * 0.22;
      } else if (lineKind === "paw-prints") {
        angle = 0.4 + Math.sin(s * 0.8 + i) * 0.5 + (n - 0.5) * 0.4;
      }
      const step =
        lineKind === "cracks"
          ? 5.2
          : lineKind === "threads" || lineKind === "handwriting"
            ? 3.4
            : lineKind === "cords"
              ? 5.6
              : lineKind === "waves"
                ? 6.2
                : 4.4;
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      if (x < -20 || x > POSTER_W + 20 || y < -20 || y > POSTER_H + 20) {
        break;
      }
    }
    p.endShape();
  }
}

function drawGrid(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  p.randomSeed(seed);
  const density = dnaProc(dna).density || 0.6;
  const cols = Math.floor(7 + density * 8);
  const rows = Math.floor(10 + density * 10);
  const cellW = POSTER_W / cols;
  const cellH = POSTER_H / rows;
  p.noFill();
  p.strokeWeight(1);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const u = (x + 0.5) / cols;
      const v = (y + 0.5) / rows;
      const protect = protectionWeight(u, v, dna, spec);
      const edge = sampler.edge(u, v);
      const lum = sampler.at(u, v);
      if (protect < 0.2 || (edge < 0.04 && lum > 0.55)) {
        continue;
      }
      const inset = 3 + (1 - edge) * cellW * 0.25;
      p.push();
      p.translate(x * cellW + cellW / 2, y * cellH + cellH / 2);
      p.rotate(edge > 0.12 ? p.QUARTER_PI / 5 : 0);
      p.stroke(...hexToRgb(lum > 0.5 ? pal.accent : pal.primary), 90 * protect * weight);
      p.rectMode(p.CENTER);
      p.rect(0, 0, (cellW - inset) * weight, (cellH - inset * 0.6) * weight);
      p.pop();
    }
  }
}

function drawParticles(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  p.randomSeed(seed);
  const density = dnaProc(dna).density || 0.6;
  const kind = dnaSemantic(dna).particleSemantics || dnaProc(dna).particleSemantics || "dust";
  const count = Math.floor(
    (kind === "stars" ? 160 : kind === "rain" ? 280 : kind === "ash" || kind === "dust" ? 200 : 180) +
      density * 220
  );
  const fx = Number(dnaComp(dna).focalX ?? 0.5);
  const fy = Number(dnaComp(dna).focalY ?? 0.42);
  p.noStroke();
  for (let i = 0; i < count; i += 1) {
    let u = p.random();
    let v = p.random();
    if (kind === "stars") {
      v = p.random() * 0.55;
    } else if (kind === "rain") {
      u = p.random();
      v = p.random();
    } else if (p.random() < 0.55) {
      u = fx + (p.random() - 0.5) * 0.42;
      v = fy + (p.random() - 0.5) * 0.36;
    }
    u = Math.max(0, Math.min(1, u));
    v = Math.max(0, Math.min(1, v));
    const protect = protectionWeight(u, v, dna, spec);
    const lum = sampler.at(u, v);
    if (protect < 0.22 || lum < 0.06) {
      continue;
    }
    const tier = p.random();
    let r = tier < 0.7 ? p.random(0.8, 1.8) : tier < 0.93 ? p.random(2.2, 4.5) : p.random(5, 9);
    const c = tier < 0.6 ? pal.primary : tier < 0.85 ? pal.secondary : pal.accent;
    const alpha = (80 + lum * 110) * protect * weight;
    if (kind === "rain") {
      p.stroke(...hexToRgb(c), alpha);
      p.strokeWeight(1);
      p.line(nx(u), ny(v), nx(u) + 1.5, ny(v) + 10 + density * 8);
      p.noStroke();
      continue;
    }
    if (kind === "sparks") {
      p.stroke(...hexToRgb(pal.accent), alpha);
      p.strokeWeight(1.1);
      const ang = p.random(p.TWO_PI);
      p.line(nx(u), ny(v), nx(u) + Math.cos(ang) * 6, ny(v) + Math.sin(ang) * 6);
      p.noStroke();
      r = p.random(1.2, 2.4);
    }
    if (kind === "ash") {
      r = p.random(1.2, 3.2);
      p.fill(...hexToRgb(c), alpha * 0.85);
      p.rect(nx(u), ny(v), r * weight, r * 0.6 * weight);
      continue;
    }
    if (kind === "confetti") {
      p.push();
      p.translate(nx(u), ny(v));
      p.rotate(p.random(p.TWO_PI));
      p.fill(...hexToRgb(c), alpha);
      p.rect(0, 0, r * 2.2 * weight, r * 0.7 * weight);
      p.pop();
      continue;
    }
    if (kind === "salt" || kind === "sand") {
      p.fill(...hexToRgb(c), alpha * 0.7);
      p.circle(nx(u), ny(v), p.random(0.6, 1.8) * weight);
      continue;
    }
    if (kind === "ember") {
      p.fill(...hexToRgb(pal.accent), alpha);
      p.circle(nx(u), ny(v), r * 0.8 * weight);
      continue;
    }
    p.fill(...hexToRgb(c), alpha);
    p.circle(nx(u), ny(v), r * weight);
  }
}

function drawRings(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  p.randomSeed(seed);
  p.noiseSeed(seed);
  const fx = sampler.brightest.u * 0.35 + Number(dnaComp(dna).focalX ?? 0.5) * 0.65;
  const fy = sampler.brightest.v * 0.35 + Number(dnaComp(dna).focalY ?? 0.42) * 0.65;
  const rings = 9 + Math.floor((dnaProc(dna).density || 0.6) * 6);
  p.noFill();
  p.strokeWeight(1);
  for (let i = 1; i <= rings; i += 1) {
    const t = i / rings;
    const rx = POSTER_W * (0.08 + t * 0.55);
    const ry = POSTER_H * (0.05 + t * 0.38) * (0.78 + p.noise(i * 0.2) * 0.4);
    const alpha = (140 - t * 70) * weight;
    p.stroke(...hexToRgb(i % 3 === 0 ? pal.accent : pal.secondary), alpha);
    p.push();
    p.translate(nx(fx), ny(fy));
    p.rotate((p.noise(i) - 0.5) * 0.35);
    const steps = 48;
    p.beginShape();
    for (let s = 0; s <= steps; s += 1) {
      const a = (s / steps) * p.TWO_PI;
      const jitter = (p.noise(i, s * 0.15) - 0.5) * 14;
      const x = Math.cos(a) * (rx + jitter);
      const y = Math.sin(a) * (ry + jitter);
      const u = (nx(fx) + x) / POSTER_W;
      const v = (ny(fy) + y) / POSTER_H;
      if (protectionWeight(u, v, dna, spec) < 0.2) {
        p.endShape();
        p.beginShape();
        continue;
      }
      p.vertex(x, y);
    }
    p.endShape();
    p.pop();
  }
}

function drawMesh(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  p.randomSeed(seed);
  const cols = 8;
  const rows = 12;
  const points = [];
  for (let y = 0; y <= rows; y += 1) {
    points[y] = [];
    for (let x = 0; x <= cols; x += 1) {
      const u = x / cols;
      const v = y / rows;
      const edge = sampler.edge(u, v);
      const jx = (p.random() - 0.5) * 18 * (0.3 + edge * 2);
      const jy = (p.random() - 0.5) * 16 * (0.3 + edge * 2);
      points[y][x] = { x: nx(u) + jx, y: ny(v) + jy, u, v, edge };
    }
  }
  p.noFill();
  p.strokeWeight(0.9);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const a = points[y][x];
      const b = points[y][x + 1];
      const c = points[y + 1][x];
      const protect = protectionWeight(a.u, a.v, dna, spec);
      if (protect < 0.22) {
        continue;
      }
      const alpha = (55 + a.edge * 120) * protect * weight;
      p.stroke(...hexToRgb(a.edge > 0.1 ? pal.accent : pal.primary), alpha);
      p.triangle(a.x, a.y, b.x, b.y, c.x, c.y);
    }
  }
}

function drawHalftone(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  const density = dnaProc(dna).density || 0.6;
  const cols = Math.floor(18 + density * 16);
  const rows = Math.floor(26 + density * 18);
  const cellW = POSTER_W / cols;
  const cellH = POSTER_H / rows;
  p.randomSeed(seed + 17);
  p.noiseSeed(seed + 17);
  p.noStroke();
  const ink = hexToRgb(pal.primary);
  const acc = hexToRgb(pal.accent);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const jitter = (p.noise(x * 0.18, y * 0.18) - 0.5) * cellW * 0.35;
      const u = (x + 0.5) / cols;
      const v = (y + 0.5) / rows;
      const protect = protectionWeight(u, v, dna, spec);
      if (protect < 0.2) {
        continue;
      }
      const lum = sampler.at(u, v);
      const cluster = p.noise(x * 0.09, y * 0.09);
      if (cluster < 0.28 && lum > 0.62) {
        continue;
      }
      const r = (0.35 + (1 - lum) * 0.9 + cluster * 0.25) * Math.min(cellW, cellH) * 0.48 * weight * protect;
      if (r < 0.6) {
        continue;
      }
      p.fill(...(y % 3 === 0 ? acc : ink), 70 + (1 - lum) * 90);
      p.circle(x * cellW + cellW / 2 + jitter, y * cellH + cellH / 2, r * 2);
    }
  }
}

function drawHatching(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  const density = dnaProc(dna).density || 0.6;
  const lineKind = dnaSemantic(dna).lineSemantics || "threads";
  const baseAngle = lineKind === "fault-lines" ? -0.7 : lineKind === "tendrils" ? 0.4 : -0.45;
  const count = Math.floor(42 + density * 50);
  p.randomSeed(seed + 29);
  p.noiseSeed(seed + 29);
  p.noFill();
  for (let i = 0; i < count; i += 1) {
    const v0 = i / count;
    const u0 = p.noise(i * 0.07);
    const protect = protectionWeight(u0, v0, dna, spec);
    if (protect < 0.2) {
      continue;
    }
    const lum = sampler.at(u0, v0);
    const local = 0.35 + (1 - lum) * 0.8;
    const spacing = (8 + (1 - density) * 10) / local;
    const angle = baseAngle + (p.noise(i * 0.2) - 0.5) * 0.35;
    const cross = p.noise(i * 0.11) > 0.72;
    p.stroke(...hexToRgb(i % 2 ? pal.primary : pal.secondary), 70 * protect * weight);
    p.strokeWeight(lineKind === "fault-lines" ? 1.4 : 0.9);
    const x = u0 * POSTER_W;
    const y = v0 * POSTER_H;
    const len = POSTER_W * (0.18 + density * 0.28) * protect;
    p.line(x - Math.cos(angle) * len, y - Math.sin(angle) * len, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    if (cross && protect > 0.45) {
      const a2 = angle + p.HALF_PI * 0.92;
      p.stroke(...hexToRgb(pal.accent), 45 * protect * weight);
      p.line(x - Math.cos(a2) * len * 0.55, y - Math.sin(a2) * len * 0.55, x + Math.cos(a2) * len * 0.55, y + Math.sin(a2) * len * 0.55);
    }
    if (spacing > 40) {
      i += 1;
    }
  }
}

function drawCreases(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  const density = dnaProc(dna).density || 0.6;
  const folds = Math.floor(8 + density * 10);
  p.randomSeed(seed + 41);
  p.noiseSeed(seed + 41);
  p.noFill();
  for (let i = 0; i < folds; i += 1) {
    const u = p.noise(i * 0.31, 0.2);
    const v = p.noise(0.4, i * 0.27);
    if (protectionWeight(u, v, dna, spec) < 0.22) {
      continue;
    }
    const lum = sampler.at(u, v);
    const clusters = 2 + Math.floor((1 - lum) * 3);
    p.stroke(...hexToRgb(i % 2 ? pal.primary : pal.accent), 85 * weight);
    p.strokeWeight(1.1 + (1 - lum));
    for (let c = 0; c < clusters; c += 1) {
      let x = u * POSTER_W + (c - 1) * 8;
      let y = v * POSTER_H;
      p.beginShape();
      for (let s = 0; s < 18; s += 1) {
        const uu = x / POSTER_W;
        const vv = y / POSTER_H;
        const protect = protectionWeight(uu, vv, dna, spec);
        if (protect < 0.18) {
          break;
        }
        p.vertex(x, y);
        const n = p.noise(i, s * 0.2 + c);
        const turn = Math.round((n - 0.5) * 4) * 0.55;
        x += Math.cos(turn) * 14;
        y += Math.sin(turn + 0.4) * 16;
      }
      p.endShape();
    }
  }
}

function drawMarbling(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  const density = dnaProc(dna).density || 0.6;
  const ribbons = Math.floor(7 + density * 8);
  p.randomSeed(seed + 53);
  p.noiseSeed(seed + 53);
  p.noFill();
  for (let i = 0; i < ribbons; i += 1) {
    const t = i / ribbons;
    let x = POSTER_W * (0.08 + t * 0.84);
    let y = POSTER_H * (0.12 + p.noise(i) * 0.7);
    const col = t < 0.33 ? pal.primary : t < 0.66 ? pal.secondary : pal.accent;
    p.stroke(...hexToRgb(col), 70 * weight);
    p.strokeWeight(1.6 + (i % 3));
    p.beginShape();
    for (let s = 0; s < 64; s += 1) {
      const u = x / POSTER_W;
      const v = y / POSTER_H;
      const protect = protectionWeight(u, v, dna, spec);
      if (protect < 0.18) {
        p.endShape();
        p.beginShape();
        x += 10;
        y += (p.noise(i, s * 0.05) - 0.5) * 18;
        continue;
      }
      p.vertex(x, y);
      const lum = sampler.at(u, v);
      const swirl = p.noise(x * 0.003, y * 0.003) * p.TWO_PI;
      const amp = 4.2 + (1 - lum) * 3.4;
      x += Math.cos(swirl + s * 0.08 + i) * amp;
      y += Math.sin(swirl * 1.4 + i * 0.5) * amp * 0.85;
      if (x < -30 || x > POSTER_W + 30 || y < -30 || y > POSTER_H + 30) {
        break;
      }
    }
    p.endShape();
  }
}

function drawSunburst(p, dna, seed, sampler, spec, weight) {
  const pal = dnaPalette(dna);
  const density = dnaProc(dna).density || 0.6;
  const fx = Number(dna.anchors?.focalX ?? dnaComp(dna).focalX ?? 0.5);
  const fy = Number(dna.anchors?.focalY ?? dnaComp(dna).focalY ?? 0.42);
  const rays = Math.floor(16 + density * 18);
  p.randomSeed(seed + 67);
  p.noiseSeed(seed + 67);
  p.noFill();
  const cx = nx(fx);
  const cy = ny(fy);
  for (let i = 0; i < rays; i += 1) {
    const a = (i / rays) * p.TWO_PI + (p.noise(i) - 0.5) * 0.12;
    const irregular = 0.72 + p.noise(i * 0.3) * 0.45;
    p.stroke(...hexToRgb(i % 2 ? pal.accent : pal.primary), 55 * weight);
    p.strokeWeight(i % 4 === 0 ? 2.1 : 1.05);
    p.beginShape();
    for (let s = 4; s < 42; s += 1) {
      const r = s * 9 * irregular;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const u = x / POSTER_W;
      const v = y / POSTER_H;
      if (u < 0 || u > 1 || v < 0 || v > 1) {
        break;
      }
      const protect = protectionWeight(u, v, dna, spec);
      if (protect < 0.18) {
        break;
      }
      const lum = sampler.at(Math.min(1, Math.max(0, u)), Math.min(1, Math.max(0, v)));
      if (s > 18 + lum * 16) {
        break;
      }
      p.vertex(x, y);
    }
    p.endShape();
  }
}

const PATTERN_RENDERERS = {
  flow: drawFlowField,
  grid: drawGrid,
  particles: drawParticles,
  rings: drawRings,
  mesh: drawMesh,
  halftone: drawHalftone,
  hatching: drawHatching,
  creases: drawCreases,
  marbling: drawMarbling,
  sunburst: drawSunburst,
};

function drawPattern(p, name, dna, seed, sampler, spec, weight) {
  const family = grammarFamily(dna);
  if (!isTechFamily(family) && (name === "grid" || name === "mesh")) {
    drawFlowField(p, dna, seed, sampler, spec, weight);
    return;
  }
  const renderer = PATTERN_RENDERERS[name] || drawFlowField;
  renderer(p, dna, seed, sampler, spec, weight);
}

function patternPlan(dna, role) {
  const proc = dnaProc(dna);
  let primary = proc.primaryPattern || dna.pattern || "flow";
  let secondary = proc.secondaryPattern || "particles";
  const family = grammarFamily(dna);
  if (!isTechFamily(family)) {
    if (primary === "grid" || primary === "mesh") {
      primary = "flow";
    }
    if (secondary === "grid" || secondary === "mesh") {
      secondary = "particles";
    }
  }
  if (role === "hybrid") {
    return [
      { name: primary, weight: 0.78, seedShift: 0 },
      { name: secondary, weight: 0.28, seedShift: 91 },
    ];
  }
  if (role === "alternative") {
    return [
      { name: secondary, weight: 0.82, seedShift: 17 },
      { name: primary, weight: 0.18, seedShift: 140 },
    ];
  }
  if (role === "echo") {
    return [
      { name: primary, weight: 0.5, seedShift: 53 },
      { name: secondary, weight: 0.5, seedShift: 180 },
    ];
  }
  if (role === "offset") {
    return [{ name: secondary, weight: 0.9, seedShift: 240 }];
  }
  return [{ name: primary, weight: 0.72, seedShift: 0 }];
}

function relativeLuminance(rgb) {
  return (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;
}

/** Mean and spread of artwork luminance under a normalised rect. */
function localLuminance(sampler, rect) {
  let sum = 0;
  let min = 1;
  let max = 0;
  let n = 0;
  for (let v = rect.y; v <= rect.y + rect.h; v += rect.h / 6) {
    for (let u = rect.x; u <= rect.x + rect.w; u += rect.w / 8) {
      const l = sampler.at(Math.min(1, Math.max(0, u)), Math.min(1, Math.max(0, v)));
      sum += l;
      min = Math.min(min, l);
      max = Math.max(max, l);
      n += 1;
    }
  }
  return { mean: n ? sum / n : 0.3, spread: max - min };
}

/**
 * Legibility is non-negotiable: risky structural treatments degrade to safer
 * ones when the artwork underneath does not support them.
 */
function resolveTitleTreatment(structure, sampler, rect, textLum) {
  const { mean, spread } = localLuminance(sampler, rect);
  const separation = Math.abs(mean - textLum);
  let resolved = structure;
  let scrim = 0;

  if (resolved === "outline" && (spread > 0.34 || separation < 0.42)) {
    resolved = "solid";
  }
  if (resolved === "fragmented" && separation < 0.24) {
    resolved = "solid";
  }
  if (separation < 0.34) {
    scrim = Math.min(1, (0.34 - separation) / 0.34 + 0.35);
  }
  if ((resolved === "textured" || resolved === "gradient") && separation < 0.42) {
    scrim = Math.max(scrim, 0.55);
  }
  return { structure: resolved, scrim, mean, spread };
}

function ctxAlign(align) {
  return align === "center" ? "center" : align === "right" ? "right" : "left";
}

function drawTexturedLine(p, ctx, line, x, y, size, face, baseColor, textureColor) {
  const w = measureStyled(ctx, face, size, line);
  if (w <= 0) {
    return;
  }
  const pad = Math.ceil(size * 0.6);
  const off = document.createElement("canvas");
  off.width = Math.ceil(w) + pad * 2;
  off.height = Math.ceil(size * 1.7) + pad * 2;
  const o = off.getContext("2d");
  styleCtx(o, face, size);
  o.textAlign = "left";
  o.textBaseline = "top";
  o.fillStyle = `rgb(${baseColor.join(",")})`;
  o.fillText(line, pad, pad);

  // Wear only where glyphs already are, so the material lives in the letters.
  o.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 90; i += 1) {
    const sx = p.random(off.width);
    const sy = p.random(off.height);
    o.fillStyle = `rgba(${textureColor.join(",")},${0.1 + p.random() * 0.3})`;
    o.fillRect(sx, sy, p.random(3, 16), p.random(0.6, 1.8));
  }
  for (let i = 0; i < 40; i += 1) {
    o.fillStyle = `rgba(0,0,0,${0.08 + p.random() * 0.16})`;
    o.fillRect(p.random(off.width), p.random(off.height), p.random(1, 4), p.random(1, 4));
  }
  o.globalCompositeOperation = "source-over";

  const align = ctx.textAlign;
  const dx = align === "center" ? x - w / 2 - pad : align === "right" ? x - w - pad : x - pad;
  ctx.drawImage(off, dx, y - pad);
}

function drawTitleLine(p, ctx, line, x, y, size, face, treatment, colors, light) {
  const { text, secondary, accent, highlight } = colors;
  styleCtx(ctx, face, size);
  ctx.textBaseline = "top";

  if (treatment === "outline") {
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1, size / 24);
    ctx.strokeStyle = `rgb(${text.join(",")})`;
    ctx.fillStyle = `rgba(${text.join(",")},0.12)`;
    ctx.fillText(line, x, y);
    ctx.strokeText(line, x, y);
    return;
  }

  if (treatment === "gradient") {
    // Gradient runs with the scene's light, not an arbitrary axis.
    const w = measureStyled(ctx, face, size, line);
    const align = ctx.textAlign;
    const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    const g = ctx.createLinearGradient(
      left + w * (light.x > 0.5 ? 1 : 0),
      y,
      left + w * (light.x > 0.5 ? 0 : 1),
      y + size
    );
    g.addColorStop(0, `rgb(${highlight.join(",")})`);
    g.addColorStop(0.55, `rgb(${text.join(",")})`);
    g.addColorStop(1, `rgba(${secondary.join(",")},0.85)`);
    ctx.fillStyle = g;
    ctx.fillText(line, x, y);
    return;
  }

  if (treatment === "layered") {
    const off = Math.max(2, size * 0.045);
    ctx.fillStyle = `rgba(${secondary.join(",")},0.55)`;
    ctx.fillText(line, x + off, y + off);
    ctx.fillStyle = `rgba(${accent.join(",")},0.4)`;
    ctx.fillText(line, x - off * 0.6, y - off * 0.5);
    ctx.fillStyle = `rgb(${text.join(",")})`;
    ctx.fillText(line, x, y);
    return;
  }

  if (treatment === "fragmented") {
    const bands = 5;
    const bandH = (size * 1.25) / bands;
    for (let i = 0; i < bands; i += 1) {
      const shift = (p.random() - 0.5) * size * 0.12;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y + i * bandH, POSTER_W, bandH + 0.6);
      ctx.clip();
      ctx.fillStyle = i % 2 === 0 ? `rgb(${text.join(",")})` : `rgba(${text.join(",")},0.82)`;
      ctx.fillText(line, x + shift, y);
      ctx.restore();
    }
    return;
  }

  if (treatment === "textured") {
    drawTexturedLine(p, ctx, line, x, y, size, face, text, accent);
    return;
  }

  // Solid, with analog registration drift rather than RGB glitch.
  const drift = 1.1 + (p.random() - 0.5) * 0.8;
  ctx.fillStyle = `rgba(${accent.join(",")},0.32)`;
  ctx.fillText(line, x + drift, y + 0.7);
  ctx.fillStyle = `rgba(${highlight.join(",")},0.28)`;
  ctx.fillText(line, x - drift * 0.4, y - 0.6);
  ctx.fillStyle = `rgb(${text.join(",")})`;
  ctx.fillText(line, x, y);
}

function drawQuotePlate(ctx, rect, strength) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${0.3 + strength * 0.34})`;
  const r = 6;
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.lineTo(rect.x + rect.w - r, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + r);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h - r);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y + rect.h, rect.x + rect.w - r, rect.y + rect.h);
  ctx.lineTo(rect.x + r, rect.y + rect.h);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - r);
  ctx.lineTo(rect.x, rect.y + r);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTypography(p, dna, spec, sampler, seed, typeReveal, typeBlend) {
  const pal = dnaPalette(dna);
  const ctx = p.drawingContext;
  const colors = {
    text: hexToRgb(pal.text),
    secondary: hexToRgb(pal.secondary),
    accent: hexToRgb(pal.accent),
    highlight: hexToRgb(pal.highlight || pal.accent),
  };
  const face = titleFace(dna);
  const quote = quoteFace(dna);
  const light = lightOrigin(dna, seed);
  const titleA = typeReveal ? Number(typeReveal.title ?? 1) : 1;
  const quoteA = typeReveal ? Number(typeReveal.quote ?? 1) : 1;

  const isSplitColumn = spec.id === "split-editorial";
  const maxTitleWidth = spec.plan ? spec.plan.title.w : isSplitColumn ? POSTER_W * 0.4 : POSTER_W * 0.8;
  const quoteWidth = spec.quoteBox ? spec.quoteBox.w : isSplitColumn ? POSTER_W * 0.36 : POSTER_W * 0.72;
  const titleText = applyCase(dna.concept?.title || dna.title || "", face.case);

  // Scale from length and safe width, never a fixed size.
  const maxSize = face.letterforms === "hand-lettered" ? 68 : 58;
  const { lines: titleLines, size: titleSize } = fitTitleBlock(
    ctx,
    face,
    titleText,
    maxTitleWidth,
    maxSize,
    24
  );
  const lineHeight = titleSize * (face.letterforms === "hand-lettered" ? 0.92 : 1.06);
  const titleH = titleLines.length * lineHeight;

  const align = ctxAlign(spec.plan ? spec.plan.title.align : spec.align);
  const x = spec.plan
    ? spec.plan.title.align === "center"
      ? spec.plan.title.x + spec.plan.title.w / 2
      : spec.plan.title.x
    : nx(spec.title.x);
  const titleTop = spec.plan ? spec.plan.title.y : ny(spec.title.y) - titleH / 2;

  const titleRect = {
    x: Math.max(0, (align === "center" ? x - maxTitleWidth / 2 : x) / POSTER_W),
    y: Math.max(0, titleTop / POSTER_H),
    w: maxTitleWidth / POSTER_W,
    h: Math.max(0.04, titleH / POSTER_H),
  };
  const textLum = relativeLuminance(colors.text);
  const blendT = typeBlend ? Math.max(0, Math.min(1, Number(typeBlend.t ?? 1))) : 1;
  const plateSampler = sampler;
  const artSampler = typeBlend?.artSampler || sampler;
  const treatmentPlate = resolveTitleTreatment(face.structure, plateSampler, titleRect, textLum);
  const treatmentArt = typeBlend
    ? resolveTitleTreatment(face.structure, artSampler, titleRect, textLum)
    : treatmentPlate;
  const treatment = {
    structure: blendT < 0.62 ? treatmentPlate.structure : treatmentArt.structure,
    scrim: treatmentPlate.scrim + (treatmentArt.scrim - treatmentPlate.scrim) * blendT,
  };

  if (treatment.scrim > 0 && titleA > 0.02) {
    const contrast = dnaProc(dna).contrast || dna.contrast || 0.75;
    drawContrastBackdrop(p, titleTop + titleH / 2, titleH, contrast * treatment.scrim * titleA);
  }

  if (titleA > 0.02) {
    p.randomSeed(seed + 909);
    ctx.save();
    ctx.globalAlpha *= titleA;
    ctx.textAlign = align;
    titleLines.forEach((line, i) => {
      drawTitleLine(p, ctx, line, x, titleTop + i * lineHeight, titleSize, face, treatment.structure, colors, light);
    });
    ctx.restore();
  }

  // --- Quote: its own face, hierarchy, placement, and legibility technique ---
  const quoteText = String(dna.concept?.quote || dna.quote || "").trim();
  if (!quoteText || quoteA <= 0.02) {
    if (LETTER_SPACING_SUPPORTED) {
      ctx.letterSpacing = "0em";
    }
    return;
  }

  const quoteFaceSpec = {
    family: quote.family,
    weight: quote.weight,
    italic: quote.italic,
    tracking: quote.track ?? 0,
  };
  // Always clearly subordinate to the title.
  const quoteSize = Math.max(
    quote.min,
    Math.min(titleSize * quote.ratio, titleSize * 0.5, 22)
  );
  const quoteBody = quote.upper ? quoteText.toUpperCase() : quoteText;
  const quoteLead = quoteSize * quote.lead;
  const quoteLines = wrapStyled(ctx, quoteFaceSpec, quoteSize, quoteBody, quoteWidth, 3);
  const quoteH = quoteLines.length * quoteLead;

  let quoteTop;
  if (spec.quoteBox) {
    quoteTop = spec.quoteBox.y;
  } else if (spec.quoteAnchor === null || spec.quoteAnchor === undefined) {
    quoteTop = titleTop + titleH + Math.max(14, titleSize * 0.34);
  } else {
    quoteTop = ny(spec.quoteAnchor) - quoteH / 2;
  }
  const outerMargin = window.FrameFluxSystems ? window.FrameFluxSystems.MARGIN : 34;
  const bottomLimit = POSTER_H - (spec.inset > 0 ? spec.inset * POSTER_W * 1.9 : outerMargin) - quoteH;
  quoteTop = Math.max(outerMargin, Math.min(quoteTop, bottomLimit));
  const quoteX = spec.quoteBox
    ? spec.quoteBox.align === "center"
      ? spec.quoteBox.x + spec.quoteBox.w / 2
      : spec.quoteBox.x
    : x;

  const quoteRect = {
    x: Math.max(0, (spec.quoteBox ? spec.quoteBox.x : align === "center" ? x - quoteWidth / 2 : x) / POSTER_W),
    y: quoteTop / POSTER_H,
    w: quoteWidth / POSTER_W,
    h: Math.max(0.02, quoteH / POSTER_H),
  };
  const quoteColor = quote.style === "caption" ? colors.accent : colors.text;
  const quoteLumPlate = localLuminance(plateSampler, quoteRect);
  const quoteLumArt = typeBlend ? localLuminance(artSampler, quoteRect) : quoteLumPlate;
  const quoteLum = {
    mean: quoteLumPlate.mean + (quoteLumArt.mean - quoteLumPlate.mean) * blendT,
    spread: quoteLumPlate.spread + (quoteLumArt.spread - quoteLumPlate.spread) * blendT,
  };
  const quoteSeparation = Math.abs(quoteLum.mean - relativeLuminance(quoteColor));

  function quoteTechniqueFor(lum) {
    const sep = Math.abs(lum.mean - relativeLuminance(quoteColor));
    let next = quote.legibility;
    if (next === "none" && sep < 0.3) {
      next = "scrim";
    }
    if (next === "scrim" && sep < 0.16) {
      next = "plate";
    }
    if (next === "shadow" && lum.spread > 0.42 && sep < 0.24) {
      next = "plate";
    }
    if (isLightGround(dna) && (next === "plate" || next === "scrim")) {
      next = "none";
    }
    return next;
  }

  const techniquePlate = quoteTechniqueFor(quoteLumPlate);
  const techniqueArt = typeBlend ? quoteTechniqueFor(quoteLumArt) : techniquePlate;
  const technique = blendT < 0.62 ? techniquePlate : techniqueArt;
  const measuredWidest = Math.max(
    ...quoteLines.map((l) => measureStyled(ctx, quoteFaceSpec, quoteSize, l)),
    0
  );
  if (technique === "plate") {
    const padX = 14;
    const padY = 10;
    const plateX =
      spec.quoteBox
        ? spec.quoteBox.x - padX
        : align === "center"
          ? x - measuredWidest / 2 - padX
          : align === "right"
            ? x - measuredWidest - padX
            : x - padX;
    ctx.save();
    ctx.globalAlpha *= quoteA;
    drawQuotePlate(
      p.drawingContext,
      { x: plateX, y: quoteTop - padY, w: measuredWidest + padX * 2, h: quoteH + padY * 1.6 },
      1 - Math.min(1, quoteSeparation / 0.34)
    );
    ctx.restore();
  } else if (technique === "scrim") {
    drawContrastBackdrop(p, quoteTop + quoteH / 2, quoteH * 0.9, 0.42 * quoteA);
  }

  ctx.save();
  ctx.globalAlpha *= quoteA;
  ctx.textAlign = spec.quoteBox ? "left" : align;
  ctx.textBaseline = "top";
  styleCtx(ctx, quoteFaceSpec, quoteSize);
  if (technique === "shadow") {
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = Math.max(4, quoteSize * 0.5);
    ctx.shadowOffsetY = 1;
  }
  ctx.fillStyle = `rgba(${quoteColor.join(",")},${quote.style === "caption" ? 0.95 : 0.9})`;
  const decorated =
    quote.style === "editorial-italic" || quote.style === "handwritten"
      ? quoteLines.map((l, i) =>
          `${i === 0 ? "“" : ""}${l}${i === quoteLines.length - 1 ? "”" : ""}`
        )
      : quoteLines;
  decorated.forEach((line, i) => {
    ctx.fillText(line, quoteX, quoteTop + i * quoteLead);
  });
  ctx.restore();

  if (LETTER_SPACING_SUPPORTED) {
    ctx.letterSpacing = "0em";
  }
}

function easeInOutCubic(t) {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function drawTransitionVeil(p, t, seed) {
  const amount = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI);
  if (amount < 0.02) {
    return;
  }
  p.randomSeed(seed + Math.floor((typeof performance !== "undefined" ? performance.now() : 0) / 80));
  p.noStroke();
  const n = Math.floor(220 * amount);
  for (let i = 0; i < n; i++) {
    p.fill(228, 218, 198, p.random(10, 70) * amount);
    p.rect(p.random(POSTER_W), p.random(POSTER_H), p.random(1, 2.4), p.random(1, 2.4));
  }
  p.stroke(8, 6, 4, 16 * amount);
  p.strokeWeight(1);
  for (let y = 0; y < POSTER_H; y += 3) {
    p.line(0, y, POSTER_W, y);
  }
  p.noStroke();
}

function drawDevelopVeil(p, develop, seed) {
  const grain = Number(develop.grain ?? 0);
  const exposure = Number(develop.exposure ?? 1);
  if (grain > 0.02) {
    p.randomSeed(seed + Math.floor((typeof performance !== "undefined" ? performance.now() : 0) / 160));
    p.noStroke();
    const n = Math.floor(280 * grain);
    for (let i = 0; i < n; i++) {
      p.fill(228, 218, 198, p.random(12, 80) * grain);
      p.rect(p.random(POSTER_W), p.random(POSTER_H), p.random(1, 2.6), p.random(1, 2.6));
    }
  }
  if (exposure < 0.995) {
    p.noStroke();
    p.fill(6, 5, 4, (1 - exposure) * 248);
    p.rect(0, 0, POSTER_W, POSTER_H);
  }
}

function dummySampler() {
  return {
    at: () => 0.42,
    edge: () => 0.08,
    brightest: { u: 0.5, v: 0.42, l: 0.42 },
  };
}

function drawEmptyMount(p) {
  const paper = [232, 224, 210];
  const ink = [236, 230, 216];
  const margin = 44;
  const mark = 22;
  const gap = 7;
  const x = margin;
  const y = margin;
  const w = POSTER_W - margin * 2;
  const h = POSTER_H - margin * 2;
  p.background(12, 10, 8);
  p.noStroke();
  p.fill(paper[0], paper[1], paper[2], 22);
  p.rect(x, y, w, h);
  p.noFill();
  p.stroke(ink[0], ink[1], ink[2], 38);
  p.strokeWeight(1);
  p.rect(x + 0.5, y + 0.5, w - 1, h - 1);
  p.stroke(ink[0], ink[1], ink[2], 70);
  p.strokeWeight(1.15);
  const corners = [
    [x, y, -1, -1],
    [x + w, y, 1, -1],
    [x, y + h, -1, 1],
    [x + w, y + h, 1, 1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    p.line(cx + dx * gap, cy, cx + dx * (gap + mark), cy);
    p.line(cx, cy + dy * gap, cx, cy + dy * (gap + mark));
  }
  p.stroke(ink[0], ink[1], ink[2], 22);
  p.strokeWeight(0.7);
  p.line(POSTER_W / 2, y - gap - mark * 0.45, POSTER_W / 2, y - gap);
  p.line(POSTER_W / 2, y + h + gap, POSTER_W / 2, y + h + gap + mark * 0.45);
  p.line(x - gap - mark * 0.45, POSTER_H / 2, x - gap, POSTER_H / 2);
  p.line(x + w + gap, POSTER_H / 2, x + w + gap + mark * 0.45, POSTER_H / 2);
}

const LIVING_PLATE = {
  geometry: 7,
  atmosphere: 16,
  narrative: 25,
  print: 29,
  type: 29,
  complete: 38,
  shadeOut: 35,
  frameOut: 40,
  statusOut: 40,
};

function livingGate(elapsed, start, dur) {
  if (elapsed < start) {
    return 0;
  }
  if (dur <= 0) {
    return 1;
  }
  return easeInOutCubic((elapsed - start) / dur);
}

function livingLayers(elapsed) {
  const t = Math.max(0, elapsed);
  const typeAt = LIVING_PLATE.type;
  const gridHold = t >= typeAt ? 1 - livingGate(t, typeAt, 1.1) : 1;
  const shadeHold = t >= LIVING_PLATE.shadeOut ? 1 - livingGate(t, LIVING_PLATE.shadeOut, 1.2) : 1;
  const frameHold = t >= LIVING_PLATE.frameOut ? 1 - livingGate(t, LIVING_PLATE.frameOut, 1.1) : 1;
  const statusHold = t >= LIVING_PLATE.statusOut ? 1 - livingGate(t, LIVING_PLATE.statusOut, 1.1) : 1;
  return {
    elapsed: t,
    geometry: livingGate(t, 0, 1.6),
    wash: livingGate(t, LIVING_PLATE.geometry, 5),
    topography: livingGate(t, LIVING_PLATE.geometry, 8) * shadeHold,
    grid: livingGate(t, LIVING_PLATE.geometry + 1, 6) * gridHold,
    anchor: livingGate(t, LIVING_PLATE.atmosphere, 5),
    contour: Math.max(0, Math.min(1, (t - LIVING_PLATE.atmosphere) / (LIVING_PLATE.narrative - LIVING_PLATE.atmosphere))),
    specks: livingGate(t, LIVING_PLATE.narrative, LIVING_PLATE.print - LIVING_PLATE.narrative),
    halftone: livingGate(t, LIVING_PLATE.narrative + 0.5, LIVING_PLATE.print - LIVING_PLATE.narrative - 0.5),
    type: t >= typeAt ? 1 : 0,
    frame: livingGate(t, 0, 1.6) * frameHold,
    status: t >= typeAt ? statusHold : 0,
  };
}

function drawPlateHorizon(p, dna, seed, spec) {
  const pal = dnaPalette(dna);
  const secondary = hexToRgb(pal.secondary);
  const spatial = dnaSemantic(dna).spatial || "isolated";
  const material = dnaSemantic(dna).material || "paper";
  const family = grammarFamily(dna);
  const horizon =
    spatial === "rising" || spatial === "expanding"
      ? 0.62
      : spatial === "claustrophobic" || spatial === "compressed"
        ? 0.4
        : spec.id === "off-center-top"
          ? 0.42
          : spec.id === "off-center-bottom"
            ? 0.58
            : 0.52;
  if (["adventure", "thriller", "scifi", "horror", "mystery", "historical"].includes(family)) {
    p.stroke(...secondary, material === "concrete" || material === "stone" ? 55 : 28);
    p.strokeWeight(1.1);
    const groundLines = spatial === "expansive" ? 4 : spatial === "claustrophobic" ? 10 : 6;
    for (let i = 0; i < groundLines; i += 1) {
      const x = nx(0.06 + i * (0.88 / Math.max(1, groundLines - 1)));
      p.line(x, ny(horizon), x + (p.noise(i * 0.4) - 0.5) * 36, ny(0.94));
    }
    p.noFill();
    p.stroke(...hexToRgb(pal.accent), 14);
    p.strokeWeight(1);
    p.line(0, ny(horizon), POSTER_W, ny(horizon));
  } else if (family === "romance") {
    p.noFill();
    p.stroke(...secondary, 40);
    p.strokeWeight(1.4);
    p.beginShape();
    for (let x = 0; x <= POSTER_W; x += 8) {
      p.vertex(x, ny(horizon) + Math.sin(x * 0.018) * 10);
    }
    p.endShape();
  }
}

function drawPlateGeometry(p, dna, seed, spec, alpha) {
  const pal = dnaPalette(dna);
  const bg = hexToRgb(pal.background);
  p.background(...bg);
  if (alpha < 0.01) {
    return;
  }
  p.noiseSeed(seed);
  p.randomSeed(seed);
  const ctx = p.drawingContext;
  ctx.save();
  ctx.globalAlpha *= alpha;
  drawPlateHorizon(p, dna, seed, spec);
  ctx.restore();
  p.blendMode(p.BLEND);
}

function drawLivingFrame(p, dna, seed, plan, alpha) {
  if (!window.FrameFluxSystems || alpha < 0.01 || !plan) {
    return;
  }
  const ctx = p.drawingContext;
  ctx.save();
  ctx.globalAlpha *= alpha;
  window.FrameFluxSystems.drawCentralFrame(p, dna, seed, plan);
  ctx.restore();
  p.blendMode(p.BLEND);
}

function drawPlateAtmosphere(p, dna, seed, spec, wash, topography) {
  const pal = dnaPalette(dna);
  const primary = hexToRgb(pal.primary);
  const secondary = hexToRgb(pal.secondary);
  const plan = spec.plan;
  const fx = plan ? plan.focalX : Number(dnaComp(dna).focalX ?? 0.5);
  const fy = plan ? plan.focalY : Number(dnaComp(dna).focalY ?? 0.42);
  const material = dnaSemantic(dna).material || "paper";
  const ctx = p.drawingContext;
  if (topography > 0.01 && window.FrameFluxSystems) {
    ctx.save();
    ctx.globalAlpha *= topography;
    window.FrameFluxSystems.drawTopographyShade(p, dna, seed, plan || {});
    ctx.restore();
    p.blendMode(p.BLEND);
  }
  if (wash > 0.01 && (material === "smoke" || material === "dust" || material === "water")) {
    ctx.save();
    ctx.globalAlpha *= wash;
    const haze = ctx.createRadialGradient(nx(fx), ny(fy), 10, nx(fx), ny(fy), POSTER_W * 0.55);
    const c = material === "water" ? secondary : primary;
    haze.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.28)`);
    haze.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);
    ctx.restore();
  }
}

function finishFrame(p, dna, spec) {
  const pal = dnaPalette(dna);
  const bg = hexToRgb(pal.background);
  if (spec.inset > 0) {
    const m = spec.inset * POSTER_W;
    p.noFill();
    p.stroke(...hexToRgb(pal.accent), 70);
    p.strokeWeight(1);
    p.rect(m, m * 1.4, POSTER_W - m * 2, POSTER_H - m * 2.8);
    p.noStroke();
    p.fill(...bg);
    p.rect(0, 0, POSTER_W, m * 1.2);
    p.rect(0, POSTER_H - m * 1.2, POSTER_W, m * 1.2);
    p.rect(0, 0, m, POSTER_H);
    p.rect(POSTER_W - m, 0, m, POSTER_H);
  }
  if (spec.split > 0) {
    p.noStroke();
    p.fill(...bg, 70);
    p.rect(0, 0, POSTER_W * spec.split, POSTER_H);
  }
}

function createPoster(containerId, options = {}) {
  let current = null;
  let seed = 1;
  let role = "signature";
  let keyArt = null;
  let develop = null;
  let p5Instance = null;
  let plateBuf = null;
  let artBuf = null;
  let maskBuf = null;
  let liveBuf = null;
  let expose = null;
  let exposeRaf = 0;
  let exposeGen = 0;
  let livingRaf = 0;
  let livingGen = 0;
  let liveCache = {
    frozen: null,
    geo: null,
    atmosphere: null,
    narrative: null,
    print: null,
    typeSampler: null,
    typeLocked: false,
  };
  const density = options.pixelDensity || 2;

  function ensureBuf(existing) {
    if (existing) {
      return existing;
    }
    const g = p5Instance.createGraphics(POSTER_W, POSTER_H);
    g.pixelDensity(density);
    g.noLoop();
    g.textAlign(g.LEFT, g.TOP);
    return g;
  }

  function layoutFor(dna, nextSeed) {
    const grid = window.FrameFluxSystems ? window.FrameFluxSystems.makeGrid() : null;
    const plan = window.FrameFluxSystems ? window.FrameFluxSystems.compositionPlan(dna, nextSeed, grid) : null;
    const spec = typeLayout(dna, layoutSpec(dnaComp(dna).layout || dna.layout), plan);
    return { grid, plan, spec };
  }

  function livingElapsed() {
    if (!develop || !develop.living || !develop.startedAt) {
      return 0;
    }
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    return Math.max(0, ((now - develop.startedAt) / 1000) * (develop.speed || 1));
  }

  function resetLiveCache() {
    liveCache = {
      frozen: null,
      geo: null,
      atmosphere: null,
      narrative: null,
      print: null,
      typeSampler: null,
      typeLocked: false,
    };
  }

  function captureLive(existing, paint) {
    const g = ensureBuf(existing);
    g.clear();
    paint(g);
    return g;
  }

  function paintLiving(target, elapsed, { skipType = false } = {}) {
    const dna = current;
    const nextSeed = seed;
    const layers = livingLayers(elapsed);
    const frozen = liveCache.frozen || layoutFor(dna, nextSeed);
    liveCache.frozen = frozen;
    const { plan, spec } = frozen;
    const fx = plan ? plan.focalX : Number(dnaComp(dna).focalX ?? 0.5);
    const fy = plan ? plan.focalY : Number(dnaComp(dna).focalY ?? 0.42);

    if (layers.elapsed >= LIVING_PLATE.geometry && !liveCache.geo) {
      liveCache.geo = captureLive(liveCache.geo, (g) => {
        drawPlateGeometry(g, dna, nextSeed, spec, 1);
      });
    }
    if (layers.elapsed >= LIVING_PLATE.atmosphere && liveCache.geo && !liveCache.atmosphere) {
      liveCache.atmosphere = captureLive(liveCache.atmosphere, (g) => {
        g.image(liveCache.geo, 0, 0, POSTER_W, POSTER_H);
        drawPlateAtmosphere(g, dna, nextSeed, spec, 1, 0);
      });
    }
    if (layers.elapsed >= LIVING_PLATE.narrative && liveCache.atmosphere && !liveCache.narrative) {
      liveCache.narrative = captureLive(liveCache.narrative, (g) => {
        g.image(liveCache.atmosphere, 0, 0, POSTER_W, POSTER_H);
        drawNarrativeAnchor(g, dna, nextSeed, fx, fy);
        if (window.FrameFluxSystems) {
          window.FrameFluxSystems.drawContourField(g, dna, nextSeed, plan, 1);
        }
      });
    }
    if (layers.elapsed >= LIVING_PLATE.print && liveCache.narrative && !liveCache.print) {
      liveCache.print = captureLive(liveCache.print, (g) => {
        g.image(liveCache.narrative, 0, 0, POSTER_W, POSTER_H);
        drawMaterialGrain(g, dna, nextSeed, materialEmphasis(dna, nextSeed));
        if (window.FrameFluxSystems) {
          window.FrameFluxSystems.drawPrintFinish(g, dna, nextSeed, dummySampler());
        }
      });
    }

    if (liveCache.print && layers.elapsed >= LIVING_PLATE.print) {
      target.image(liveCache.print, 0, 0, POSTER_W, POSTER_H);
    } else if (liveCache.narrative && layers.elapsed >= LIVING_PLATE.narrative) {
      target.image(liveCache.narrative, 0, 0, POSTER_W, POSTER_H);
      if (layers.specks > 0.01) {
        target.push();
        target.drawingContext.globalAlpha *= layers.specks;
        drawMaterialGrain(target, dna, nextSeed, materialEmphasis(dna, nextSeed) * layers.specks);
        if (window.FrameFluxSystems && layers.halftone > 0.01) {
          target.drawingContext.globalAlpha *= layers.halftone;
          window.FrameFluxSystems.drawPrintFinish(target, dna, nextSeed, dummySampler());
        }
        target.pop();
        target.blendMode(target.BLEND);
      }
    } else if (liveCache.atmosphere && layers.elapsed >= LIVING_PLATE.atmosphere) {
      target.image(liveCache.atmosphere, 0, 0, POSTER_W, POSTER_H);
      if (layers.anchor > 0.01) {
        target.push();
        target.drawingContext.globalAlpha *= layers.anchor;
        drawNarrativeAnchor(target, dna, nextSeed, fx, fy);
        target.pop();
        target.blendMode(target.BLEND);
      }
      if (window.FrameFluxSystems && layers.contour > 0) {
        window.FrameFluxSystems.drawContourField(target, dna, nextSeed, plan, layers.contour);
      }
    } else if (liveCache.geo && layers.elapsed >= LIVING_PLATE.geometry) {
      target.image(liveCache.geo, 0, 0, POSTER_W, POSTER_H);
      drawPlateAtmosphere(target, dna, nextSeed, spec, layers.wash, 0);
    } else {
      drawPlateGeometry(target, dna, nextSeed, spec, Math.max(layers.geometry, 0.12));
    }

    if (layers.topography > 0.01) {
      drawPlateAtmosphere(target, dna, nextSeed, spec, 0, layers.topography);
    }
    drawLivingFrame(target, dna, nextSeed, plan, layers.frame);

    finishFrame(target, dna, spec);

    if (window.FrameFluxSystems && layers.grid > 0.01) {
      window.FrameFluxSystems.drawConstructionGrid(target, dna, plan, layers.grid);
    }

    if (skipType || layers.type < 1) {
      return { plan, spec, layers };
    }

    if (!liveCache.typeSampler) {
      liveCache.typeSampler = liveCache.print ? buildSampler(liveCache.print) : dummySampler();
      liveCache.typeLocked = true;
    }
    drawTypography(target, dna, spec, liveCache.typeSampler, nextSeed, { quote: 1, title: 1 }, null);
    if (window.FrameFluxSystems) {
      window.FrameFluxSystems.drawRefLabel(target, dna, nextSeed, plan);
      if (layers.status > 0.01) {
        target.push();
        target.drawingContext.globalAlpha *= layers.status;
        window.FrameFluxSystems.drawStatusColumn(target, dna, nextSeed, plan);
        target.pop();
        target.blendMode(target.BLEND);
      }
    }
    return { plan, spec, layers };
  }

  function stopLiving() {
    livingGen += 1;
    if (livingRaf) {
      cancelAnimationFrame(livingRaf);
      livingRaf = 0;
    }
    if (develop) {
      develop.living = false;
    }
  }

  function startLivingLoop() {
    const gen = ++livingGen;
    const tick = (now) => {
      if (gen !== livingGen || !develop || !develop.living || !current) {
        return;
      }
      p5Instance.redraw();
      const elapsed = livingElapsed();
      const interval =
        elapsed >= LIVING_PLATE.atmosphere && elapsed < LIVING_PLATE.narrative ? 33 : 55;
      livingRaf = requestAnimationFrame(function queued(t2) {
        if (gen !== livingGen) {
          return;
        }
        if (t2 - now < interval) {
          livingRaf = requestAnimationFrame(queued);
          return;
        }
        tick(t2);
      });
    };
    livingRaf = requestAnimationFrame(tick);
    p5Instance.redraw();
  }

  function paintPoster(target, { dna, nextSeed, nextRole, image, nextDevelop, skipType, frozen, typeBlend, typeReveal }) {
    target.randomSeed(nextSeed);
    target.noiseSeed(nextSeed);
    if (image && nextRole === "hybrid") {
      drawPureStill(target, image);
      return { plan: null, spec: null, sampler: dummySampler() };
    }
    const { plan, spec } = frozen || layoutFor(dna, nextSeed);
    if (image) {
      target.background(...hexToRgb(dnaPalette(dna).background));
      drawKeyArt(target, image, spec);
      if (window.FrameFluxSystems) {
        window.FrameFluxSystems.drawContourField(target, dna, nextSeed, plan);
      }
      drawMaterialGrain(target, dna, nextSeed, materialEmphasis(dna, nextSeed) * 0.35);
    } else {
      drawCinematicPlate(target, dna, nextSeed, spec);
      finishFrame(target, dna, spec);
    }
    const sampler = buildSampler(target);
    const intensity = Number(dnaProc(dna).intensity || 0.55);
    const air = Number(dnaComp(dna).negativeSpace ?? 0.5);
    target.push();
    target.blendMode(target.BLEND);
    for (const layer of patternPlan(dna, nextRole)) {
      const quiet = spec.mode === "quiet-minimal" ? 0.45 : 1;
      drawPattern(
        target,
        layer.name,
        dna,
        nextSeed + layer.seedShift,
        sampler,
        spec,
        layer.weight * (0.55 + intensity * 0.25) * quiet * (1.05 - air * 0.35)
      );
    }
    target.pop();
    target.blendMode(target.BLEND);
    if (window.FrameFluxSystems) {
      window.FrameFluxSystems.drawConnectionLines(target, dna, nextSeed, plan, spec);
      if (!image) {
        window.FrameFluxSystems.drawStatusColumn(target, dna, nextSeed, plan);
      }
    }
    if (nextDevelop && !image) {
      drawDevelopVeil(target, nextDevelop, nextSeed);
    }
    if (skipType) {
      return { plan, spec, sampler };
    }
    const reveal = typeReveal || (nextDevelop && !image
      ? { quote: Number(nextDevelop.quote ?? 1), title: Number(nextDevelop.title ?? 1) }
      : null);
    drawTypography(target, dna, spec, sampler, nextSeed, reveal, typeBlend);
    if (window.FrameFluxSystems && (!reveal || reveal.title > 0.55)) {
      window.FrameFluxSystems.drawRefLabel(target, dna, nextSeed, plan);
      const afterType = buildSampler(target);
      window.FrameFluxSystems.drawPrintFinish(target, dna, nextSeed, afterType);
    }
    return { plan, spec, sampler };
  }

  function blitMaskedArt(t, fx, fy) {
    maskBuf.clear();
    maskBuf.image(artBuf, 0, 0, POSTER_W, POSTER_H);
    const ctx = maskBuf.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    const cx = fx * POSTER_W;
    const cy = fy * POSTER_H;
    const maxR = Math.sqrt(POSTER_W * POSTER_W + POSTER_H * POSTER_H);
    const eased = easeInOutCubic(t);
    const radius = Math.max(8, maxR * (0.03 + eased * 1.18));
    const inner = Math.max(0, radius * (0.28 + eased * 0.55));
    const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, radius);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.58, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);
    ctx.restore();
    p5Instance.image(maskBuf, 0, 0, POSTER_W, POSTER_H);
  }

  function stopExposeLoop() {
    if (exposeRaf) {
      cancelAnimationFrame(exposeRaf);
      exposeRaf = 0;
    }
  }

  function cancelExpose() {
    exposeGen += 1;
    stopExposeLoop();
    expose = null;
  }

  const sketch = (p) => {
    p.setup = function setup() {
      const canvas = p.createCanvas(POSTER_W, POSTER_H);
      p.pixelDensity(density);
      p.noLoop();
      p.textAlign(p.LEFT, p.TOP);
      canvas.elt.style.width = "100%";
      canvas.elt.style.height = "auto";
      canvas.elt.style.maxWidth = "100%";
    };

    p.draw = function draw() {
      if (!current) {
        drawEmptyMount(p);
        return;
      }

      if (expose && expose.image) {
        p.image(plateBuf, 0, 0, POSTER_W, POSTER_H);
        blitMaskedArt(expose.t, expose.focalX, expose.focalY);
        drawTransitionVeil(p, expose.t, seed);
        const t = easeInOutCubic(expose.t);
        const frozen = expose.spec;
        const sampler = expose.plateSampler;
        drawTypography(
          p,
          current,
          frozen,
          sampler,
          seed,
          null,
          { t, artSampler: expose.artSampler }
        );
        if (window.FrameFluxSystems && t > 0.55 && expose.plan) {
          window.FrameFluxSystems.drawRefLabel(p, current, seed, expose.plan);
        }
        return;
      }

      if (develop && develop.living && !keyArt) {
        paintLiving(p, livingElapsed());
        return;
      }

      paintPoster(p, {
        dna: current,
        nextSeed: seed,
        nextRole: role,
        image: keyArt,
        nextDevelop: develop,
      });
    };
  };

  p5Instance = new p5(sketch, containerId);

  return {
    render(params, nextSeed, nextRole, image, nextDevelop, opts = {}) {
      if (opts.cancelExpose !== false) {
        cancelExpose();
      }
      const prevSeed = seed;
      const prevRole = role;
      current = params;
      seed = nextSeed;
      role = nextRole || "signature";
      keyArt = image || null;
      develop = nextDevelop || null;
      if (develop && develop.living && !keyArt) {
        if (prevSeed !== seed || prevRole !== role) {
          resetLiveCache();
        }
        if (!livingRaf) {
          startLivingLoop();
        } else {
          p5Instance.redraw();
        }
        return;
      }
      stopLiving();
      p5Instance.redraw();
      ensureTypeFaces(params).then((loaded) => {
        if (loaded && current === params && !develop && !expose) {
          p5Instance.redraw();
        }
      });
    },
    startLiving(params, nextSeed, nextRole, nextDevelop) {
      cancelExpose();
      stopLiving();
      current = params;
      seed = nextSeed;
      role = nextRole || "signature";
      keyArt = null;
      develop = nextDevelop || { living: true, startedAt: performance.now(), speed: 1 };
      develop.living = true;
      if (!develop.startedAt) {
        develop.startedAt = performance.now();
      }
      resetLiveCache();
      startLivingLoop();
    },
    stopLiving,
    exposeKeyArt(image, { duration = 1400 } = {}) {
      const elapsed = livingElapsed();
      stopLiving();
      cancelExpose();
      const gen = exposeGen;
      develop = null;
      if (!current || !image || duration <= 0 || role === "hybrid") {
        keyArt = image || null;
        p5Instance.redraw();
        return Promise.resolve(!!image);
      }
      plateBuf = ensureBuf(plateBuf);
      artBuf = ensureBuf(artBuf);
      maskBuf = ensureBuf(maskBuf);
      const frozen = liveCache.frozen || layoutFor(current, seed);
      paintLiving(plateBuf, Math.max(elapsed, 0.01), { skipType: true });
      const artPass = paintPoster(artBuf, {
        dna: current,
        nextSeed: seed,
        nextRole: role,
        image,
        nextDevelop: null,
        skipType: true,
        frozen,
      });
      const typeSampler = liveCache.typeSampler || dummySampler();
      liveCache.typeSampler = typeSampler;
      liveCache.typeLocked = true;
      const fx = frozen.plan ? frozen.plan.focalX : Number(dnaComp(current).focalX ?? 0.5);
      const fy = frozen.plan ? frozen.plan.focalY : Number(dnaComp(current).focalY ?? 0.42);
      expose = {
        image,
        t: 0,
        startedAt: typeof performance !== "undefined" ? performance.now() : Date.now(),
        duration,
        spec: frozen.spec,
        plan: frozen.plan,
        plateSampler: typeSampler,
        artSampler: typeSampler,
        focalX: fx,
        focalY: fy,
      };
      p5Instance.redraw();
      return new Promise((resolve) => {
        const tick = (now) => {
          if (gen !== exposeGen || !expose) {
            resolve(false);
            return;
          }
          const t = Math.max(0, Math.min(1, (now - expose.startedAt) / expose.duration));
          expose.t = t;
          p5Instance.redraw();
          if (t >= 1) {
            stopExposeLoop();
            expose = null;
            keyArt = image;
            p5Instance.redraw();
            resolve(true);
            return;
          }
          exposeRaf = requestAnimationFrame(tick);
        };
        exposeRaf = requestAnimationFrame(tick);
      });
    },
    cancelExpose,
    keyArt() {
      return keyArt;
    },
    loadImage(dataUrl) {
      return new Promise((resolve) => {
        if (!dataUrl) {
          resolve(null);
          return;
        }
        p5Instance.loadImage(
          dataUrl,
          (img) => resolve(img),
          () => resolve(null)
        );
      });
    },
    download(filename) {
      p5Instance.saveCanvas(filename, "png");
    },
    async exportPrint({ scale = 4, filename = "frameflux-print" } = {}) {
      if (!current || !p5Instance) {
        return null;
      }
      const spec = PRINT_SCALES[scale] || PRINT_SCALES[4];
      await ensureTypeFaces(current);
      let g = null;
      let usedScale = spec.scale;
      const renderAt = (mul) => {
        const buf = p5Instance.createGraphics(POSTER_W, POSTER_H);
        buf.pixelDensity(mul);
        buf.noLoop();
        buf.textAlign(buf.LEFT, buf.TOP);
        if (buf.elt) {
          buf.elt.style.position = "fixed";
          buf.elt.style.left = "-9999px";
          buf.elt.setAttribute("aria-hidden", "true");
        }
        paintPoster(buf, {
          dna: current,
          nextSeed: seed,
          nextRole: role,
          image: keyArt,
          nextDevelop: null,
        });
        const width = buf.elt ? buf.elt.width : POSTER_W * mul;
        const height = buf.elt ? buf.elt.height : POSTER_H * mul;
        if (width < POSTER_W * mul || height < POSTER_H * mul) {
          buf.remove();
          throw new Error("print-buffer-small");
        }
        return buf;
      };
      try {
        try {
          g = renderAt(spec.scale);
        } catch (err) {
          if (spec.scale > 4) {
            usedScale = 4;
            g = renderAt(4);
          } else {
            throw err;
          }
        }
        const used = PRINT_SCALES[usedScale] || PRINT_SCALES[4];
        const blob = await new Promise((resolve, reject) => {
          const canvas = g.elt;
          if (!canvas || typeof canvas.toBlob !== "function") {
            reject(new Error("Could not encode print."));
            return;
          }
          canvas.toBlob((file) => {
            if (file) {
              resolve(file);
            } else {
              reject(new Error("Could not encode print."));
            }
          }, "image/png");
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}-${used.width}x${used.height}.png`;
        link.rel = "noopener";
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
        return {
          scale: used.scale,
          width: used.width,
          height: used.height,
          inches: used.inches,
          dpi: used.dpi,
        };
      } finally {
        if (g) {
          g.remove();
        }
      }
    },
    hasPoster() {
      return current !== null;
    },
    canvas() {
      return p5Instance.canvas;
    },
  };
}

window.FrameFluxPoster = {
  LIVING_PLATE,
  PRINT_SCALES,
  createPoster,
  layoutSpec,
  typeLayout,
  titleFace,
  quoteFace,
  applyCase,
  wrapStyled,
  fitTitleBlock,
  resolveTitleTreatment,
  LETTERFORM_FAMILY,
  QUOTE_STYLE_FACE,
};
