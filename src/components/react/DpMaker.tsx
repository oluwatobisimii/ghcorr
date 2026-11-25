import { useCallback, useEffect, useRef, useState } from 'react';

/** Personalised DP maker. Everything happens in the visitor's browser; nothing is uploaded. */
export interface DpMakerProps {
  /** 1080×1350 design with a hole for the photo */
  background: string;
  /** Photo window on the 1080×1350 design */
  window: { x: number; y: number; w: number; h: number; r: number };
  filename: string;
  shareText: string;
}

const W = 1080;
const H = 1350;
const MAX_ZOOM = 4;

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

const canShareFiles = () => {
  try {
    return !!(navigator.canShare && navigator.canShare({ files: [new File([new Blob()], 'x.jpg', { type: 'image/jpeg' })] }));
  } catch {
    return false;
  }
};

export default function DpMaker({ background, window: WIN, filename, shareText }: DpMakerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bg = useRef<HTMLImageElement | null>(null);
  // Photo state lives in a ref so pointer moves don't re-render React
  const st = useRef({ photo: null as HTMLImageElement | null, base: 1, z: 1, ox: 0, oy: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; z: number } | null>(null);

  const [hasPhoto, setHasPhoto] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [shareable, setShareable] = useState(false);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { photo, base, z, ox, oy } = st.current;
    ctx.clearRect(0, 0, W, H);
    if (bg.current?.complete && bg.current.naturalWidth) ctx.drawImage(bg.current, 0, 0, W, H);
    ctx.save();
    roundRect(ctx, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r);
    ctx.clip();
    if (photo) {
      const s = base * z;
      const pw = photo.naturalWidth * s;
      const ph = photo.naturalHeight * s;
      ctx.drawImage(photo, WIN.x + WIN.w / 2 + ox - pw / 2, WIN.y + WIN.h / 2 + oy - ph / 2, pw, ph);
    } else {
      const g = ctx.createLinearGradient(WIN.x, WIN.y, WIN.x + WIN.w, WIN.y + WIN.h);
      g.addColorStop(0, '#dcebf7');
      g.addColorStop(1, '#bfe6ea');
      ctx.fillStyle = g;
      ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
      const cx = WIN.x + WIN.w / 2;
      ctx.fillStyle = 'rgba(5,5,117,.16)';
      ctx.beginPath();
      ctx.arc(cx, WIN.y + WIN.h * 0.375, WIN.w * 0.19, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, WIN.y + WIN.h + 20, WIN.w * 0.4, WIN.h * 0.36, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#050575';
      ctx.textAlign = 'center';
      ctx.font = '800 34px Poppins, sans-serif';
      ctx.fillText('TAP TO ADD', cx, WIN.y + WIN.h * 0.64);
      ctx.fillText('YOUR PHOTO', cx, WIN.y + WIN.h * 0.64 + 42);
    }
    ctx.restore();
  }, [WIN.x, WIN.y, WIN.w, WIN.h, WIN.r]);

  const clamp = () => {
    const s = st.current;
    if (!s.photo) return;
    const k = s.base * s.z;
    const mx = Math.max(0, (s.photo.naturalWidth * k - WIN.w) / 2);
    const my = Math.max(0, (s.photo.naturalHeight * k - WIN.h) / 2);
    s.ox = Math.min(mx, Math.max(-mx, s.ox));
    s.oy = Math.min(my, Math.max(-my, s.oy));
  };

  useEffect(() => {
    setShareable(canShareFiles());
    const img = new Image();
    img.onload = draw;
    img.onerror = () => setStatus('The design could not load. Refresh the page and try again.');
    img.src = background;
    bg.current = img;
    document.fonts?.ready.then(draw);
    draw();
  }, [background, draw]);

  // Wheel zoom needs a non-passive listener
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      if (!st.current.photo) return;
      e.preventDefault();
      st.current.z = Math.min(MAX_ZOOM, Math.max(1, st.current.z * (e.deltaY < 0 ? 1.06 : 1 / 1.06)));
      setZoom(st.current.z);
      clamp();
      draw();
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  });

  const onFile = (f?: File) => {
    if (!f) return;
    if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|heic|heif|gif)$/i.test(f.name)) {
      setStatus('That file is not a photo. Choose a JPG or PNG picture.');
      return;
    }
    const img = new Image();
    img.onload = () => {
      st.current = { photo: img, base: Math.max(WIN.w / img.naturalWidth, WIN.h / img.naturalHeight), z: 1, ox: 0, oy: 0 };
      setZoom(1);
      setHasPhoto(true);
      setResult(null);
      setStatus('Looking good! Drag and zoom to fit, then save.');
      draw();
    };
    img.onerror = () => setStatus('This photo could not be opened. Try a JPG or PNG instead.');
    img.src = URL.createObjectURL(f);
  };

  const toArt = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  };
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = toArt(e);
    if (!st.current.photo) {
      if (p.x >= WIN.x && p.x <= WIN.x + WIN.w && p.y >= WIN.y && p.y <= WIN.y + WIN.h) fileRef.current?.click();
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, p);
    setDragging(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: st.current.z };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const pts = pointers.current;
    if (!st.current.photo || !pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId)!;
    const cur = toArt(e);
    pts.set(e.pointerId, cur);
    if (pts.size === 2 && pinch.current) {
      const [a, b] = [...pts.values()];
      st.current.z = Math.min(MAX_ZOOM, Math.max(1, (pinch.current.z * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.d));
      setZoom(st.current.z);
    } else if (pts.size === 1) {
      st.current.ox += cur.x - prev.x;
      st.current.oy += cur.y - prev.y;
    }
    clamp();
    draw();
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!pointers.current.size) setDragging(false);
  };

  const makeBlob = () =>
    new Promise<Blob>((resolve, reject) => {
      draw();
      canvasRef.current!.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', 0.92);
    });

  const save = async () => {
    try {
      const b = await makeBlob();
      const url = URL.createObjectURL(b);
      setResult(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus('Saved! Post it on your status and tag a friend.');
    } catch {
      setStatus('Something went wrong making the picture. Try again.');
    }
  };
  const share = async () => {
    try {
      const b = await makeBlob();
      setResult(URL.createObjectURL(b));
      await navigator.share({ files: [new File([b], filename, { type: 'image/jpeg' })], text: shareText });
      setStatus('Shared! Thank you for spreading the word.');
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setStatus('Sharing did not work here, so use Download DP instead.');
    }
  };

  return (
    <div className="maker">
      <div
        ref={stageRef}
        className={`stage${hasPhoto ? ' can-drag' : ''}${dragging ? ' dragging' : ''}`}
        aria-label="DP preview. Tap the frame to add your photo, then drag to move it."
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <canvas ref={canvasRef} width={W} height={H} />
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="row">
        <button className="btn btn-line" type="button" onClick={() => fileRef.current?.click()}>{hasPhoto ? 'Change photo' : 'Add your photo'}</button>
        <button className="btn btn-n" type="button" disabled={!hasPhoto} onClick={save}>Download DP</button>
      </div>
      {shareable && (
        <button className="btn btn-y" type="button" disabled={!hasPhoto} onClick={share} style={{ justifyContent: 'center', border: 0, fontFamily: 'inherit', cursor: 'pointer' }}>
          Share to WhatsApp, Instagram…
        </button>
      )}
      <div className="zoom">
        <label htmlFor="dpZoom">ZOOM</label>
        <input
          id="dpZoom"
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          disabled={!hasPhoto}
          onChange={(e) => { st.current.z = parseFloat(e.target.value); setZoom(st.current.z); clamp(); draw(); }}
        />
      </div>
      <p className="status" role="status" aria-live="polite">{status}</p>
      <div className={`result${result ? ' show' : ''}`}>
        {result && <img src={result} alt="Your finished DP" />}
        <p>If the download didn't start, press and hold the picture (or right-click it) and choose <b>Save Image</b>.</p>
      </div>
      <div className="more"><a href="../">Event details →</a><a href="../#posters">More posters →</a></div>
    </div>
  );
}
