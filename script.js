// wallpaper gallery
// particles background + card grid + search/@tag filter + lightbox metadata

/* ---------- floating particles background (from webjar) ---------- */

const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

let w, h;
const particles = [];
const COUNT = 40;

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

for (let i = 0; i < COUNT; i++) {
    particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 1.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        o: Math.random() * 0.15 + 0.1,
    });
}

function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(215,153,33,${p.o})`;
        ctx.fill();
    }
    requestAnimationFrame(draw);
}
draw();

/* ---------- gallery ---------- */

const SECTIONS = [
    { dir: "wall-bin", section: "Desktop" },
    { dir: "wall-phone-bin", section: "Phone" },
];

const searchInput = document.getElementById("search");
const resultsEl = document.getElementById("results");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

let db = {}; // filename -> entry
let entries = []; // all entries
let matches = []; // current search matches (subset of entries)
let query = "";
let activeIndex = 0;

// strip the final extension for display names
function displayName(filename) {
    return filename.replace(/\.[^.]+$/, "");
}

function srcOf(entry) {
    return `${entry.dir}/${encodeURIComponent(entry.filename)}`;
}

function humanSize(bytes) {
    if (bytes >= 1 << 20) return `${(bytes / (1 << 20)).toFixed(2)} MB`;
    if (bytes >= 1 << 10) return `${(bytes / (1 << 10)).toFixed(0)} KB`;
    return `${bytes} B`;
}

function tagRow(el, tag) {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    el.appendChild(span);
}

/* ----- building the two grids ----- */

function buildGrid(entry) {
    const card = document.createElement("figure");
    card.className = "card";

    const img = document.createElement("img");
    img.src = srcOf(entry);
    img.alt = displayName(entry.filename);
    img.loading = "lazy";

    const cap = document.createElement("figcaption");
    cap.className = "card-cap";
    cap.textContent = displayName(entry.filename);

    card.appendChild(img);
    card.appendChild(cap);
    card.addEventListener("click", () => openLightbox(entry));

    entry.card = card;
    return card;
}

function render() {
    for (const { dir } of SECTIONS) {
        const grid = document.getElementById(`grid-${dir}`);
        const count = document.getElementById(`count-${dir}`);
        const inDir = entries
            .filter((e) => e.dir === dir)
            .sort((a, b) => a.filename.localeCompare(b.filename));
        for (const entry of inDir) grid.appendChild(buildGrid(entry));
        count.textContent = `· ${inDir.length}`;
    }
}

fetch("wallpapers_database.json")
    .then((r) => r.json())
    .then((data) => {
        db = data;
        entries = Object.values(db);
        matches = entries;
        render();
    })
    .catch(() => {
        for (const { dir } of SECTIONS) {
            const grid = document.getElementById(`grid-${dir}`);
            const note = document.createElement("div");
            note.className = "empty-note";
            note.textContent = "couldn't load wallpapers_database.json";
            grid.appendChild(note);
        }
    });

/* ----- search + @tag filtering ----- */

function runFilter() {
    const q = query.trim().toLowerCase();
    if (!q) {
        matches = entries;
        resultsEl.hidden = true;
    } else if (q.startsWith("@")) {
        const tag = q.slice(1);
        matches = entries.filter((e) =>
            e.tags.some((t) => t.toLowerCase().includes(tag))
        );
    } else {
        matches = entries.filter((e) =>
            e.filename.toLowerCase().includes(q) ||
            e.tags.some((t) => t.toLowerCase().includes(q))
        );
    }
    applyVisibility();
    renderDropdown();
}

function applyVisibility() {
    const showing = new Set(matches);
    for (const e of entries) e.card.hidden = !showing.has(e);
}

function renderDropdown() {
    const q = query.trim();
    resultsEl.textContent = "";
    if (!q || matches.length === 0) {
        resultsEl.hidden = true;
        return;
    }
    if (activeIndex > matches.length - 1) activeIndex = matches.length - 1;
    if (activeIndex < 0) activeIndex = 0;

    for (let i = 0; i < Math.min(matches.length, 8); i++) {
        const e = matches[i];
        const row = document.createElement("div");
        row.className = "result";
        if (i === activeIndex) row.classList.add("active");

        const name = document.createElement("div");
        name.className = "r-name";
        name.textContent = displayName(e.filename);

        const meta = document.createElement("div");
        meta.className = "r-meta";
        meta.textContent = `${e.dir === "wall-bin" ? "desktop" : "phone"} · ${e.ext} · ${e.tags.join(", ")}`;

        row.appendChild(name);
        row.appendChild(meta);
        row.addEventListener("click", () => {
            openLightbox(e);
            searchInput.focus();
        });
        row.addEventListener("mousemove", () => {
            activeIndex = i;
            highlight();
        });
        resultsEl.appendChild(row);
    }
    resultsEl.hidden = false;
}

function highlight() {
    const rows = resultsEl.querySelectorAll(".result");
    rows.forEach((row, i) => row.classList.toggle("active", i === activeIndex));
}

searchInput.addEventListener("input", () => {
    query = searchInput.value;
    activeIndex = 0;
    runFilter();
});

searchInput.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown") {
        ev.preventDefault();
        if (resultsEl.hidden) return;
        activeIndex = Math.min(activeIndex + 1, matches.length - 1);
        highlight();
    } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        if (resultsEl.hidden) return;
        activeIndex = Math.max(activeIndex - 1, 0);
        highlight();
    } else if (ev.key === "Enter") {
        ev.preventDefault();
        if (!resultsEl.hidden && matches.length > 0) openLightbox(matches[activeIndex]);
    } else if (ev.key === "Escape") {
        if (lightbox.classList.contains("open")) closeLightbox();
        else {
            searchInput.value = "";
            query = "";
            runFilter();
            searchInput.blur();
        }
    }
});

/* ----- lightbox ----- */

const lightboxName = document.getElementById("lightbox-name");
const lightboxTags = document.getElementById("lightbox-tags");
const lightboxMeta = document.getElementById("lightbox-meta");
const lightboxDl = document.getElementById("lightbox-dl");

function openLightbox(entry) {
    lightboxName.textContent = displayName(entry.filename);
    lightboxTags.textContent = "";
    for (const t of entry.tags) tagRow(lightboxTags, t);

    lightboxMeta.textContent = "";
    const setRow = (k, v) => {
        const kd = document.createElement("span");
        kd.className = "k";
        kd.textContent = k;
        const vd = document.createElement("span");
        vd.className = "v";
        vd.textContent = v;
        lightboxMeta.appendChild(kd);
        lightboxMeta.appendChild(vd);
    };

    setRow("section", entry.dir === "wall-bin" ? "desktop" : "phone");
    setRow("type", entry.ext.toUpperCase());
    setRow("file size", humanSize(entry.size));
    setRow("resolution", "…");

    lightboxImg.src = srcOf(entry);
    lightboxImg.onload = () => {
        setRow("resolution", `${lightboxImg.naturalWidth} × ${lightboxImg.naturalHeight}`);
    };

    lightboxDl.href = srcOf(entry);
    lightboxDl.download = entry.filename;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    lightboxImg.onload = null;
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (ev) => {
    if (ev.target === lightbox) closeLightbox();
});
window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
});
