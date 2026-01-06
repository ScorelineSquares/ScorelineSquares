/* Scoreline Squares (Trial) – Multi-board, sold-out archive + viewable boards, 1-hour kickoff refund rule
   - Random assignment (no choosing)
   - SOLD squares show tooltip with username on hover/click
   - When board hits 100 SOLD -> archived with reference, new board auto-created
   - Sold-out boards list is clickable; each opens a read-only grid view
   - Purchase summary includes board reference
   - 1 hour before kickoff: if active board not full -> VOID + mark all entrants REFUNDED (simulated), new board opens
*/

(() => {
  const GRID_SIZE = 10;
  const TOTAL = GRID_SIZE * GRID_SIZE;

  const SEASON_LABEL = "Superbowl 2026";
  const STORAGE_KEY = "scoreline_squares_trial_boards_v2";

  // ---- DOM ----
  const gridEl = document.getElementById("grid");
  const formEl = document.getElementById("entryForm");
  const remainingEl = document.getElementById("remaining");
  const summaryEl = document.getElementById("summaryText");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const gridCard = gridEl?.closest(".card") || gridEl?.parentElement;

  // ---- Tooltip ----
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

  // ---- State ----
  // state = { seasonLabel, nextRefNumber, activeBoardId, boards:[Board] }
  // Board = { id, ref, createdAt, kickoffAt, status:'open'|'soldout'|'void', sold:{idx:Entry}, refunds:Entry[] }
  // Entry = { username, email, ts }
  let state = loadState();
  ensureActiveBoard();

  // ---- View modes ----
  // current: active board purchase view
  // archiveList: list of sold-out boards
  // archiveView: view one sold-out board grid (read-only)
  let viewMode = "current";
  let selectedArchiveBoardId = null;

  // ---- Injected UI ----
  const ui = {
    nav: null,
    btnCurrent: null,
    btnArchive: null,
    titleLine: null,

    adminWrap: null,
    kickoffInput: null,
    runCheckBtn: null,

    archiveWrap: null,
    archiveBackBtn: null,
  };

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

  function setSummary(msg) {
    if (summaryEl) summaryEl.textContent = msg;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { seasonLabel: SEASON_LABEL, nextRefNumber: 1, activeBoardId: null, boards: [] };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("bad");

      if (!Array.isArray(parsed.boards)) parsed.boards = [];
      if (typeof parsed.nextRefNumber !== "number") parsed.nextRefNumber = 1;
      if (typeof parsed.seasonLabel !== "string") parsed.seasonLabel = SEASON_LABEL;

      return parsed;
    } catch {
      return { seasonLabel: SEASON_LABEL, nextRefNumber: 1, activeBoardId: null, boards: [] };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getBoard(id) {
    return state.boards.find(b => b.id === id) || null;
  }

  function getActiveBoard() {
    return getBoard(state.activeBoardId);
  }

  function createBoard() {
    const ref = `${state.seasonLabel} • Board #${String(state.nextRefNumber).padStart(4, "0")}`;
    state.nextRefNumber += 1;

    const b = {
      id: uid(),
      ref,
      createdAt: now(),
      kickoffAt: null,
      status: "open",
      sold: {},
      refunds: [],
    };
    state.boards.unshift(b); // newest first
    return b;
  }

  function ensureActiveBoard() {
    const active = getActiveBoard();
    if (!active || active.status !== "open") {
      const b = createBoard();
      state.activeBoardId = b.id;
      saveState();
    }
  }

  function soldCount(board) { return Object.keys(board.sold).length; }
  function remaining(board) { return TOTAL - soldCount(board); }

  function availableIndices(board) {
    const soldSet = new Set(Object.keys(board.sold).map(Number));
    const avail = [];
    for (let i = 0; i < TOTAL; i++) if (!soldSet.has(i)) avail.push(i);
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

  // ---- Tooltip ----
  function tooltipHtml(entry) {
    return `<div style="font-weight:900; margin-bottom:4px;">SOLD</div>
            <div style="opacity:0.92;">Buyer: <span style="font-weight:800;">${escapeHtml(entry.username)}</span></div>`;
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

  // ---- UI injection ----
  function ensureUI() {
    if (!gridCard || ui.nav) return;

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

    const btnCurrent = document.createElement("button");
    btnCurrent.type = "button";
    btnCurrent.className = "btn";
    btnCurrent.style.marginTop = "0";
    btnCurrent.textContent = "Current board";

    const btnArchive = document.createElement("button");
    btnArchive.type = "button";
    btnArchive.className = "btn";
    btnArchive.style.marginTop = "0";
    btnArchive.textContent = "Sold-out boards";

    left.appendChild(btnCurrent);
    left.appendChild(btnArchive);

    const titleLine = document.createElement("div");
    titleLine.style.fontWeight = "900";
    titleLine.style.opacity = "0.92";

    nav.appendChild(left);
    nav.appendChild(titleLine);

    // Admin kickoff controls
    const adminWrap = document.createElement("div");
    adminWrap.style.marginTop = "10px";
    adminWrap.style.paddingTop = "10px";
    adminWrap.style.borderTop = "1px solid rgba(255,255,255,0.08)";

    const adminTitle = document.createElement("div");
    adminTitle.textContent = "Admin (trial): Kickoff / 1-hour check";
    adminTitle.style.fontWeight = "900";
    adminTitle.style.marginBottom = "8px";
    adminTitle.style.opacity = "0.9";

    const adminRow = document.createElement("div");
    adminRow.style.display = "flex";
    adminRow.style.gap = "8px";
    adminRow.style.flexWrap = "wrap";
    adminRow.style.alignItems = "center";

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
    helper.textContent = "Set kickoff for the current board. If not full at 1-hour cutoff -> VOID + refunds (simulated) and a new board opens.";

    adminRow.appendChild(kickoffInput);
    adminRow.appendChild(runCheckBtn);
    adminWrap.appendChild(adminTitle);
    adminWrap.appendChild(adminRow);
    adminWrap.appendChild(helper);

    // Archive container
    const archiveWrap = document.createElement("div");
    archiveWrap.style.display = "none";
    archiveWrap.style.marginTop = "12px";

    // Back button (for archive board view)
    const archiveBackBtn = document.createElement("button");
    archiveBackBtn.type = "button";
    archiveBackBtn.className = "btn";
    archiveBackBtn.style.marginTop = "0";
    archiveBackBtn.textContent = "← Back to sold-out boards";
    archiveBackBtn.style.display = "none";
    archiveBackBtn.style.marginBottom = "10px";

    archiveWrap.appendChild(archiveBackBtn);

    gridCard.insertBefore(nav, gridCard.firstChild);
    gridCard.appendChild(adminWrap);
    gridCard.appendChild(archiveWrap);

    ui.nav = nav;
    ui.btnCurrent = btnCurrent;
    ui.btnArchive = btnArchive;
    ui.titleLine = titleLine;
    ui.adminWrap = adminWrap;
    ui.kickoffInput = kickoffInput;
    ui.runCheckBtn = runCheckBtn;
    ui.archiveWrap = archiveWrap;
    ui.archiveBackBtn = archiveBackBtn;

    btnCurrent.addEventListener("click", () => {
      viewMode = "current";
      selectedArchiveBoardId = null;
      render();
    });

    btnArchive.addEventListener("click", () => {
      viewMode = "archiveList";
      selectedArchiveBoardId = null;
      render();
    });

    archiveBackBtn.addEventListener("click", () => {
      viewMode = "archiveList";
      selectedArchiveBoardId = null;
      render();
    });

    kickoffInput.addEventListener("change", () => {
      const b = getActiveBoard();
      if (!b) return;
      const val = kickoffInput.value;
      b.kickoffAt = val ? new Date(val).getTime() : null;
      saveState();
      render();
    });

    runCheckBtn.addEventListener("click", () => runOneHourCheck());
  }

  // ---- Rules ----
  function markSoldOutIfFull(board) {
    if (board.status !== "open") return false;
    if (soldCount(board) >= TOTAL) {
      board.status = "soldout";
      return true;
    }
    return false;
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

    if (t < oneHourBefore) {
      setSummary("Not within 1 hour of kickoff yet (trial check uses current time).");
      return;
    }

    if (b.status !== "open") {
      setSummary("Current board is not open.");
      return;
    }

    if (soldCount(b) < TOTAL) {
      const entries = Object.values(b.sold);
      b.refunds = entries;
      b.sold = {};
      b.status = "void";

      const newBoard = createBoard();
      state.activeBoardId = newBoard.id;

      saveState();
      setSummary(`Board voided (not full at 1-hour cutoff). ${entries.length} entries marked REFUNDED (simulated). New board opened.`);
      render();
      return;
    }

    b.status = "soldout";
    const newBoard = createBoard();
    state.activeBoardId = newBoard.id;
    saveState();
    setSummary("Board is full at 1-hour check (valid). Archived and new board opened.");
    render();
  }

  // ---- Purchase ----
  function handlePurchase(username, email, qty) {
    const b = getActiveBoard();
    if (!b) return;

    if (b.status !== "open") {
      setSummary("This board is not open.");
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

    const ids = chosen.map(indexToId).join(", ");
    const receiptLine = `Board: ${b.ref}`;

    const soldOutNow = markSoldOutIfFull(b);

    if (soldOutNow) {
      const newBoard = createBoard();
      state.activeBoardId = newBoard.id;
      saveState();

      setSummary(`✅ Purchase complete.\n${receiptLine}\nAssigned (random): ${ids}\n\nBoard sold out and archived! A new board has opened.`);
      render();
      return;
    }

    saveState();
    setSummary(`✅ Purchase complete.\n${receiptLine}\nAssigned (random): ${ids}`);
    render();
  }

  // ---- Rendering ----
  function render() {
    ensureUI();
    ensureActiveBoard();

    const active = getActiveBoard();

    // Update title line
    if (ui.titleLine) {
      if (viewMode === "current") ui.titleLine.textContent = active ? active.ref : "No active board";
      if (viewMode === "archiveList") ui.titleLine.textContent = `${state.seasonLabel} • Sold-out boards`;
      if (viewMode === "archiveView") {
        const b = getBoard(selectedArchiveBoardId);
        ui.titleLine.textContent = b ? b.ref : `${state.seasonLabel} • Board`;
      }
    }

    // Show/hide admin + archive containers
    if (ui.adminWrap) ui.adminWrap.style.display = (viewMode === "current") ? "block" : "none";
    if (ui.archiveWrap) ui.archiveWrap.style.display = (viewMode === "current") ? "none" : "block";
    if (ui.archiveBackBtn) ui.archiveBackBtn.style.display = (viewMode === "archiveView") ? "inline-block" : "none";

    // Sync kickoff input for current view
    if (ui.kickoffInput && active && viewMode === "current") {
      if (active.kickoffAt) {
        const d = new Date(active.kickoffAt);
        const pad = (n) => String(n).padStart(2, "0");
        ui.kickoffInput.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } else {
        ui.kickoffInput.value = "";
      }
    }

    pinned = null;
    hideTooltip();

    // Remaining display: show for current board only (keeps your left panel accurate)
    if (remainingEl) remainingEl.textContent = active ? String(remaining(active)) : "0";

    if (viewMode === "current") {
      renderBoardGrid(active, { readOnly: false });
      return;
    }

    if (viewMode === "archiveList") {
      renderArchiveList();
      return;
    }

    if (viewMode === "archiveView") {
      const b = getBoard(selectedArchiveBoardId);
      renderArchiveBoardView(b);
      return;
    }
  }

  function renderBoardGrid(board, { readOnly }) {
    if (!gridEl || !board) return;

    // Ensure grid element visible
    gridEl.style.display = "grid";
    if (ui.archiveWrap) ui.archiveWrap.style.display = (viewMode === "current") ? "none" : "block";

    gridEl.innerHTML = "";

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
          const entry = board.sold[idx];

          cell.className = "cell square";
          cell.dataset.index = String(idx);

          if (entry) {
            cell.classList.add("taken");
            cell.innerHTML = `<span style="font-weight:900; font-size:11px; letter-spacing:.6px;">SOLD</span>`;

            // hover/click username
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
            // unsold cell
            cell.style.cursor = "default";
            if (readOnly) {
              // show empty square for archived boards (should not happen if sold-out, but safe)
              cell.innerHTML = "";
            }
          }

          if (readOnly) {
            // prevent any accidental changes; squares are view-only
            cell.style.cursor = entry ? "pointer" : "default";
          }
        }

        gridEl.appendChild(cell);
      }
    }
  }

  function renderArchiveList() {
    if (!ui.archiveWrap) return;

    // Clear everything except back button (first child)
    ui.archiveWrap.innerHTML = "";
    ui.archiveWrap.appendChild(ui.archiveBackBtn);

    // Hide grid while browsing list
    if (gridEl) gridEl.style.display = "none";

    const soldOutBoards = state.boards.filter(b => b.status === "soldout");

    if (soldOutBoards.length === 0) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No sold-out boards yet.";
      ui.archiveWrap.appendChild(empty);
      return;
    }

    const note = document.createElement("div");
    note.className = "muted";
    note.style.marginBottom = "10px";
    note.textContent = "Tap/click a board to open it and view all SOLD squares.";
    ui.archiveWrap.appendChild(note);

    soldOutBoards.forEach(b => {
      const card = document.createElement("div");
      card.style.padding = "12px";
      card.style.borderRadius = "12px";
      card.style.background = "rgba(255,255,255,0.04)";
      card.style.border = "1px solid rgba(255,255,255,0.08)";
      card.style.marginTop = "10px";
      card.style.cursor = "pointer";

      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.justifyContent = "space-between";
      top.style.alignItems = "baseline";
      top.style.gap = "12px";

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
      hint.textContent = "Open board →";

      card.appendChild(top);
      card.appendChild(hint);

      card.addEventListener("click", () => {
        selectedArchiveBoardId = b.id;
        viewMode = "archiveView";
        render();
      });

      ui.archiveWrap.appendChild(card);
    });
  }

  function renderArchiveBoardView(board) {
    if (!ui.archiveWrap) return;

    ui.archiveWrap.innerHTML = "";
    ui.archiveWrap.appendChild(ui.archiveBackBtn);

    if (!board) {
      const msg = document.createElement("div");
      msg.className = "muted";
      msg.textContent = "Board not found.";
      ui.archiveWrap.appendChild(msg);
      if (gridEl) gridEl.style.display = "none";
      return;
    }

    const header = document.createElement("div");
    header.style.marginBottom = "10px";

    const title = document.createElement("div");
    title.style.fontWeight = "900";
    title.style.marginBottom = "4px";
    title.textContent = board.ref;

    const meta = document.createElement("div");
    meta.className = "muted";
    meta.textContent = `Status: SOLD OUT • Created: ${new Date(board.createdAt).toLocaleString()}`;

    const tip = document.createElement("div");
    tip.className = "muted";
    tip.style.marginTop = "6px";
    tip.textContent = "Hover/tap SOLD squares to see the buyer’s username.";

    header.appendChild(title);
    header.appendChild(meta);
    header.appendChild(tip);

    ui.archiveWrap.appendChild(header);

    // Show grid and render as read-only
    renderBoardGrid(board, { readOnly: true });
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

  // Close pinned tooltip on outside click
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
