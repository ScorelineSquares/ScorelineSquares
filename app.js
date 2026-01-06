/* Scoreline Squares (Trial) – Multi-board + archive viewer + Find My Board + Find My Squares + Printable view + URL hash routing
   - Random assignment (no choosing)
   - SOLD squares show tooltip with username on hover/click
   - When board hits 100 SOLD -> archived with reference, new board auto-created
   - Sold-out boards list clickable; opens read-only grid view
   - Receipt summary includes board reference
   - Find my board (by number/ref) opens sold-out board
   - Find my squares (by username OR email) lists all boards + square IDs owned
   - Printable board view (Print button in board view)
   - URL hash routing:
       #board=0003  -> opens that sold-out board
       #find=user:john  -> runs Find My Squares (username contains)
       #find=email:test@x.com -> runs Find My Squares (email contains)
*/

(() => {
  const GRID_SIZE = 10;
  const TOTAL = GRID_SIZE * GRID_SIZE;

  const SEASON_LABEL = "Superbowl 2026";
  const STORAGE_KEY = "scoreline_squares_trial_boards_v4";

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
  let state = loadState();
  ensureActiveBoard();

  // ---- Views ----
  // current | archiveList | archiveView | findSquares
  let viewMode = "current";
  let selectedArchiveBoardId = null;

  // ---- UI refs ----
  const ui = {
    nav: null,
    btnCurrent: null,
    btnArchive: null,
    titleLine: null,

    findWrap: null,
    findBoardInput: null,
    findBoardBtn: null,
    findSquaresInput: null,
    findSquaresBtn: null,
    findMsg: null,

    adminWrap: null,
    kickoffInput: null,
    runCheckBtn: null,

    archiveWrap: null,
    backBtn: null,
    printBtn: null,
  };

  // ---- Helpers ----
  function now(){ return Date.now(); }

  function uid(){
    return "b_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setSummary(msg){
    if (summaryEl) summaryEl.textContent = msg;
  }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return { seasonLabel: SEASON_LABEL, nextRefNumber: 1, activeBoardId: null, boards: [] };
      const parsed = JSON.parse(raw);
      if(!parsed || typeof parsed !== "object") throw new Error("bad");
      if(!Array.isArray(parsed.boards)) parsed.boards = [];
      if(typeof parsed.nextRefNumber !== "number") parsed.nextRefNumber = 1;
      if(typeof parsed.seasonLabel !== "string") parsed.seasonLabel = SEASON_LABEL;
      return parsed;
    }catch{
      return { seasonLabel: SEASON_LABEL, nextRefNumber: 1, activeBoardId: null, boards: [] };
    }
  }

  function saveState(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getBoard(id){
    return state.boards.find(b => b.id === id) || null;
  }

  function getActiveBoard(){
    return getBoard(state.activeBoardId);
  }

  function createBoard(){
    const ref = `${state.seasonLabel} • Board #${String(state.nextRefNumber).padStart(4, "0")}`;
    state.nextRefNumber += 1;

    const b = {
      id: uid(),
      ref,
      createdAt: now(),
      kickoffAt: null,
      status: "open",   // open | soldout | void
      sold: {},         // idx -> entry
      refunds: [],      // entries refunded if voided
    };
    state.boards.unshift(b);
    return b;
  }

  function ensureActiveBoard(){
    const active = getActiveBoard();
    if(!active || active.status !== "open"){
      const b = createBoard();
      state.activeBoardId = b.id;
      saveState();
    }
  }

  function soldCount(board){ return Object.keys(board.sold).length; }
  function remaining(board){ return TOTAL - soldCount(board); }

  function availableIndices(board){
    const soldSet = new Set(Object.keys(board.sold).map(Number));
    const avail = [];
    for(let i=0;i<TOTAL;i++) if(!soldSet.has(i)) avail.push(i);
    return avail;
  }

  function pickRandom(arr, count){
    const copy = arr.slice();
    for(let i=copy.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }

  function idxToSquareId(idx){
    const row = Math.floor(idx / GRID_SIZE);
    const col = idx % GRID_SIZE;
    return `H${col}-A${row}`;
  }

  function normalizeBoardSearch(q){
    const s = (q || "").trim();
    if(!s) return null;
    const m = s.match(/(\d{1,6})/);
    if(!m) return null;
    const num = Number.parseInt(m[1], 10);
    if(!Number.isFinite(num) || num <= 0) return null;
    return String(num).padStart(4, "0");
  }

  function findSoldOutBoardByNumber(padded4){
    const soldOutBoards = state.boards.filter(b => b.status === "soldout");
    return soldOutBoards.find(b => b.ref.includes(`#${padded4}`)) || null;
  }

  // ---- Tooltip ----
  function tooltipHtml(entry){
    return `<div style="font-weight:900; margin-bottom:4px;">SOLD</div>
            <div style="opacity:0.92;">Buyer: <span style="font-weight:800;">${escapeHtml(entry.username)}</span></div>`;
  }

  function showTooltipAt(x, y, html){
    tooltip.innerHTML = html;
    tooltip.style.display = "block";

    const pad = 12;
    const offset = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const rect = tooltip.getBoundingClientRect();
    let left = x + offset;
    let top = y + offset;

    if(left + rect.width + pad > vw) left = Math.max(pad, x - rect.width - offset);
    if(top + rect.height + pad > vh) top = Math.max(pad, y - rect.height - offset);

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip(){
    tooltip.style.display = "none";
    tooltip.innerHTML = "";
  }

  // ---- Print styles (injected once) ----
  function ensurePrintStyles(){
    if (document.getElementById("printStyles")) return;

    const style = document.createElement("style");
    style.id = "printStyles";
    style.textContent = `
      @media print {
        body { background: #fff !important; color: #000 !important; }
        .topbar, .notice, .layout > section:first-child, .admin, .btn, input { display:none !important; }
        .layout { display:block !important; padding:0 !important; }
        .card { box-shadow:none !important; border:none !important; background:#fff !important; }
        .muted { color:#333 !important; opacity:1 !important; }
        .grid { gap:1px !important; }
        .cell { border:1px solid #ccc !important; background:#fff !important; color:#000 !important; }
        .square.taken { background:#f3f4f6 !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ---- UI injection ----
  function ensureUI(){
    if(!gridCard || ui.nav) return;

    // NAV
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

    // FIND WRAP (board + squares)
    const findWrap = document.createElement("div");
    findWrap.style.margin = "10px 0 0 0";
    findWrap.style.paddingTop = "10px";
    findWrap.style.borderTop = "1px solid rgba(255,255,255,0.08)";

    const findTitle = document.createElement("div");
    findTitle.textContent = "Find my board / squares";
    findTitle.style.fontWeight = "900";
    findTitle.style.marginBottom = "8px";
    findTitle.style.opacity = "0.9";

    const rows = document.createElement("div");
    rows.style.display = "grid";
    rows.style.gridTemplateColumns = "1fr";
    rows.style.gap = "10px";

    // Find board row
    const rowBoard = document.createElement("div");
    rowBoard.style.display = "flex";
    rowBoard.style.gap = "8px";
    rowBoard.style.flexWrap = "wrap";
    rowBoard.style.alignItems = "center";

    const findBoardInput = document.createElement("input");
    findBoardInput.placeholder = "Board number (e.g. 0003)";
    findBoardInput.style.maxWidth = "260px";

    const findBoardBtn = document.createElement("button");
    findBoardBtn.type = "button";
    findBoardBtn.className = "btn";
    findBoardBtn.style.marginTop = "0";
    findBoardBtn.textContent = "Open board";

    rowBoard.appendChild(findBoardInput);
    rowBoard.appendChild(findBoardBtn);

    // Find squares row
    const rowSquares = document.createElement("div");
    rowSquares.style.display = "flex";
    rowSquares.style.gap = "8px";
    rowSquares.style.flexWrap = "wrap";
    rowSquares.style.alignItems = "center";

    const findSquaresInput = document.createElement("input");
    findSquaresInput.placeholder = "Username or Email (e.g. john or john@mail.com)";
    findSquaresInput.style.maxWidth = "320px";

    const findSquaresBtn = document.createElement("button");
    findSquaresBtn.type = "button";
    findSquaresBtn.className = "btn";
    findSquaresBtn.style.marginTop = "0";
    findSquaresBtn.textContent = "Find my squares";

    rowSquares.appendChild(findSquaresInput);
    rowSquares.appendChild(findSquaresBtn);

    const findMsg = document.createElement("div");
    findMsg.className = "muted";
    findMsg.style.marginTop = "6px";
    findMsg.textContent = "Board search works for SOLD-OUT boards only. Squares search checks all boards.";

    rows.appendChild(rowBoard);
    rows.appendChild(rowSquares);

    findWrap.appendChild(findTitle);
    findWrap.appendChild(rows);
    findWrap.appendChild(findMsg);

    // ADMIN
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
    helper.textContent = "If not full at 1-hour cutoff -> VOID + refunds (simulated).";

    adminRow.appendChild(kickoffInput);
    adminRow.appendChild(runCheckBtn);

    adminWrap.appendChild(adminTitle);
    adminWrap.appendChild(adminRow);
    adminWrap.appendChild(helper);

    // ARCHIVE WRAP + buttons
    const archiveWrap = document.createElement("div");
    archiveWrap.style.display = "none";
    archiveWrap.style.marginTop = "12px";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn";
    backBtn.style.marginTop = "0";
    backBtn.textContent = "← Back";
    backBtn.style.display = "none";
    backBtn.style.marginBottom = "10px";

    const printBtn = document.createElement("button");
    printBtn.type = "button";
    printBtn.className = "btn";
    printBtn.style.marginTop = "0";
    printBtn.textContent = "Print this board";
    printBtn.style.display = "none";
    printBtn.style.marginBottom = "10px";
    printBtn.style.marginLeft = "8px";

    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.alignItems = "center";
    btnRow.appendChild(backBtn);
    btnRow.appendChild(printBtn);

    archiveWrap.appendChild(btnRow);

    // Mount
    gridCard.insertBefore(nav, gridCard.firstChild);
    gridCard.appendChild(findWrap);
    gridCard.appendChild(adminWrap);
    gridCard.appendChild(archiveWrap);

    // Store refs
    ui.nav = nav;
    ui.btnCurrent = btnCurrent;
    ui.btnArchive = btnArchive;
    ui.titleLine = titleLine;

    ui.findWrap = findWrap;
    ui.findBoardInput = findBoardInput;
    ui.findBoardBtn = findBoardBtn;
    ui.findSquaresInput = findSquaresInput;
    ui.findSquaresBtn = findSquaresBtn;
    ui.findMsg = findMsg;

    ui.adminWrap = adminWrap;
    ui.kickoffInput = kickoffInput;
    ui.runCheckBtn = runCheckBtn;

    ui.archiveWrap = archiveWrap;
    ui.backBtn = backBtn;
    ui.printBtn = printBtn;

    // Events - nav
    btnCurrent.addEventListener("click", () => {
      viewMode = "current";
      selectedArchiveBoardId = null;
      window.location.hash = "";
      render();
    });

    btnArchive.addEventListener("click", () => {
      viewMode = "archiveList";
      selectedArchiveBoardId = null;
      window.location.hash = "#archive=1";
      render();
    });

    backBtn.addEventListener("click", () => {
      // back from archiveView or findSquares to archiveList
      if (viewMode === "archiveView") {
        viewMode = "archiveList";
        selectedArchiveBoardId = null;
        window.location.hash = "#archive=1";
      } else if (viewMode === "findSquares") {
        viewMode = "archiveList";
        window.location.hash = "#archive=1";
      }
      render();
    });

    // Events - admin
    kickoffInput.addEventListener("change", () => {
      const b = getActiveBoard();
      if(!b) return;
      const val = kickoffInput.value;
      b.kickoffAt = val ? new Date(val).getTime() : null;
      saveState();
      render();
    });

    runCheckBtn.addEventListener("click", () => runOneHourCheck());

    // Events - find board
    findBoardBtn.addEventListener("click", () => openBoardFromInput());
    findBoardInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); openBoardFromInput(); }
    });

    // Events - find squares
    findSquaresBtn.addEventListener("click", () => runFindSquaresFromInput());
    findSquaresInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); runFindSquaresFromInput(); }
    });

    // Print
    printBtn.addEventListener("click", () => {
      ensurePrintStyles();
      window.print();
    });
  }

  function openBoardFromInput(){
    const target = normalizeBoardSearch(ui.findBoardInput?.value || "");
    if(!target){
      ui.findMsg.textContent = "Enter a board number (e.g. 0003).";
      return;
    }
    const b = findSoldOutBoardByNumber(target);
    if(!b){
      ui.findMsg.textContent = `No sold-out board found for #${target}.`;
      return;
    }
    openSoldOutBoard(b);
  }

  function openSoldOutBoard(board){
    selectedArchiveBoardId = board.id;
    viewMode = "archiveView";
    window.location.hash = `#board=${encodeURIComponent(board.ref.match(/#(\d{4})/)?.[1] || "")}`;
    render();
  }

  function runFindSquaresFromInput(){
    const q = (ui.findSquaresInput?.value || "").trim();
    if(!q){
      ui.findMsg.textContent = "Enter a Username or Email to search.";
      return;
    }
    window.location.hash = `#find=${encodeURIComponent(q)}`;
    runFindSquares(q);
  }

  // ---- Core rules ----
  function markSoldOutIfFull(board){
    if(board.status !== "open") return false;
    if(soldCount(board) >= TOTAL){
      board.status = "soldout";
      return true;
    }
    return false;
  }

  function runOneHourCheck(){
    const b = getActiveBoard();
    if(!b) return;

    if(!b.kickoffAt){
      setSummary("Set a kickoff time first (Admin).");
      return;
    }

    const oneHourBefore = b.kickoffAt - 60 * 60 * 1000;
    const t = now();

    if(t < oneHourBefore){
      setSummary("Not within 1 hour of kickoff yet (trial check uses current time).");
      return;
    }

    if(b.status !== "open"){
      setSummary("Current board is not open.");
      return;
    }

    if(soldCount(b) < TOTAL){
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
  function handlePurchase(username, email, qty){
    const b = getActiveBoard();
    if(!b) return;

    if(b.status !== "open"){
      setSummary("This board is not open.");
      return;
    }

    const avail = availableIndices(b);
    if(qty > avail.length){
      setSummary(`Not enough squares left on this board. Only ${avail.length} remaining.`);
      return;
    }

    const chosen = pickRandom(avail, qty);
    chosen.forEach(idx => {
      b.sold[idx] = { username, email, ts: now() };
    });

    const ids = chosen.map(idxToSquareId).join(", ");
    const receipt = `Board: ${b.ref}`;

    const soldOutNow = markSoldOutIfFull(b);

    if(soldOutNow){
      const newBoard = createBoard();
      state.activeBoardId = newBoard.id;
      saveState();

      setSummary(`✅ Purchase complete.\n${receipt}\nAssigned (random): ${ids}\n\nBoard sold out and archived! A new board has opened.`);
      render();
      return;
    }

    saveState();
    setSummary(`✅ Purchase complete.\n${receipt}\nAssigned (random): ${ids}`);
    render();
  }

  // ---- Render ----
  function render(){
    ensureUI();
    ensureActiveBoard();

    const active = getActiveBoard();

    // Title line
    if(ui.titleLine){
      if(viewMode === "current") ui.titleLine.textContent = active ? active.ref : "No active board";
      if(viewMode === "archiveList") ui.titleLine.textContent = `${state.seasonLabel} • Sold-out boards`;
      if(viewMode === "archiveView") {
        const b = getBoard(selectedArchiveBoardId);
        ui.titleLine.textContent = b ? b.ref : `${state.seasonLabel} • Board`;
      }
      if(viewMode === "findSquares") ui.titleLine.textContent = `${state.seasonLabel} • Find my squares`;
    }

    // Remaining (active board)
    if(remainingEl) remainingEl.textContent = active ? String(remaining(active)) : "0";

    // Show/hide admin/archive
    if(ui.adminWrap) ui.adminWrap.style.display = (viewMode === "current") ? "block" : "none";
    if(ui.archiveWrap) ui.archiveWrap.style.display = (viewMode === "current") ? "none" : "block";

    // Back/Print buttons
    if(ui.backBtn) ui.backBtn.style.display = (viewMode === "archiveView" || viewMode === "findSquares") ? "inline-block" : "none";
    if(ui.printBtn) ui.printBtn.style.display = (viewMode === "archiveView") ? "inline-block" : "none";

    // Sync kickoff input
    if(ui.kickoffInput && active && viewMode === "current"){
      if(active.kickoffAt){
        const d = new Date(active.kickoffAt);
        const pad = (n) => String(n).padStart(2,"0");
        ui.kickoffInput.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }else{
        ui.kickoffInput.value = "";
      }
    }

    pinned = null;
    hideTooltip();

    if(viewMode === "current"){
      if(gridEl) gridEl.style.display = "grid";
      renderBoardGrid(active, { readOnly: false });
      if(ui.archiveWrap) ui.archiveWrap.innerHTML = ui.archiveWrap.firstChild ? ui.archiveWrap.firstChild.outerHTML : "";
      return;
    }

    if(viewMode === "archiveList"){
      renderArchiveList();
      return;
    }

    if(viewMode === "archiveView"){
      renderArchiveBoardView(getBoard(selectedArchiveBoardId));
      return;
    }

    if(viewMode === "findSquares"){
      // archiveWrap holds the results panel in this mode
      // (content rendered by runFindSquares)
      return;
    }
  }

  function renderBoardGrid(board, { readOnly }){
    if(!gridEl || !board) return;

    gridEl.innerHTML = "";

    for(let r=-1; r<GRID_SIZE; r++){
      for(let c=-1; c<GRID_SIZE; c++){
        const cell = document.createElement("div");

        if(r===-1 && c===-1){
          cell.className = "cell header";
          cell.textContent = "";
        } else if(r===-1){
          cell.className = "cell header";
          cell.textContent = String(c);
        } else if(c===-1){
          cell.className = "cell header";
          cell.textContent = String(r);
        } else {
          const idx = r*GRID_SIZE + c;
          const entry = board.sold[idx];

          cell.className = "cell square";
          cell.dataset.index = String(idx);

          if(entry){
            cell.classList.add("taken");
            cell.innerHTML = `<span style="font-weight:900; font-size:11px; letter-spacing:.6px;">SOLD</span>`;

            cell.addEventListener("mouseenter",(e)=>{
              if(pinned!==null) return;
              showTooltipAt(e.clientX, e.clientY, tooltipHtml(entry));
            });
            cell.addEventListener("mousemove",(e)=>{
              if(pinned!==null) return;
              showTooltipAt(e.clientX, e.clientY, tooltipHtml(entry));
            });
            cell.addEventListener("mouseleave",()=>{
              if(pinned!==null) return;
              hideTooltip();
            });
            cell.addEventListener("click",(e)=>{
              e.stopPropagation();
              const idxNum = Number(cell.dataset.index);
              if(pinned===idxNum){
                pinned=null; hideTooltip(); return;
              }
              pinned=idxNum;
              const rect = cell.getBoundingClientRect();
              showTooltipAt(rect.left+rect.width/2, rect.top+rect.height/2, tooltipHtml(entry));
            });
          } else {
            cell.style.cursor = "default";
          }

          if(readOnly){
            cell.style.cursor = entry ? "pointer" : "default";
          }
        }

        gridEl.appendChild(cell);
      }
    }
  }

  function renderArchiveList(){
    if(!ui.archiveWrap) return;
    if(gridEl) gridEl.style.display = "none";

    ui.archiveWrap.innerHTML = "";
    ui.archiveWrap.appendChild(makeTopButtonsRow());

    const soldOut = state.boards.filter(b => b.status === "soldout");

    const note = document.createElement("div");
    note.className = "muted";
    note.style.marginBottom = "10px";
    note.textContent = "Click a board to open it. Or use Find my board above.";
    ui.archiveWrap.appendChild(note);

    if(soldOut.length === 0){
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No sold-out boards yet.";
      ui.archiveWrap.appendChild(empty);
      return;
    }

    soldOut.forEach(b=>{
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

      card.addEventListener("click", ()=>{
        selectedArchiveBoardId = b.id;
        viewMode = "archiveView";
        const num = b.ref.match(/#(\d{4})/)?.[1] || "";
        window.location.hash = `#board=${encodeURIComponent(num)}`;
        render();
      });

      ui.archiveWrap.appendChild(card);
    });
  }

  function renderArchiveBoardView(board){
    if(!ui.archiveWrap) return;

    ui.archiveWrap.innerHTML = "";
    ui.archiveWrap.appendChild(makeTopButtonsRow(true));

    if(!board){
      const msg = document.createElement("div");
      msg.className = "muted";
      msg.textContent = "Board not found.";
      ui.archiveWrap.appendChild(msg);
      if(gridEl) gridEl.style.display = "none";
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

    if(gridEl) gridEl.style.display = "grid";
    renderBoardGrid(board, { readOnly: true });
  }

  function makeTopButtonsRow(showPrint){
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.marginBottom = "10px";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "btn";
    back.style.marginTop = "0";
    back.textContent = "← Back";
    back.addEventListener("click", () => {
      viewMode = "archiveList";
      selectedArchiveBoardId = null;
      window.location.hash = "#archive=1";
      render();
    });

    row.appendChild(back);

    if(showPrint){
      const print = document.createElement("button");
      print.type = "button";
      print.className = "btn";
      print.style.marginTop = "0";
      print.style.marginLeft = "8px";
      print.textContent = "Print this board";
      print.addEventListener("click", () => {
        ensurePrintStyles();
        window.print();
      });
      row.appendChild(print);
    }

    return row;
  }

  // ---- Find my squares ----
  function runFindSquares(query){
    const q = (query || "").trim().toLowerCase();
    if(!q) return;

    // Decide if this looks like an email
    const looksEmail = q.includes("@");

    const matches = []; // { board, squares:[{id, idx, entry}] }
    for(const b of state.boards){
      const squares = [];
      for(const [k, entry] of Object.entries(b.sold)){
        const idx = Number(k);
        const u = (entry.username || "").toLowerCase();
        const e = (entry.email || "").toLowerCase();

        const hit = looksEmail ? e.includes(q) : u.includes(q) || e.includes(q);
        if(hit){
          squares.push({ id: idxToSquareId(idx), idx, entry });
        }
      }
      if(squares.length){
        matches.push({ board: b, squares });
      }
    }

    // Switch view and render results panel
    viewMode = "findSquares";
    selectedArchiveBoardId = null;
    renderFindSquaresResults(query, matches);
  }

  function renderFindSquaresResults(query, matches){
    ensureUI();
    if(!ui.archiveWrap) return;

    if(gridEl) gridEl.style.display = "none";
    ui.archiveWrap.style.display = "block";
    ui.adminWrap.style.display = "none";
    ui.backBtn.style.display = "inline-block";
    ui.printBtn.style.display = "none";

    ui.archiveWrap.innerHTML = "";
    ui.archiveWrap.appendChild(makeTopButtonsRow(false));

    const h = document.createElement("div");
    h.style.marginBottom = "10px";

    const title = document.createElement("div");
    title.style.fontWeight = "900";
    title.textContent = `Results for: ${query}`;

    const sub = document.createElement("div");
    sub.className = "muted";
    sub.style.marginTop = "6px";
    sub.textContent = "Click a board result to open it (sold-out boards open as full grids).";

    h.appendChild(title);
    h.appendChild(sub);
    ui.archiveWrap.appendChild(h);

    if(!matches.length){
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No matches found in any board.";
      ui.archiveWrap.appendChild(empty);
      return;
    }

    matches.forEach(({ board, squares }) => {
      const card = document.createElement("div");
      card.style.padding = "12px";
      card.style.borderRadius = "12px";
      card.style.background = "rgba(255,255,255,0.04)";
      card.style.border = "1px solid rgba(255,255,255,0.08)";
      card.style.marginTop = "10px";

      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.justifyContent = "space-between";
      top.style.alignItems = "baseline";
      top.style.gap = "12px";

      const title = document.createElement("div");
      title.style.fontWeight = "900";
      title.textContent = board.ref;

      const meta = document.createElement("div");
      meta.className = "muted";
      meta.textContent = `${board.status.toUpperCase()} • ${squares.length} square(s)`;

      top.appendChild(title);
      top.appendChild(meta);

      const list = document.createElement("div");
      list.className = "muted";
      list.style.marginTop = "8px";
      list.textContent = `Squares: ${squares.map(s => s.id).join(", ")}`;

      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "btn";
      openBtn.style.marginTop = "10px";
      openBtn.textContent = board.status === "soldout" ? "Open board" : "View board (not sold out)";
      openBtn.addEventListener("click", () => {
        if(board.status === "soldout"){
          openSoldOutBoard(board);
        } else {
          // Non-soldout board: show message (trial mode)
          setSummary(`That board is ${board.status.toUpperCase()} and not valid for competition.`);
        }
      });

      card.appendChild(top);
      card.appendChild(list);
      card.appendChild(openBtn);

      ui.archiveWrap.appendChild(card);
    });
  }

  // ---- URL Hash routing ----
  function parseHash(){
    const h = (window.location.hash || "").replace(/^#/, "").trim();
    if(!h) return { type: "none" };

    // #board=0003
    if(h.startsWith("board=")){
      const v = decodeURIComponent(h.slice("board=".length));
      const padded = normalizeBoardSearch(v);
      return padded ? { type: "board", num: padded } : { type: "none" };
    }

    // #archive=1
    if(h.startsWith("archive=")) return { type: "archive" };

    // #find=...
    if(h.startsWith("find=")){
      const v = decodeURIComponent(h.slice("find=".length));
      return { type: "find", query: v };
    }

    return { type: "none" };
  }

  function applyHash(){
    const parsed = parseHash();
    if(parsed.type === "board"){
      const b = findSoldOutBoardByNumber(parsed.num);
      if(b){
        selectedArchiveBoardId = b.id;
        viewMode = "archiveView";
        render();
      } else {
        // fall back to archive list
        viewMode = "archiveList";
        render();
      }
      return;
    }

    if(parsed.type === "archive"){
      viewMode = "archiveList";
      render();
      return;
    }

    if(parsed.type === "find"){
      runFindSquares(parsed.query);
      // keep viewMode set by runFindSquares
      return;
    }

    // default
    viewMode = "current";
    render();
  }

  window.addEventListener("hashchange", applyHash);

  // ---- Form submit ----
  if(formEl){
    formEl.addEventListener("submit",(e)=>{
      e.preventDefault();

      const username = document.getElementById("username")?.value?.trim();
      const email = document.getElementById("email")?.value?.trim();
      const qtyRaw = document.getElementById("quantity")?.value;

      const qty = Math.max(1, Number.parseInt(qtyRaw || "1", 10) || 1);

      if(!username) return setSummary("Please enter a username.");
      if(!email) return setSummary("Please enter an email.");

      handlePurchase(username, email, qty);
    });
  }

  // Close pinned tooltip
  document.addEventListener("click", ()=>{
    if(pinned !== null){
      pinned = null;
      hideTooltip();
    }
  });

  document.addEventListener("keydown",(e)=>{
    if(e.key === "Escape"){
      pinned = null;
      hideTooltip();
    }
  });

  // ---- Start ----
  applyHash();
})();
