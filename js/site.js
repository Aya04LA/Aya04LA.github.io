import { principles, projects } from "./projects.js";

const { Spring, animate, project, rubberband, reducedMotion } = window.UI;
const $ = (s) => document.querySelector(s);
UI.stickyNav();

// ---------- Cards ----------
const make = (tag, cls, text) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
};

function stats(items) {
  const wrap = make("div", "stats");
  for (const s of items) {
    const box = make("div", "stat");
    box.append(make("b", "", s.value), make("span", "", s.label));
    wrap.appendChild(box);
  }
  return wrap;
}

function links(p, cls) {
  const row = make("div", cls);
  if (p.links.live) {
    const a = make("a", "button primary", "Live demo");
    a.href = p.links.live;
    row.appendChild(a);
  }
  const code = make("a", "button", "Code");
  code.href = p.links.code;
  row.appendChild(code);
  return row;
}

const grid = $("#projects");
projects.forEach((p, i) => {
  const card = make("article", `card project${i === 0 ? " featured" : ""}`);
  card.dataset.id = p.id;
  const top = make("div", "project-top");
  const titles = make("div");
  titles.append(make("h3", "", p.name), make("p", "kind", p.kind));
  top.appendChild(titles);
  if (p.links.live) top.appendChild(make("span", "badge-live", "Live"));
  const tags = make("div", "tags");
  p.tags.forEach((t) => tags.appendChild(make("span", "tag", t)));
  const row = links(p, "project-links");
  const more = make("button", "button", "How it works");
  more.type = "button";
  more.setAttribute("aria-label", `How ${p.name} works`);
  more.addEventListener("click", () => open(p.id, more));
  row.appendChild(more);
  card.append(top, make("p", "tagline", p.tagline), stats(p.stats), tags, row);
  // The whole card opens the sheet; its own links and buttons keep doing their own thing.
  card.addEventListener("click", (e) => { if (!e.target.closest("a, button")) open(p.id, more); });
  grid.appendChild(card);
});

const principleRoot = $("#principles");
for (const [title, text] of principles) {
  const c = make("div", "card");
  c.append(make("h3", "", title), make("p", "", text));
  principleRoot.appendChild(c);
}

// ---------- The sheet ----------
// It rises from the bottom edge and leaves the same way. While it's up, the page
// behind dims and recedes slightly (a modal task). Drag the top to throw it away:
// the release velocity is projected, then handed to the spring.
const sheet = $("#sheet"), scrim = $("#scrim"), page = $("#page"), body = $("#sheet-body");
const y = new Spring(0, { damping: 1, response: 0.4 });
let current = null, opener = null, height = 0, pushedState = false;

function render() {
  const p = height ? Math.max(0, Math.min(1, 1 - y.x / height)) : 0; // 1 = fully open
  if (reducedMotion.matches) {
    sheet.style.transform = "none";
    sheet.style.opacity = String(p);
  } else {
    sheet.style.transform = `translateY(${y.x}px)`;
    page.style.transform = p > 0.001 ? `scale(${1 - 0.04 * p})` : "";
    page.style.borderRadius = p > 0.001 ? `${12 * p}px` : "";
  }
  scrim.style.opacity = String(p);
}

function fill(p) {
  $("#sheet-title").textContent = p.name;
  $("#sheet-kind").textContent = p.kind;
  body.textContent = "";
  body.append(make("p", "tagline", p.tagline), stats(p.stats));
  for (const [heading, items] of p.sections) {
    body.appendChild(make("h3", "", heading));
    const ul = make("ul");
    items.forEach((t) => ul.appendChild(make("li", "", t)));
    body.appendChild(ul);
  }
  body.appendChild(links(p, "sheet-links"));
  body.scrollTop = 0;
}

function open(id, from = null, { push = true } = {}) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  current = id;
  opener = from;
  fill(p);
  sheet.hidden = false;
  scrim.classList.add("on");
  document.documentElement.style.overflow = "hidden";
  height = sheet.offsetHeight;
  if (y.settled && y.x === 0 && sheet.dataset.open !== "1") y.jump(height); // start below the screen
  sheet.dataset.open = "1";
  settle(0);
  if (push) { history.pushState({ sheet: id }, "", `#${id}`); pushedState = true; }
  requestAnimationFrame(() => $("#close").focus({ preventScroll: true }));
}

function close({ fromHistory = false, velocity = 0 } = {}) {
  if (!current) return;
  current = null;
  sheet.dataset.open = "0";
  scrim.classList.remove("on");
  settle(height, velocity, () => {
    sheet.hidden = true;
    document.documentElement.style.overflow = "";
    page.style.transform = page.style.borderRadius = "";
  });
  if (!fromHistory) {
    if (pushedState) history.back();
    else history.replaceState(null, "", location.pathname + location.search);
  }
  pushedState = false;
  opener?.focus({ preventScroll: true });
}

function settle(target, velocity = 0, done) {
  // A release that carried momentum earns a touch of bounce; a tap or Esc doesn't.
  y.configure({ damping: velocity && target === 0 ? 0.82 : 1, response: velocity ? 0.32 : 0.4 });
  y.v = velocity;
  y.target = target;
  animate("sheet", [y], render, done);
}

$("#close").addEventListener("click", () => close());
scrim.addEventListener("click", () => close());
addEventListener("popstate", () => {
  const id = location.hash.slice(1);
  if (current && id !== current) close({ fromHistory: true });
  else if (!current && projects.some((p) => p.id === id)) open(id, null, { push: false });
});
document.addEventListener("keydown", (e) => {
  if (!current) return;
  if (e.key === "Escape") { e.preventDefault(); close(); return; }
  if (e.key === "Tab") {
    // Keep focus inside the dialog while it's open.
    const items = [...sheet.querySelectorAll("a[href], button")].filter((el) => el.offsetParent !== null);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

// ---------- Drag to dismiss ----------
const grabber = $("#grabber");
let drag = null;
grabber.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || e.target.closest("button")) return;
  try { grabber.setPointerCapture(e.pointerId); } catch {}
  animate("sheet", [], () => {}); // grab it mid-flight: stop the spring, keep its current position
  drag = { startY: e.clientY, from: y.x, history: [{ t: e.timeStamp, y: y.x }] };
});
grabber.addEventListener("pointermove", (e) => {
  if (!drag) return;
  let pos = drag.from + (e.clientY - drag.startY);
  if (pos < 0) pos = -rubberband(-pos, height); // pulling up past fully open resists
  y.jump(pos);
  render();
  drag.history.push({ t: e.timeStamp, y: pos });
  while (drag.history.length > 2 && e.timeStamp - drag.history[0].t > 100) drag.history.shift();
});
function release() {
  if (!drag) return;
  const h = drag.history, first = h[0], last = h[h.length - 1];
  const velocity = last.t > first.t ? (last.y - first.y) / ((last.t - first.t) / 1000) : 0;
  drag = null;
  // Decide from where the throw would land, not where the finger let go.
  if (y.x + project(velocity) > height * 0.35) close({ velocity });
  else settle(0, velocity);
}
grabber.addEventListener("pointerup", release);
grabber.addEventListener("pointercancel", release);
addEventListener("resize", () => { if (current) { height = sheet.offsetHeight; } });

// Deep links: /#dispatch opens straight into that project.
const initial = location.hash.slice(1);
if (projects.some((p) => p.id === initial)) open(initial, null, { push: false });
