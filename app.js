/* Scoreline Squares (Trial) – Multi-board, sold-out archive, 1-hour kickoff refund rule
   - Random assignment (no choosing)
   - SOLD squares show tooltip with username on hover/click
   - When board hits 100 SOLD -> archived with reference, new board auto-created
   - Only sold-out boards are "valid"
   - 1 hour before kickoff: if active board not full -> VOID + mark all entrants REFUNDED (simulated)
*/

(() => {
  const GRID_SIZE = 10;
  const TOTAL = GRID_SIZE * GRID_SIZE;

  const SEASON_LABEL = "Superbowl 2026"; // change later per season
  const STORAGE_KEY = "scoreline_squares_trial_boards_v1";

  // ---- DOM (existing IDs from your page) ----
  const gridEl = document.getElementById("grid");
  const formEl = document.getElementById("entryForm");
  const remainingEl = document.getElementById("remaining");
  const summaryEl = document.getElementById("summaryText");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // We'll inject a small "Current / Sold-out boards" toggle UI above the grid
  const gridCard = gridEl?.closest(".card") || gridEl?.parentElement;
  const injectedUI = {
    navWrap: null,
    currentBtn: null,
    archiveBtn: null,
    titleLine: null,
    adminWrap: null,
    kickoffInput: null,
    runCheckBtn: null,
    archiveWrap: null,
  };

  // ---- Tooltip (single floating) ----
  const tooltip = document.createElement("div");
  Object.assign(tooltip.style, {
    position: "fixed",
    zIndex: 9999,
    maxWidth: "240px",
    padding: "8px 10px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(15, 22, 32, 0.96)",
    color: "#e9eef6",
    fontSize: "12px",
    lineHeight: "1.2",
    boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
    backdropFilter: "blur(8px)",
    display: "none",
    pointerEvents: "none",
  });
  document.body.appendChild(tooltip);

  let pinned = null;

  // ---- State model ----
  // state = { seasonLabel, nextRefNumber, activeBoardId, boards: [Board] }
  // Board = { id, ref, createdAt, kickoffAt, status: 'open'|'soldout'|'void', sold: {idx: Entry}, refunds: Entry[] }
  // Entry = { username, email, ts }
  let state = loadState();
  ensureActiveBoard();

  // ---- Helpers ----
  function now() { return Date.now(); }

  function uid() {
    return "b_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          seasonLabel: SEASON_LABEL,
          nextRefNumber: 1,
          activeBoardId: null,
          boards: [],
        };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("bad");
      if (!Array.isArray(parsed.boards)) parsed.boards = [];
      if (typeof parsed.nextRefNumber !== "number") parsed.nextRefNumber = 1;
      if (typeof parsed.seasonLabel !== "string") parsed.seasonLabel = SEASON_LABEL;
      return parsed;
    } catch {
      return {
        seasonLabel: SEASON_LABEL,
        nextRefNumber: 1,
        activeBoardId: null,
        boards: [],
      };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getBoard(boardId) {
    return state.boards.find(b => b.id === boardId) || null;
  }

  function getActiveBoard() {
    return getBoard(state.activeBoardId);
  }

  function ensureActiveBoard() {
    // If no active board, or active is not open, create one.
    const active = getActiveBoard();
    if (!active || active.status !== "open") {
      const b = createBoard();
      state.activeBoardId = b.id;
      saveState();
    }
  }

  function createBoard() {
    const ref = `${state.seasonLabel} • Board #${String(state.nextRefNumber).padStart(4, "0")}`;
    state.nextRefNumber += 1;

    const b = {
      id: uid(),
      ref,
      createdAt: now(),
      kickoffAt: null, // set by admin (ms timestamp)
      status: "open", // open | soldout | void
      sold: {},       // idx -> entry
      refunds: [],    // entries refunded when voided
    };
    state.boards.unshift(b); // newest first
    return b;
  }

  function soldCount(board) {
    return Object.keys(board.sold).length;
  }

  function remaining(board) {
    return TOTAL - soldCount(board);
  }

  function availableIndices(board) {
    const soldSet = new Set(Object.keys(board.sold).map(Number));
    const avail = [];
    for (let i = 0; i < TOTAL; i++) {
      if (!soldSet.has(i)) avail.push(i);
    }
    return avail;
  }

  function pickRandom(arr, count) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }

  function indexToId(idx) {
    const row = Math.floor(idx / GRID_SIZE); // away
    const col = idx % GRID_SIZE;            // home
    return `H${col}-A${row}`;
  }

  function setSummary(msg) {
    if (summaryEl) summaryEl.textContent = msg;
  }

  // ---- Tooltip ----
  function tooltipHtml(entry) {
    return `<div style="font-weight:800; margin-bottom:4px;">SOLD</div>
            <div style="opacity:0.9;">Buyer: <span style="font-weight:700;">${escapeHtml(entry.username)}</span></div>`;
  }

  function showTooltipAt(x, y, html) {
    tooltip.innerHTML = html;
    tooltip.style.display = "block";

    const pad = 12;
    const offset = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const rect = tooltip.getBoundingClientRect();
    let left = x + offset;
    let top = y + offset;

    if (left + rect.width + pad > vw) left = Math.max(pad, x - rect.width - offset);
    if (top + rect.height + pad > vh) top = Math.max(pad, y - rect.height - offset);

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.style.display = "none";
    tooltip.innerHTML = "";
  }

  // ---- UI injection (Current / Archive toggle + Kickoff admin) ----
  function ensureInjectedUI() {
    if (!gridCard || injectedUI.navWrap) return;

    const nav = document.createElement("div");
    nav.style.display = "flex";
    nav.style.gap = "8px";
    nav.style.alignItems = "center";
    nav.style.justifyContent = "space-between";
    nav.style.marginBottom = "10px";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.gap = "8px";
    left.style.alignItems = "center";

    const currentBtn = document.createElement("button");
    currentBtn.type = "button";
    currentBtn.textContent = "Current board";
    currentBtn.className = "btn";
    currentBtn.style.marginTop = "0";

    const archiveBtn = document.createElement("button");
    archiveBtn.type = "button";
    archiveBtn.textContent = "Sold-out boards";
    archiveBtn.className = "btn";
    archiveBtn.style.marginTop = "0";

    const titleLine = document.createElement("div");
    titleLine.style.fontWeight = "800";
    titleLine.style.opacity = "0.9";

    left.appendChild(currentBtn);
    left.appendChild(archiveBtn);

    nav.appendChild(left);
    nav.appendChild(titleLine);

    // Admin kickoff controls
    const adminWrap = document.createElement("div");
    adminWrap.style.margin = "10px 0 0 0";
    adminWrap.style.paddingTop = "10px";
    adminWrap.style.borderTop = "1px solid rgba(255,255,255,0.08)";

    const adminTitle = document.createElement("div");
    adminTitle.textContent = "Admin (trial): Kickoff / 1-hour check";
    adminTitle.style.fontWeight = "800";
    adminTitle.style.marginBottom = "8px";
    adminTitle.style.opacity = "0.9";

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.flexWrap = "wrap";
    row.style.alignItems = "center";

    const kickoffInput = document.createElement("input");
    kickoffInput.type = "datetime-local";
    kickoffInput.style.maxWidth = "260px";

    const runCheckBtn = document.createElement("button");
    runCheckBtn.type = "button";
    runCheckBtn.className = "btn";
    runCheckBtn.style.marginTop = "0";
    runCheckBtn.textContent = "Run 1-hour kickoff check";

    const helper = document.createElement("div");
    helper.className = "muted";
    helper.style.marginTop = "6px";
    helper.textContent = "Set kickoff for the current board. 1 hour before kickoff, if not full -> VOID + refunds (simulated).";

    row.appendChild(kickoffInput);
    row.appendChild(runCheckBtn);
    adminWrap.appendChild(adminTitle);
    adminWrap.appendChild(row);
    adminWrap.appendChild(helper);

    // Archive view container
    const archiveWrap = document.createElement("div");
    archiveWrap.style.display = "none";
    archiveWrap.style.marginTop = "12px";

    // Insert nav at top of the card (before existing content)
    gridCard.insertBefore(nav, gridCard.firstChild);
    gridCard.appendChild(adminWrap);
    gridCard.appendChild(archiveWrap);

    injectedUI.navWrap = nav;
    injectedUI.currentBtn = currentBtn;
    injectedUI.archiveBtn = archiveBtn;
    injectedUI.titleLine = titleLine;
    injectedUI.adminWrap = adminWrap;
    injectedUI.kickoffInput = kickoffInput;
    injectedUI.runCheckBtn = runCheckBtn;
    injectedUI.archiveWrap = archiveWrap;

    currentBtn.addEventListener("click", () => setView("current"));
    archiveBtn.addEventListener("click", () => setView("archive"));

    kickoffInput.addEventListener("change", () => {
      const b = getActiveBoard();
      if (!b) return;
      const val = kickoffInput.value;
      if (!val) {
        b.kickoffAt = null;
      } else {
        b.kickoffAt = new Date(val).getTime();
      }
      saveState();
      render();
    });

    runCheckBtn.addEventListener("click", () => {
      runOneHourCheck();
    });
  }

  let viewMode = "current"; // current | archive

  function setView(mode) {
    viewMode = mode;
    render();
  }

  // ---- Core rules ----
  function markSoldOutIfFull(board) {
    if (board.status !== "open") return false;
    if (soldCount(board) >= TOTAL) {
      board.status = "soldout";
      return true;
    }
    return false;
  }

  function autoOpenNewBoardIfNeeded() {
    const active = getActiveBoard();
    if (!active || active.status !== "open") {
      ensureActiveBoard();
    }
  }

  function runOneHourCheck() {
    const b = getActiveBoard();
    if (!b) return;

    if (!b.kickoffAt) {
      setSummary("Set a kickoff time first (Admin).");
      return;
    }

    const oneHourBefore = b.kickoffAt - 60 * 60 * 1000;
    const t = now();

    // In real life this would run automatically on server time.
    // In trial mode, we run it when you click.
    if (t < oneHourBefore) {
      setSummary("Not within 1 hour of kickoff yet (trial check uses current time).");
      return;
    }

    if (b.status !== "open") {
      setSummary("Current board is not open.");
      return;
    }

    if (soldCount(b) < TOTAL) {
      // VOID + refunds
      const entries = Object.values(b.sold);
      b.refunds = entries;
      b.sold = {};
      b.status = "void";

      // Open a new board for continued sales (trial behaviour)
      const newBoard = createBoard();
      state.activeBoardId = newBoard.id;

      saveState();
      setSummary(`Board voided (not full at 1-hour cutoff). ${entries.length} entries marked REFUNDED (simulated). New board opened.`);
      render();
      return;
    }

    // If full, it should already be soldout, but handle just in case
    b.status = "soldout";
    const newBoard = createBoard();
    state.activeBoardId = newBoard.id;
    saveState();
    setSummary("Board is full at 1-hour check (valid). Archived and new board opened.");
    render();
  }

  // ---- Random purchase on active board ----
  function handlePurchase(username, email, qty) {
    const b = getActiveBoard();
    if (!b) return;

    if (b.status !== "open") {
      setSummary("This board is not open. Please switch to the current board.");
      return;
    }

    const avail = availableIndices(b);
    if (qty > avail.length) {
      setSummary(`Not enough squares left on this board. Only ${avail.length} remaining.`);
      return;
    }

    const chosen = pickRandom(avail, qty);
    chosen.forEach(idx => {
      b.sold[idx] = { username, email, ts: now() };
    });

    const wasSoldOut = markSoldOutIfFull(b);

    if (wasSoldOut) {
      // auto-open next board
      const newBoard = createBoard();
      state.activeBoardId = newBoard.id;
      saveState();

      const ids = chosen.map(indexToId).join(", ");
      setSummary(`Assigned (random): ${ids}. ✅ Board sold out and archived! New board opened.`);
      render();
      return;
    }

    saveState();
    const ids = chosen.map(indexToId).join(", ");
    setSummary(`Assigned (random): ${ids}`);
    render();
  }

  // ---- Render (Current vs Archive) ----
  function render() {
    ensureInjectedUI();
    autoOpenNewBoardIfNeeded();

    const active = getActiveBoard();

    // Title line
    if (injectedUI.titleLine) {
      if (viewMode === "current") {
        injectedUI.titleLine.textContent = active ? active.ref : "No active board";
      } else {
        injectedUI.titleLine.textContent = `${state.seasonLabel} • Sold-out boards`;
      }
    }

    // Keep kickoff input in sync
    if (injectedUI.kickoffInput && active && viewMode === "current") {
      if (active.kickoffAt) {
        // format to datetime-local (approx; timezone local)
        const d = new Date(active.kickoffAt);
        const pad = (n) => String(n).padStart(2, "0");
        const val = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        injectedUI.kickoffInput.value = val;
      } else {
        injectedUI.kickoffInput.value = "";
      }
    }

    // Toggle views
    if (injectedUI.archiveWrap) {
      injectedUI.archiveWrap.style.display = (viewMode === "archive") ? "block" : "none";
    }
    if (gridEl) {
      gridEl.style.display = (viewMode === "archive") ? "none" : "grid";
    }
    if (injectedUI.adminWrap) {
      injectedUI.adminWrap.style.display = (viewMode === "archive") ? "none" : "block";
    }

    // Render archive list
    if (viewMode === "archive") {
      renderArchive();
      if (remainingEl) remainingEl.textContent = active ? String(remaining(active)) : "0";
      return;
    }

    // Render current board grid
    if (!gridEl || !active) return;

    if (remainingEl) remainingEl.textContent = String(remaining(active));

    gridEl.innerHTML = "";

    // Build 11x11 with headers
    for (let r = -1; r < GRID_SIZE; r++) {
      for (let c = -1; c < GRID_SIZE; c++) {
        const cell = document.createElement("div");

        if (r === -1 && c === -1) {
          cell.className = "cell header";
          cell.textContent = "";
        } else if (r === -1) {
          cell.className = "cell header";
          cell.textContent = String(c);
        } else if (c === -1) {
          cell.className = "cell header";
          cell.textContent = String(r);
        } else {
          const idx = r * GRID_SIZE + c;
          const entry = active.sold[idx];

          cell.className = "cell square";
          cell.dataset.index = String(idx);

          if (entry) {
            cell.classList.add("taken");
            cell.innerHTML = `<span style="font-weight:900; font-size:11px; letter-spacing:.6px;">SOLD</span>`;

            cell.addEventListener("mouseenter", (e) => {
              if (pinned !== null) return;
              const ev = /** @type {MouseEvent} */ (e);
              showTooltipAt(ev.clientX, ev.clientY, tooltipHtml(entry));
            });
            cell.addEventListener("mousemove", (e) => {
              if (pinned !== null) return;
              const ev = /** @type {MouseEvent} */ (e);
              showTooltipAt(ev.clientX, ev.clientY, tooltipHtml(entry));
            });
            cell.addEventListener("mouseleave", () => {
              if (pinned !== null) return;
              hideTooltip();
            });

            cell.addEventListener("click", (e) => {
              e.stopPropagation();
              const idxNum = Number(cell.dataset.index);
              if (pinned === idxNum) {
                pinned = null;
                hideTooltip();
                return;
              }
              pinned = idxNum;
              const rect = cell.getBoundingClientRect();
              showTooltipAt(rect.left + rect.width / 2, rect.top + rect.height / 2, tooltipHtml(entry));
            });
          } else {
            // unsold squares not clickable (random assignment only)
            cell.style.cursor = "default";
          }
        }

        gridEl.appendChild(cell);
      }
    }
  }

  function renderArchive() {
    const wrap = injectedUI.archiveWrap;
    if (!wrap) return;

    const soldOutBoards = state.boards.filter(b => b.status === "soldout");
    wrap.innerHTML = "";

    if (soldOutBoards.length === 0) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No sold-out boards yet.";
      wrap.appendChild(empty);
      return;
    }

    soldOutBoards.forEach((b) => {
      const card = document.createElement("div");
      card.style.padding = "12px";
      card.style.borderRadius = "12px";
      card.style.background = "rgba(255,255,255,0.04)";
      card.style.border = "1px solid rgba(255,255,255,0.06)";
      card.style.marginTop = "10px";

      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.justifyContent = "space-between";
      top.style.gap = "10px";
      top.style.alignItems = "baseline";

      const title = document.createElement("div");
      title.style.fontWeight = "900";
      title.textContent = b.ref;

      const meta = document.createElement("div");
      meta.className = "muted";
      meta.textContent = `SOLD OUT • ${new Date(b.createdAt).toLocaleString()}`;

      top.appendChild(title);
      top.appendChild(meta);

      const hint = document.createElement("div");
      hint.className = "muted";
      hint.style.marginTop = "6px";
      hint.textContent = "Archived board (valid for competition). Squares are view-only.";

      card.appendChild(top);
      card.appendChild(hint);

      wrap.appendChild(card);
    });
  }

  // ---- Form submit ----
  if (formEl) {
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = document.getElementById("username")?.value?.trim();
      const email = document.getElementById("email")?.value?.trim();
      const qtyRaw = document.getElementById("quantity")?.value;

      const qty = Math.max(1, Number.parseInt(qtyRaw || "1", 10) || 1);

      if (!username) return setSummary("Please enter a username.");
      if (!email) return setSummary("Please enter an email.");

      handlePurchase(username, email, qty);
    });
  }

  // Close pinned tooltip when clicking elsewhere
  document.addEventListener("click", () => {
    if (pinned !== null) {
      pinned = null;
      hideTooltip();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      pinned = null;
      hideTooltip();
    }
  });

  // Initial render
  render();
})();
