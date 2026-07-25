import { bresenhamLine } from '../engine/algorithms/line-algo.js';
import { circlePoints } from '../engine/algorithms/circle-algo.js';
import { renderPixels } from '../engine/core/render.js';
import { parseUint32ToHex, parseColorToUint32 } from '../engine/core/color-utils.js';
import { pixelMap, GRID_WIDTH, GRID_HEIGHT } from '../engine/core/state.js';

// ── Module-level state ─────────────────────────────────────────────────────
let _anchors   = new Map();   // name → { x, y }
let _clipboard = null;         // { w, h, data: Uint32Array }
let _stamps    = new Map();   // name → { palette, data[] }  (named sprites)

// ── Internal helpers ───────────────────────────────────────────────────────

/** Bresenham ellipse — yields (x, y) outline points */
function* ellipsePoints(cx, cy, rx, ry) {
  let x = 0, y = ry;
  let rx2 = rx * rx, ry2 = ry * ry;
  let p = Math.round(ry2 - rx2 * ry + 0.25 * rx2);
  const emit = (x, y) => [[cx+x,cy+y],[cx-x,cy+y],[cx+x,cy-y],[cx-x,cy-y]];
  while (2 * ry2 * x <= 2 * rx2 * y) {
    for (const [ex, ey] of emit(x, y)) yield { x: ex, y: ey };
    x++;
    if (p < 0) p += 2 * ry2 * x + ry2;
    else { y--; p += 2 * ry2 * x - 2 * rx2 * y + ry2; }
  }
  p = Math.round(ry2 * (x + 0.5) ** 2 + rx2 * (y - 1) ** 2 - rx2 * ry2);
  while (y >= 0) {
    for (const [ex, ey] of emit(x, y)) yield { x: ex, y: ey };
    y--;
    if (p > 0) p += rx2 - 2 * rx2 * y;
    else { x++; p += 2 * ry2 * x - 2 * rx2 * y + rx2; }
  }
}

/** Fill ellipse scanlines */
function ellipseFilled(cx, cy, rx, ry, cb) {
  for (let y = -ry; y <= ry; y++) {
    const x = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2));
    for (let col = cx - x; col <= cx + x; col++) cb(col, cy + y);
  }
}

/** Connect polygon points with Bresenham lines */
function polygonOutline(points, cb) {
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    bresenhamLine(a.x, a.y, b.x, b.y, cb);
  }
}

/** Scanline fill for convex/simple polygon */
function polygonFilled(points, cb) {
  if (!points.length) return;
  let minY = Infinity, maxY = -Infinity;
  for (const p of points) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i+1) % points.length];
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
        xs.push(Math.round(a.x + (y - a.y) / (b.y - a.y) * (b.x - a.x)));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k < xs.length - 1; k += 2)
      for (let x = xs[k]; x <= xs[k+1]; x++) cb(x, y);
  }
}

/** HSL → RGB */
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0)*255), g: Math.round(f(8)*255), b: Math.round(f(4)*255) };
}

/** uint32 → { r, g, b, a } */
function u32ToRgba(u) {
  return { a: (u>>>24)&0xff, r: (u>>>16)&0xff, g: (u>>>8)&0xff, b: u&0xff };
}

/** { r, g, b, a } → uint32 */
function rgbaToU32({ r, g, b, a = 255 }) {
  return ((a&0xff)<<24)|((r&0xff)<<16)|((g&0xff)<<8)|(b&0xff);
}

