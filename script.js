const svg = document.getElementById("svgCanvas");
const pairs = [
  ['p', 'a', 0, 0],
  ['a', 'r1', 1, 0],
  ['r1', 't', 1, 0],
  ['t', 'i', 1, 0],
  ['i', 'e', 1, 0],
  ['e', 'r2', 1, 0]
];
let selected = null;
let offset = {x:0, y:0};

function getTransformXY(el) {
  const match = el.getAttribute("transform").match(/translate\(([^,]+),([^)]+)\)/);
  return match ? {x: parseFloat(match[1]), y: parseFloat(match[2])} : {x: 0, y: 0};
}

function getAnchorPosition(g, idx) {
  const anchors = g.querySelectorAll('.anchor');
  const anchor = anchors[idx] || anchors[0];
  const cx = parseFloat(anchor.getAttribute('cx'));
  const cy = parseFloat(anchor.getAttribute('cy'));
  const t = getTransformXY(g);
  return { x: t.x + cx, y: t.y + cy };
}

function updateLines() {
  pairs.forEach(([id1, id2, idx1, idx2]) => {
    const g1 = document.getElementById(id1);
    const g2 = document.getElementById(id2);
    const p1 = getAnchorPosition(g1, idx1);
    const p2 = getAnchorPosition(g2, idx2);
    const line = document.getElementById(`line-${id1}${id2}`);
    line.setAttribute('x1', p1.x);
    line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x);
    line.setAttribute('y2', p2.y);
  });
}

// --- PC用 ---
function onMouseMove(e) {
  if (!selected) return;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
  selected.setAttribute(
    "transform",
    `translate(${cursorpt.x - offset.x},${cursorpt.y - offset.y})`
  );
  updateLines();
}

function onMouseDown(e) {
  if (e.target.closest(".draggable")) {
    selected = e.target.closest(".draggable");
    const pos = getTransformXY(selected);
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
    offset.x = cursorpt.x - pos.x;
    offset.y = cursorpt.y - pos.y;
    document.addEventListener("mousemove", onMouseMove);
  }
}

function onMouseUp() {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("touchmove", onTouchMove); // ← touch解除もここで
  selected = null;
}

// --- スマホ用 ---
function onTouchMove(e) {
  if (!selected) return;
  e.preventDefault();
  const touch = e.touches[0];
  const pt = svg.createSVGPoint();
  pt.x = touch.clientX;
  pt.y = touch.clientY;
  const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
  selected.setAttribute(
    "transform",
    `translate(${cursorpt.x - offset.x},${cursorpt.y - offset.y})`
  );
  updateLines();
}

function onTouchStart(e) {
  if (e.target.closest(".draggable")) {
    selected = e.target.closest(".draggable");
    const pos = getTransformXY(selected);
    const touch = e.touches[0];
    const pt = svg.createSVGPoint();
    pt.x = touch.clientX;
    pt.y = touch.clientY;
    const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
    offset.x = cursorpt.x - pos.x;
    offset.y = cursorpt.y - pos.y;
    document.addEventListener("touchmove", onTouchMove, {passive: false});
  }
}

function onTouchEnd() {
  document.removeEventListener("touchmove", onTouchMove);
  selected = null;
}

// --- イベント登録 ---
svg.addEventListener("mousedown", onMouseDown);
document.addEventListener("mouseup", onMouseUp);
document.addEventListener("mouseleave", onMouseUp);

svg.addEventListener("touchstart", onTouchStart, {passive: false});
document.addEventListener("touchend", onTouchEnd);
document.addEventListener("touchcancel", onTouchEnd);

updateLines();

// ---- Pだけバイブレーションアニメ ----
window.addEventListener("DOMContentLoaded", () => {
  const p = document.getElementById("p");
  const pOriginal = getTransformXY(p);
  setTimeout(() => {
    let start = null;
    const duration = 600; // 0.6秒くらい
    function vibrate(ts) {
      if (!start) start = ts;
      const t = ts - start;
      // 振幅と速さを調整
      const amp = 5; // 揺れ幅px
      const freq = 5; // 1秒あたりの揺れ回数
      const y = pOriginal.y + Math.sin((t / 1000) * freq * Math.PI * 2) * amp * (1 - t / duration); // だんだん収束
      p.setAttribute("transform", `translate(${pOriginal.x},${y})`);
      updateLines();
      if (t < duration) {
        requestAnimationFrame(vibrate);
      } else {
        // 終了時に元位置
        p.setAttribute("transform", `translate(${pOriginal.x},${pOriginal.y})`);
        updateLines();
      }
    }
    requestAnimationFrame(vibrate);
  }, 1000);
});