function setDirect(px_, py_, color, api) {
  if (color === null || color === 'transparent') {
    api.activeDocument.draw.setPixel(px_, py_, null);
  } else {
    api.activeDocument.draw.setPixel(px_, py_, color);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMMAND DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════
export async function executeCommand(api, cmd) {
  if (!cmd || typeof cmd !== 'object') throw new Error('Invalid command format');
  const { action, ...args } = cmd;

  switch (action) {

    // ── PING ────────────────────────────────────────────────────────────
    case 'ping':
      return { success: true, result: { pong: true, ts: Date.now() } };

    // ─────────────────────────────────────────────────────────────────────
    // HISTORY
    // ─────────────────────────────────────────────────────────────────────
    case 'undo': api.activeDocument.history.undo(); return { success: true };
    case 'redo': api.activeDocument.history.redo(); return { success: true };

    // ─────────────────────────────────────────────────────────────────────
    // LAYERS
    // ─────────────────────────────────────────────────────────────────────
    case 'layer.getLayers': return { success: true, result: api.activeDocument.layers.getLayers() };
    case 'layer.getActiveLayerIndex': return { success: true, result: api.activeDocument.layers.getActiveLayerIndex() };
    case 'layer.add': api.activeDocument.layers.addLayer(); return { success: true };
    case 'layer.remove':
      if (args.index !== undefined) api.activeDocument.layers.removeLayer(args.index);
      return { success: true };
    case 'layer.moveUp':
      if (args.index !== undefined) api.activeDocument.layers.moveLayerUp(args.index);
      return { success: true };
    case 'layer.moveDown':
      if (args.index !== undefined) api.activeDocument.layers.moveLayerDown(args.index);
      return { success: true };
    case 'layer.toggle':
      if (args.index !== undefined) api.activeDocument.layers.toggleLayerVisibility(args.index);
      return { success: true };
    case 'layer.select':
      if (args.index !== undefined) api.activeDocument.layers.selectLayer(args.index);
      return { success: true };

    // ─────────────────────────────────────────────────────────────────────
    // CANVAS
    // ─────────────────────────────────────────────────────────────────────
    case 'clear': api.activeDocument.canvas.clear(); return { success: true };
    case 'trim':  api.activeDocument.canvas.trim();  return { success: true };
    case 'getSize': return { success: true, result: api.activeDocument.canvas.getSize() };

    case 'resize':
      if (args.width === undefined || args.height === undefined)
        throw new Error("resize: required 'width', 'height'");
      api.activeDocument.canvas.resize(args.width, args.height, args.mode||'clear', args.dx||0, args.dy||0);
      return { success: true };

    // ─────────────────────────────────────────────────────────────────────
    // ANIMATION
    // ─────────────────────────────────────────────────────────────────────
    case 'setAnimationMode':
      api.modes.setAnimationMode(args.enabled);
      if (args.enabled) api.activeDocument.animation.init();
      renderPixels();
      return { success: true };

    case 'addFrame':    api.activeDocument.animation.addFrame(); return { success: true };
    case 'nextFrame':   api.activeDocument.animation.nextFrame(); renderPixels(); return { success: true };
    case 'prevFrame':   api.activeDocument.animation.prevFrame(); renderPixels(); return { success: true };
    case 'getFrameCount': return { success: true, result: api.activeDocument.animation.getFrames().length };
    case 'getActiveFrameIndex': return { success: true, result: api.activeDocument.animation.getActiveFrameIndex() };
    case 'isAnimationMode': return { success: true, result: api.activeDocument.animation.isModeActive() };

    case 'insertFrameAt':
      if (args.index !== undefined) api.activeDocument.animation.insertFrameAt(args.index);
      renderPixels(); return { success: true };

    case 'removeFrame':
      if (args.index !== undefined) api.activeDocument.animation.removeFrame(args.index);
      renderPixels(); return { success: true };

    case 'goToFrame':
      if (args.index !== undefined) { api.activeDocument.animation.goToFrame(args.index); renderPixels(); }
      return { success: true };

    case 'reorderFrame':
      if (args.from !== undefined && args.to !== undefined)
        api.activeDocument.animation.reorderFrame(args.from, args.to);
      return { success: true };

    case 'ensureFrame': {
      if (args.index !== undefined) {
        let len = api.activeDocument.animation.getFrames().length;
        while (len <= args.index) { api.activeDocument.animation.addFrame(); len++; }
        api.activeDocument.animation.goToFrame(args.index);
        renderPixels();
      }
      return { success: true };
    }

    case 'getFrameDifferences':
      if (args.frameIndex1 === undefined || args.frameIndex2 === undefined)
        throw new Error("getFrameDifferences: required 'frameIndex1', 'frameIndex2'");
      return { success: true, result: api.activeDocument.animation.query.getDifferences(args.frameIndex1, args.frameIndex2) };

    // ─────────────────────────────────────────────────────────────────────
    // DRAW — PRIMITIVES
    // ─────────────────────────────────────────────────────────────────────
    case 'drawPixel':
      if (args.x !== undefined && args.y !== undefined && args.color)
        api.activeDocument.draw.setPixel(args.x, args.y, args.color);
      return { success: true };

    case 'erasePixel':
      if (args.x !== undefined && args.y !== undefined)
        api.activeDocument.draw.setPixel(args.x, args.y, null);
      return { success: true };

    case 'drawPixelsBulk':
      if (Array.isArray(args.pixels) && args.pixels.length > 0) {
        api.activeDocument.history.beginTransaction();
        for (const p of args.pixels) {
          if (p.x !== undefined && p.y !== undefined) {
            api.activeDocument.draw.setPixel(p.x, p.y, p.color || null);
          }
        }
        api.activeDocument.history.commitTransaction();
        renderPixels();
      }
      return { success: true };

    case 'getPixel':
      if (args.x === undefined || args.y === undefined) throw new Error("getPixel: required 'x', 'y'");
      return { success: true, result: api.activeDocument.draw.getPixel(args.x, args.y) };

    case 'drawLine':
      if (args.x0!==undefined && args.y0!==undefined && args.x1!==undefined && args.y1!==undefined && args.color) {
        api.activeDocument.history.beginTransaction();
        bresenhamLine(args.x0,args.y0,args.x1,args.y1,(x,y)=>api.activeDocument.draw.setPixel(x,y,args.color));
        api.activeDocument.history.commitTransaction(); renderPixels();
      }
      return { success: true };

    case 'drawCircle':
      if (args.cx!==undefined && args.cy!==undefined && args.r!==undefined && args.color) {
        api.activeDocument.history.beginTransaction();
        if (args.filled) {
          for (let dy=-args.r; dy<=args.r; dy++) {
            const dx = Math.round(Math.sqrt(args.r*args.r - dy*dy));
            for (let x=args.cx-dx; x<=args.cx+dx; x++) api.activeDocument.draw.setPixel(x, args.cy+dy, args.color);
          }
        } else {
          circlePoints(args.cx,args.cy,args.r,(x,y)=>api.activeDocument.draw.setPixel(x,y,args.color));
        }
        api.activeDocument.history.commitTransaction(); renderPixels();
      }
      return { success: true };

    case 'fill':
      if (args.x!==undefined && args.y!==undefined && args.color)
        await api.activeDocument.draw.fill(args.x, args.y, args.color);
      return { success: true };

    // ── NEW: drawRect ──────────────────────────────────────────────────
    // { x, y, w, h, color, filled? }
    case 'drawRect': {
      const { x=0, y=0, w, h, color, filled=false } = args;
      if (w===undefined||h===undefined||!color) throw new Error("drawRect: required 'x','y','w','h','color'");
      api.activeDocument.history.beginTransaction();
      if (filled) {
        for (let row=y; row<y+h; row++)
          for (let col=x; col<x+w; col++) api.activeDocument.draw.setPixel(col,row,color);
      } else {
        for (let col=x; col<x+w; col++) {
          api.activeDocument.draw.setPixel(col,y,color);
          api.activeDocument.draw.setPixel(col,y+h-1,color);
        }
        for (let row=y+1; row<y+h-1; row++) {
          api.activeDocument.draw.setPixel(x,row,color);
          api.activeDocument.draw.setPixel(x+w-1,row,color);
        }
      }
      api.activeDocument.history.commitTransaction(); renderPixels();
      return { success: true };
    }

    // ── NEW: drawEllipse ───────────────────────────────────────────────
    // { cx, cy, rx, ry, color, filled? }
    case 'drawEllipse': {
      const { cx, cy, rx, ry, color, filled=false } = args;
      if (cx===undefined||cy===undefined||rx===undefined||ry===undefined||!color)
        throw new Error("drawEllipse: required 'cx','cy','rx','ry','color'");
      api.activeDocument.history.beginTransaction();
      if (filled) ellipseFilled(cx, cy, rx, ry, (x,y) => api.activeDocument.draw.setPixel(x,y,color));
      else        for (const p of ellipsePoints(cx,cy,rx,ry)) api.activeDocument.draw.setPixel(p.x,p.y,color);
      api.activeDocument.history.commitTransaction(); renderPixels();
      return { success: true };
    }

    // ── NEW: drawPolygon ───────────────────────────────────────────────
    // { points: [{x,y},...], color, filled? }
    case 'drawPolygon': {
      const { points=[], color, filled=false } = args;
      if (!points.length||!color) throw new Error("drawPolygon: required 'points' array and 'color'");
      api.activeDocument.history.beginTransaction();
      if (filled) polygonFilled(points, (x,y) => api.activeDocument.draw.setPixel(x,y,color));
      else        polygonOutline(points, (x,y) => api.activeDocument.draw.setPixel(x,y,color));
      api.activeDocument.history.commitTransaction(); renderPixels();
      return { success: true };
    }

    // ── NEW: replaceColor ──────────────────────────────────────────────
    // { from: '#hex', to: '#hex' }  — bulk replace ALL pixels of one color
    case 'replaceColor': {
      if (!args.from || !args.to) throw new Error("replaceColor: required 'from', 'to'");
      const fromU32 = parseColorToUint32(args.from);
      api.activeDocument.history.beginTransaction();
      const size = api.activeDocument.canvas.getSize();
      const map  = api.activeDocument.query.getRawPixelMap();
      let count = 0;
      for (let y=0; y<size.height; y++)
        for (let x=0; x<size.width; x++)
          if (map[y*size.width+x] === fromU32) { api.activeDocument.draw.setPixel(x,y,args.to); count++; }
      api.activeDocument.history.commitTransaction(); renderPixels();
      return { success: true, result: { replaced: count } };
    }

    // ── NEW: drawGradientRect ──────────────────────────────────────────
    // { x, y, w, h, colorFrom, colorTo, direction: 'h'|'v' }
    case 'drawGradientRect': {
      const { x=0, y=0, w, h, colorFrom, colorTo, direction='h' } = args;
      if (!w||!h||!colorFrom||!colorTo) throw new Error("drawGradientRect: required 'w','h','colorFrom','colorTo'");
      const from = parseColorToUint32(colorFrom);
      const to   = parseColorToUint32(colorTo);
      const fC   = u32ToRgba(from), tC = u32ToRgba(to);
      api.activeDocument.history.beginTransaction();
      const steps = direction === 'h' ? w : h;
      for (let i=0; i<steps; i++) {
        const t = i / (steps - 1 || 1);
        const r = Math.round(fC.r + t*(tC.r-fC.r));
        const g = Math.round(fC.g + t*(tC.g-fC.g));
        const b = Math.round(fC.b + t*(tC.b-fC.b));
        const hex = '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
        if (direction === 'h') for (let row=y; row<y+h; row++) api.activeDocument.draw.setPixel(x+i,row,hex);
        else                   for (let col=x; col<x+w; col++) api.activeDocument.draw.setPixel(col,y+i,hex);
      }
      api.activeDocument.history.commitTransaction(); renderPixels();
      return { success: true };
    }

    // ── NEW: applyFilter ───────────────────────────────────────────────
    // { type: 'brightness'|'invert'|'grayscale'|'hue-rotate', value? }
    // Applies to entire canvas (or region if x,y,w,h provided)
    case 'applyFilter': {
      const { type, value=0, x=0, y=0, w, h } = args;
      if (!type) throw new Error("applyFilter: required 'type'");
      const size = api.activeDocument.canvas.getSize();
      const endX = w ? Math.min(x+w, size.width)  : size.width;
      const endY = h ? Math.min(y+h, size.height) : size.height;
      api.activeDocument.history.beginTransaction();
      for (let py=y; py<endY; py++) {
        for (let px=x; px<endX; px++) {
          const u32 = api.activeDocument.query.getRawPixelMap()[py*size.width+px];
          if (u32 === 0) continue;
          let { r, g, b, a } = u32ToRgba(u32);
          if (type === 'brightness') {
            const v = value; r=Math.min(255,Math.max(0,r+v)); g=Math.min(255,Math.max(0,g+v)); b=Math.min(255,Math.max(0,b+v));
          } else if (type === 'invert') {
            r=255-r; g=255-g; b=255-b;
          } else if (type === 'grayscale') {
            const gray=Math.round(0.299*r+0.587*g+0.114*b); r=gray; g=gray; b=gray;
          } else if (type === 'hue-rotate') {
            // Simple hue rotation via HSL
            const max=Math.max(r,g,b)/255, min=Math.min(r,g,b)/255, delta=max-min;
            let H=0, S=0, L=(max+min)/2;
            if (delta>0) {
              S=delta/(1-Math.abs(2*L-1));
              if (max===r/255) H=((g-b)/255/delta)%6;
              else if (max===g/255) H=(b-r)/255/delta+2;
              else H=(r-g)/255/delta+4;
              H=H*60+value;
            }
            const rgb2=hslToRgb(((H%360)+360)%360, S*100, L*100);
            r=rgb2.r; g=rgb2.g; b=rgb2.b;
          } else throw new Error(`Unknown filter: ${type}`);
          const hex='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
          api.activeDocument.draw.setPixel(px,py,hex);
        }
      }
      api.activeDocument.history.commitTransaction(); renderPixels();
      return { success: true };
    }

    // ── NEW: floodFillAll ──────────────────────────────────────────────
    // { color, to }  — replace ALL disconnected regions of `color` with `to`
    case 'floodFillAll': {
      if (!args.color || !args.to) throw new Error("floodFillAll: required 'color', 'to'");
      const targetU32 = parseColorToUint32(args.color);
      const size = api.activeDocument.canvas.getSize();
      const map  = api.activeDocument.query.getRawPixelMap();
      const coords = [];
      for (let y=0; y<size.height; y++)
        for (let x=0; x<size.width; x++)
          if (map[y*size.width+x]===targetU32) coords.push({x,y});
      // Fill each point (flood fill handles duplicates internally)
      for (const {x,y} of coords) await api.activeDocument.draw.fill(x,y,args.to);
      renderPixels();
      return { success: true, result: { seedPoints: coords.length } };
    }

    // ── NEW: drawSprite (ASCII art → pixels) ───────────────────────────
    // { x, y, palette: {'A':'#hex', '.':null}, data: ['row0','row1',...] }
    case 'drawSprite': {
      const { x:ox=0, y:oy=0, palette={}, data=[] } = args;
      if (!data.length) throw new Error("drawSprite: 'data' array required");
      api.activeDocument.history.beginTransaction();
      for (let row=0; row<data.length; row++) {
        const line=data[row];
        for (let col=0; col<line.length; col++) {
          const color=palette[line[col]];
          if (color!==undefined && color!==null) api.activeDocument.draw.setPixel(ox+col,oy+row,color);
        }
      }
      api.activeDocument.history.commitTransaction(); renderPixels();
      return { success: true, result: { rows: data.length, cols: data[0]?.length||0 } };
    }

    // ── NEW: saveStamp / useStamp ──────────────────────────────────────
    // saveStamp: { name, palette, data }  — store a named sprite for reuse
    case 'saveStamp': {
      if (!args.name||!args.data) throw new Error("saveStamp: required 'name', 'data'");
      _stamps.set(args.name, { palette: args.palette||{}, data: args.data });
      return { success: true, result: { name: args.name, rows: args.data.length } };
    }

    // useStamp: { name, x, y, palette? }  — draw stored sprite (optionally override palette)
    case 'useStamp': {
      if (!args.name) throw new Error("useStamp: required 'name'");
      const stamp = _stamps.get(args.name);
      if (!stamp) throw new Error(`Stamp '${args.name}' not found. Use saveStamp first.`);
      const pal = { ...stamp.palette, ...(args.palette||{}) };
      api.activeDocument.history.beginTransaction();
      for (let row=0; row<stamp.data.length; row++) {
        const line=stamp.data[row];
        for (let col=0; col<line.length; col++) {
          const color=pal[line[col]];
          if (color!==undefined&&color!==null) api.activeDocument.draw.setPixel((args.x||0)+col,(args.y||0)+row,color);
        }
      }
      api.activeDocument.history.commitTransaction(); renderPixels();
      return { success: true };
    }

    case 'listStamps':
      return { success: true, result: [..._stamps.keys()] };

    case 'deleteStamp':
      _stamps.delete(args.name);
      return { success: true };

    // ─────────────────────────────────────────────────────────────────────
    // COPY / PASTE REGION
    // ─────────────────────────────────────────────────────────────────────
    case 'copyRegion': {
      const { x=0, y=0, w, h } = args;
      if (w===undefined||h===undefined) throw new Error("copyRegion: required 'x','y','w','h'");
      const size = api.activeDocument.canvas.getSize();
      const map  = api.activeDocument.query.getRawPixelMap();
      const cw   = Math.min(w, size.width-x), ch = Math.min(h, size.height-y);
      const data = new Uint32Array(cw*ch);
      for (let row=0; row<ch; row++)
        for (let col=0; col<cw; col++) data[row*cw+col]=map[(y+row)*size.width+(x+col)];
      _clipboard = { x,y,w:cw,h:ch,data };
      return { success: true, result: { w:cw, h:ch } };
    }

    case 'pasteRegion': {
      if (!_clipboard) throw new Error('No region copied. Use copyRegion first.');
      const { x=_clipboard.x, y=_clipboard.y } = args;
      const { w,h,data } = _clipboard;
      api.activeDocument.history.beginTransaction();
      for (let row=0; row<h; row++)
        for (let col=0; col<w; col++) {
          const u32=data[row*w+col];
          api.activeDocument.draw.setPixel(x+col,y+row, u32===0 ? null : parseUint32ToHex(u32));
        }
      api.activeDocument.history.commitTransaction(); renderPixels();
      return { success: true, result: { pastedAt:{x,y}, size:{w,h} } };
    }

    // ─────────────────────────────────────────────────────────────────────
    // ANCHORS (named coordinate system)
    // ─────────────────────────────────────────────────────────────────────
    case 'setAnchor':
      if (!args.name) throw new Error("setAnchor: required 'name'");
      _anchors.set(args.name, { x:args.x||0, y:args.y||0 });
      return { success: true, result: { name:args.name, x:args.x, y:args.y } };

    case 'getAnchor': {
      if (!args.name) throw new Error("getAnchor: required 'name'");
      const a=_anchors.get(args.name);
      if (!a) throw new Error(`Anchor '${args.name}' not found`);
      return { success: true, result: a };
    }

    case 'listAnchors':  return { success: true, result: Object.fromEntries(_anchors) };
    case 'clearAnchors': _anchors.clear(); return { success: true };

    case 'drawFromAnchor': {
      if (!args.anchor) throw new Error("drawFromAnchor: required 'anchor'");
      const a=_anchors.get(args.anchor);
      if (!a) throw new Error(`Anchor '${args.anchor}' not found`);
      if (args.dx0!==undefined) {
        bresenhamLine(a.x+args.dx0,a.y+args.dy0,a.x+args.dx1,a.y+args.dy1,(x,y)=>api.activeDocument.draw.setPixel(x,y,args.color));
      } else {
        api.activeDocument.draw.setPixel(a.x+(args.dx||0),a.y+(args.dy||0),args.color);
      }
      renderPixels();
      return { success: true };
    }

    // ─────────────────────────────────────────────────────────────────────
    // QUERY
    // ─────────────────────────────────────────────────────────────────────
    case 'query': {
      if (!args.type) throw new Error('query: missing type');
      let result;
      switch (args.type) {
        case 'isEmpty':        result=api.activeDocument.query.isEmpty(); break;
        case 'getBoundingBox': result=api.activeDocument.query.getBoundingBox(); break;
        case 'getPalette':     result=api.activeDocument.query.getPalette(); break;
        case 'countPixels':    result=api.activeDocument.query.countPixels(args.color); break;
        case 'findPixels':     result=api.activeDocument.query.findPixels(args.color); break;
        case 'getRawPixelMap': result=Array.from(api.activeDocument.query.getRawPixelMap()); break;
        case 'getDocumentState': result=api.activeDocument.getState(); break;
        default: throw new Error(`Unknown query type: ${args.type}`);
      }
      return { success: true, result };
    }

    // ── querySnapshot ─────────────────────────────────────────────────
    // Returns canvas as ASCII art + legend. AI can "see" without exportBase64.
    case 'querySnapshot': {
      const { maxColors=12, scale=1 } = args;
      const SYMS='.+=#@%&*xoO^~!?ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwyz';
      const size=api.activeDocument.canvas.getSize();
      const map=api.activeDocument.query.getRawPixelMap();
      const freq=new Map();
      for (let i=0;i<map.length;i++) { const c=map[i]; if(c) freq.set(c,(freq.get(c)||0)+1); }
      const topColors=[...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,maxColors).map(([c])=>c);
      const c2s=new Map([[0,' ']]);
      topColors.forEach((c,i)=>c2s.set(c,SYMS[i]||'?'));
      const step=Math.max(1,scale);
      const lines=[];
      for (let y=0;y<size.height;y+=step) {
        let line='';
        for (let x=0;x<size.width;x+=step) { const c=map[y*size.width+x]; line+=c2s.get(c)||(c?'*':' '); }
        lines.push(line);
      }
      const legend={};
      for (const [u32,sym] of c2s) { if(u32&&sym!==' ') legend[sym]=parseUint32ToHex(u32); }
      return { success:true, result:{ ascii:lines.join('\n'), legend, width:size.width, height:size.height, scale:step, uniqueColors:freq.size } };
    }

    // ── exportBase64 ──────────────────────────────────────────────────
    // Returns PNG/WebP as base64 data URL. AI can inspect actual visual output.
    case 'exportBase64': {
      const fmt=args.format||'png';
      const blob=await api.activeDocument.io.export(fmt,{transparent:true});
      const buf=await blob.arrayBuffer();
      const u8=new Uint8Array(buf);
      let bin=''; for(let i=0;i<u8.byteLength;i++) bin+=String.fromCharCode(u8[i]);
      const mimes={png:'image/png',webp:'image/webp',jpeg:'image/jpeg'};
      return { success:true, result:{ dataUrl:`data:${mimes[fmt]||'image/png'};base64,${btoa(bin)}`, format:fmt, bytes:u8.byteLength } };
    }

    // ─────────────────────────────────────────────────────────────────────
    // WORKSPACE
    // ─────────────────────────────────────────────────────────────────────
    case 'listTabs':      return { success:true, result:api.workspace.listTabs() };
    case 'getActiveTabId': return { success:true, result:api.workspace.getActiveTabId() };
    case 'quickSave':     api.workspace.quickSave(); return { success:true };

    case 'switchTab':
      if (!args.tabId) throw new Error("switchTab: required 'tabId'");
      api.workspace.switchTab(args.tabId); return { success:true };

    case 'createTab':
      api.workspace.createTab({ name:args.name, width:args.width, height:args.height });
      return { success:true };

    case 'closeTab':
      if (!args.tabId) throw new Error("closeTab: required 'tabId'");
      api.workspace.closeTab(args.tabId, args.force||false); return { success:true };

    case 'renameTab':
      if (!args.tabId||!args.name) throw new Error("renameTab: required 'tabId', 'name'");
      api.workspace.renameTab(args.tabId,args.name); return { success:true };

    // ─────────────────────────────────────────────────────────────────────
    // VIEWPORT
    // ─────────────────────────────────────────────────────────────────────
    case 'zoomIn':      api.activeDocument.viewport.zoomIn();      return { success:true };
    case 'zoomOut':     api.activeDocument.viewport.zoomOut();     return { success:true };
    case 'fitToScreen': api.activeDocument.viewport.fitToScreen(); return { success:true };

    case 'setZoom':
      if (args.zoom===undefined) throw new Error("setZoom: required 'zoom'");
      api.activeDocument.viewport.setZoom(args.zoom); return { success:true };

    case 'setPan':
      if (args.x===undefined||args.y===undefined) throw new Error("setPan: required 'x','y'");
      api.activeDocument.viewport.setPan(args.x,args.y); return { success:true };

    case 'getViewport':
      return { success:true, result:{ zoom:api.activeDocument.viewport.getZoom(), pan:api.activeDocument.viewport.getPan() } };

    // ─────────────────────────────────────────────────────────────────────
    // MODES
    // ─────────────────────────────────────────────────────────────────────
    case 'getModes':     return { success:true, result:api.modes.getAll() };
    case 'setGradient':  api.modes.setGradient(args.enabled);   return { success:true };
    case 'setMirror':    api.modes.setMirror(args.enabled);     return { success:true };
    case 'setGrid':      api.modes.setGrid(args.enabled);       return { success:true };
    case 'setOnionSkin': api.modes.setOnionSkin(args.enabled);  return { success:true };

    // ─────────────────────────────────────────────────────────────────────
    // TOOLS & COLOR
    // ─────────────────────────────────────────────────────────────────────
    case 'setTool':   if (args.tool) api.tools.set(args.tool); return { success:true };
    case 'getTool':   return { success:true, result:api.tools.get() };
    case 'swapColors': api.color.swap(); return { success:true };

    case 'setToolParam':
      if (args.paramId===undefined||args.value===undefined) throw new Error("setToolParam: required 'paramId','value'");
      api.tools.setParam(args.paramId,args.value); return { success:true };

    case 'getToolParam':
      if (!args.paramId) throw new Error("getToolParam: required 'paramId'");
      return { success:true, result:api.tools.getParam(args.paramId) };

    case 'setColor':
      if (args.primary)   api.color.setPrimary(args.primary);
      if (args.secondary) api.color.setSecondary(args.secondary);
      return { success:true };

    case 'getColor':
      return { success:true, result:{ primary:api.color.getPrimary(), secondary:api.color.getSecondary() } };

    // ─────────────────────────────────────────────────────────────────────
    // IO / EXPORT
    // ─────────────────────────────────────────────────────────────────────
    case 'export': {
      if (!args.format) throw new Error("export: required 'format'");
      const data=await api.activeDocument.io.export(args.format, args.options);
      return { success:true, result:data };
    }
    case 'exportAnimation': {
      if (!args.format) throw new Error("exportAnimation: required 'format'");
      const data=await api.activeDocument.io.exportAnimation(args.format, args.options||{});
      return { success:true, result:data };
    }

    // ─────────────────────────────────────────────────────────────────────
    // META / HELP
    // ─────────────────────────────────────────────────────────────────────
    case 'getCapabilities':
      return { success:true, result:{
        version:'5.0',
        commands: COMMAND_SCHEMA,
      }};

    // ─────────────────────────────────────────────────────────────────────
    // WORKFLOW USER INPUT REQUEST
    // ─────────────────────────────────────────────────────────────────────
    case 'showUserInputRequest':
      return new Promise((resolve) => {
        const event = new CustomEvent('SHOW_USER_INPUT_REQUEST', {
          detail: {
            reqId: args.reqId,
            type: args.type,
            fields: args.fields,
            resolve: (response) => {
              resolve({ success: true, result: response });
            }
          }
        });
        window.dispatchEvent(event);
      });

    default:
      throw new Error(`Unknown action: "${action}". Send {"action":"getCapabilities"} for full list.`);
  }
}

// ── Batch: wrap N commands in 1 history transaction ────────────────────────
export async function executeCommandBatch(api, commands) {
  if (!Array.isArray(commands)) throw new Error('Commands must be an array');
  api.activeDocument.history.beginTransaction();
  const results=[];
  try {
    for (const cmd of commands) results.push(await executeCommand(api, cmd));
  } finally {
    api.activeDocument.history.commitTransaction();
  }
  return results;
}

// ── Self-documenting schema (returned by getCapabilities) ─────────────────
const COMMAND_SCHEMA = {
  // Meta
  ping:              { desc:'Health check', params:{} },
  getCapabilities:   { desc:'List all commands + schema', params:{} },
  // History
  undo:              { desc:'Undo last action', params:{} },
  redo:              { desc:'Redo', params:{} },
  // Canvas
  clear:             { desc:'Clear all pixels', params:{} },
  trim:              { desc:'Auto-trim transparent border', params:{} },
  getSize:           { desc:'Get {width,height}', params:{} },
  resize:            { desc:'Resize canvas', params:{ width:'int', height:'int', mode:'clear|extend|fit', dx:'int?', dy:'int?' } },
  // Animation
  setAnimationMode:  { desc:'Enable/disable animation mode', params:{ enabled:'bool' } },
  addFrame:          { desc:'Append blank frame', params:{} },
  insertFrameAt:     { desc:'Insert blank frame at index', params:{ index:'int' } },
  removeFrame:       { desc:'Remove frame at index', params:{ index:'int' } },
  goToFrame:         { desc:'Switch to frame at index', params:{ index:'int' } },
  nextFrame:         { desc:'Switch to next frame', params:{} },
  prevFrame:         { desc:'Switch to previous frame', params:{} },
  reorderFrame:      { desc:'Move frame from→to', params:{ from:'int', to:'int' } },
  ensureFrame:       { desc:'Ensure N frames exist, go to index', params:{ index:'int' } },
  getFrameCount:     { desc:'Number of frames', params:{} },
  getActiveFrameIndex: { desc:'Current frame index', params:{} },
  isAnimationMode:   { desc:'Is animation mode on?', params:{} },
  getFrameDifferences: { desc:'Compare two frames', params:{ frameIndex1:'int', frameIndex2:'int' } },
  // Draw — basic
  drawPixel:         { desc:'Set single pixel', params:{ x:'int', y:'int', color:'#hex' } },
  erasePixel:        { desc:'Erase single pixel (transparent)', params:{ x:'int', y:'int' } },
  getPixel:          { desc:'Get color at (x,y)', params:{ x:'int', y:'int' } },
  drawLine:          { desc:'Bresenham line', params:{ x0:'int', y0:'int', x1:'int', y1:'int', color:'#hex' } },
  drawCircle:        { desc:'Circle outline or filled', params:{ cx:'int', cy:'int', r:'int', color:'#hex', filled:'bool?' } },
  drawEllipse:       { desc:'Ellipse outline or filled', params:{ cx:'int', cy:'int', rx:'int', ry:'int', color:'#hex', filled:'bool?' } },
  drawRect:          { desc:'Rectangle outline or filled', params:{ x:'int', y:'int', w:'int', h:'int', color:'#hex', filled:'bool?' } },
  drawPolygon:       { desc:'Polygon from points', params:{ points:'[{x,y}]', color:'#hex', filled:'bool?' } },
  fill:              { desc:'Flood-fill from (x,y)', params:{ x:'int', y:'int', color:'#hex' } },
  floodFillAll:      { desc:'Replace ALL pixels of color', params:{ color:'#hex', to:'#hex' } },
  replaceColor:      { desc:'Bulk-replace one color → another', params:{ from:'#hex', to:'#hex' } },
  drawGradientRect:  { desc:'Gradient-filled rectangle', params:{ x:'int', y:'int', w:'int', h:'int', colorFrom:'#hex', colorTo:'#hex', direction:'h|v' } },
  applyFilter:       { desc:'Filter region/canvas', params:{ type:'brightness|invert|grayscale|hue-rotate', value:'number?', x:'int?', y:'int?', w:'int?', h:'int?' } },
  // Draw — high level
  drawSprite:        { desc:'Draw ASCII-art sprite with color palette', params:{ x:'int', y:'int', palette:'{"char":"#hex"|null}', data:'["row0","row1",...]' } },
  saveStamp:         { desc:'Save named reusable sprite', params:{ name:'str', palette:'obj', data:'str[]' } },
  useStamp:          { desc:'Place saved stamp at (x,y)', params:{ name:'str', x:'int', y:'int', palette:'obj?' } },
  listStamps:        { desc:'List all saved stamp names', params:{} },
  deleteStamp:       { desc:'Remove a stamp', params:{ name:'str' } },
  // Region clipboard
  copyRegion:        { desc:'Copy pixels to internal clipboard', params:{ x:'int', y:'int', w:'int', h:'int' } },
  pasteRegion:       { desc:'Paste clipboard to (x,y)', params:{ x:'int?', y:'int?' } },
  // Anchors
  setAnchor:         { desc:'Set named coordinate anchor', params:{ name:'str', x:'int', y:'int' } },
  getAnchor:         { desc:'Get anchor coords by name', params:{ name:'str' } },
  listAnchors:       { desc:'All anchors', params:{} },
  clearAnchors:      { desc:'Remove all anchors', params:{} },
  drawFromAnchor:    { desc:'Draw relative to anchor', params:{ anchor:'str', dx:'int?', dy:'int?', dx0:'int?', dy0:'int?', dx1:'int?', dy1:'int?', color:'#hex' } },
  // Query & visual feedback
  query:             { desc:'Query canvas data', params:{ type:'isEmpty|getBoundingBox|getPalette|countPixels|findPixels|getRawPixelMap|getDocumentState', color:'#hex?' } },
  querySnapshot:     { desc:'ASCII art view of canvas (AI vision)', params:{ scale:'int?', maxColors:'int?' } },
  exportBase64:      { desc:'Export canvas as base64 data URL', params:{ format:'png|webp|jpeg' } },
  // Workspace
  listTabs:          { desc:'List all open tabs', params:{} },
  getActiveTabId:    { desc:'Get current tab ID', params:{} },
  switchTab:         { desc:'Switch to tab by ID', params:{ tabId:'str' } },
  createTab:         { desc:'Create new tab', params:{ name:'str?', width:'int?', height:'int?' } },
  closeTab:          { desc:'Close tab', params:{ tabId:'str', force:'bool?' } },
  renameTab:         { desc:'Rename tab', params:{ tabId:'str', name:'str' } },
  quickSave:         { desc:'Quick save workspace', params:{} },
  // Viewport
  zoomIn:            { desc:'Zoom in', params:{} },
  zoomOut:           { desc:'Zoom out', params:{} },
  fitToScreen:       { desc:'Fit canvas to window', params:{} },
  setZoom:           { desc:'Set zoom level', params:{ zoom:'float' } },
  setPan:            { desc:'Set pan offset', params:{ x:'float', y:'float' } },
  getViewport:       { desc:'Get {zoom, pan}', params:{} },
  // Modes
  getModes:          { desc:'Get all mode flags', params:{} },
  setGradient:       { desc:'Toggle gradient mode', params:{ enabled:'bool' } },
  setMirror:         { desc:'Toggle mirror mode', params:{ enabled:'bool' } },
  setGrid:           { desc:'Toggle grid overlay', params:{ enabled:'bool' } },
  setOnionSkin:      { desc:'Toggle onion skin', params:{ enabled:'bool' } },
  // Tools & color
  setTool:           { desc:'Set active tool', params:{ tool:'pencil|eraser|fill|select|...' } },
  getTool:           { desc:'Get current tool ID', params:{} },
  setToolParam:      { desc:'Set tool parameter', params:{ paramId:'str', value:'any' } },
  getToolParam:      { desc:'Get tool parameter', params:{ paramId:'str' } },
  setColor:          { desc:'Set primary/secondary color', params:{ primary:'#hex?', secondary:'#hex?' } },
  getColor:          { desc:'Get {primary, secondary}', params:{} },
  swapColors:        { desc:'Swap primary ↔ secondary', params:{} },
  // Export
  export:            { desc:'Export as blob', params:{ format:'png|webp|jpeg|json' } },
  exportAnimation:   { desc:'Export animation', params:{ format:'gif|webm|spritesheet' } },
};
