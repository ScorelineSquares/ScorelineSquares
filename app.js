/**
 * Scoreline Squares — Trial
 * - Home team shown ONCE above grid
 * - Away team shown ONCE above row labels
 * - Grid headers remain 0–9
 * - Squares have IDs like H1-A6 (Home col 1, Away row 6)
 */

const PRICE = 11.5;
const TOTAL = 100;

const GRID_KEY = "scoreline_grid_v7";
const TEAM_KEY = "scoreline_teams_v2";

const $ = (id) => document.getElementById(id);

let grid = loadGrid();
let selected = new Set();
let teams = loadTeams();

/* ---------- Storage ---------- */
function loadGrid(){
  try{
    const raw = localStorage.getItem(GRID_KEY);
    if(raw){
      const p = JSON.parse(raw);
      if(Array.isArray(p) && p.length === TOTAL) return p;
    }
  }catch(e){}
  return Array(TOTAL).fill(null);
}
function saveGrid(){
  localStorage.setItem(GRID_KEY, JSON.stringify(grid));
}

function loadTeams(){
  try{
    const raw = localStorage.getItem(TEAM_KEY);
    if(raw){
      const p = JSON.parse(raw);
      return {
        home: (p.home || "TBD").trim() || "TBD",
        away: (p.away || "TBD").trim() || "TBD",
      };
    }
  }catch(e){}
  return { home:"TBD", away:"TBD" };
}
function saveTeams(){
  localStorage.setItem(TEAM_KEY, JSON.stringify(teams));
}

/* ---------- Helpers ---------- */
function idx(row,col){ return row * 10 + col; } // row=away, col=home
function squareId(row,col){ return `H${col}-A${row}`; } // e.g. H1-A6
function remaining(){ return grid.filter(v=>!v).length; }

function selectedIds(){
  return [...selected]
    .sort((a,b)=>a-b)
    .map(i=>{
      const row = Math.floor(i/10);
      const col = i % 10;
      return squareId(row,col);
    });
}

/* ---------- Ensure a place to show team names (inject once) ---------- */
function ensureTeamTitleUI(){
  const gridCard = document.querySelectorAll(".card")[1]; // second card is grid card
  if(!gridCard) return;

  if(document.getElementById("teamTitles")) return;

  const titles = document.createElement("div");
  titles.id = "teamTitles";
  titles.style.display = "flex";
  titles.style.justifyContent = "space-between";
  titles.style.alignItems = "flex-end";
  titles.style.gap = "12px";
  titles.style.marginBottom = "10px";

  titles.innerHTML = `
    <div style="font-weight:800;">
      Home: <span id="homeTitle" style="color:#c7d2fe;">TBD (Home)</span>
    </div>
    <div style="font-weight:800;">
      Away: <span id="awayTitle" style="color:#a7f3d0;">TBD (Away)</span>
    </div>
  `;

  // Insert above the grid-wrap if possible
  const gridWrap = gridCard.querySelector(".grid-wrap");
  if(gridWrap) gridCard.insertBefore(titles, gridWrap);
}

/* ---------- Inject Admin team inputs (if not already in HTML) ---------- */
function ensureAdminTeamInputs(){
  const adminDetails = document.querySelector("details.admin");
  if(!adminDetails) return;
  if(document.getElementById("homeTeam")) return;

  const wrap = document.createElement("div");
  wrap.style.marginTop = "10px";
  wrap.innerHTML = `
    <div class="muted small" style="margin:8px 0 6px;">Team setup</div>

    <label class="small">Home team (top)</label>
    <input id="homeTeam" placeholder="e.g. Chiefs" />

    <label class="small">Away team (side)</label>
    <input id="awayTeam" placeholder="e.g. Eagles" />

    <button type="button" id="saveTeamsBtn" style="margin-top:10px;">Save team names</button>
  `;
  adminDetails.appendChild(wrap);

  document.getElementById("saveTeamsBtn").onclick = () => {
    const h = document.getElementById("homeTeam").value.trim();
    const a = document.getElementById("awayTeam").value.trim();
    teams = { home: h || "TBD", away: a || "TBD" };
    saveTeams();
    render();
    alert("Saved. Team names updated.");
  };
}

/* ---------- Render ---------- */
function render(){
  ensureTeamTitleUI();
  ensureAdminTeamInputs();

  // Update top details
  const priceEl = $("pricePerSquare");
  if(priceEl) priceEl.textContent = PRICE.toFixed(2);

  const remEl = $("remaining");
  if(remEl) remEl.textContent = remaining();

  const yearEl = $("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  const qty = Number($("quantity").value || 1);
  $("payBtn").textContent = `Simulate Payment for £${(qty * PRICE).toFixed(2)}`;

  // Team names shown once
  const homeTitle = document.getElementById("homeTitle");
  const awayTitle = document.getElementById("awayTitle");
  if(homeTitle) homeTitle.textContent = `${teams.home} (Home)`;
  if(awayTitle) awayTitle.textContent = `${teams.away} (Away)`;

  // Admin inputs reflect current values
  const homeInput = $("homeTeam");
  const awayInput = $("awayTeam");
  if(homeInput && awayInput){
    homeInput.value = teams.home === "TBD" ? "" : teams.home;
    awayInput.value = teams.away === "TBD" ? "" : teams.away;
  }

  // Summary shows chosen square IDs
  const sel = selectedIds();
  $("summaryText").textContent = sel.length
    ? `Selected: ${sel.join(", ")}`
    : `Click squares to select them (IDs like H1-A6).`;

  // Build 11×11 grid: corner, top headers 0..9, left headers 0..9, then squares
  const gridEl = $("grid");
  gridEl.innerHTML = "";

  // Corner
  const corner = document.createElement("div");
  corner.className = "hcell";
  corner.textContent = "";
  gridEl.appendChild(corner);

  // Top headers 0..9 (Home columns)
  for(let col=0; col<10; col++){
    const h = document.createElement("div");
    h.className = "hcell";
    h.textContent = String(col);
    gridEl.appendChild(h);
  }

  // Rows 0..9 (Away rows)
  for(let row=0; row<10; row++){
    const lh = document.createElement("div");
    lh.className = "hcell";
    lh.textContent = String(row);
    gridEl.appendChild(lh);

    for(let col=0; col<10; col++){
      const i = idx(row,col);
      const taken = !!grid[i];
      const isSel = selected.has(i);

      const d = document.createElement("div");
      d.className = "cell" + (taken ? " taken" : "") + (isSel ? " selected" : "");
      d.textContent = taken ? grid[i].username : "";
      d.title = taken
        ? `${squareId(row,col)} • Taken by ${grid[i].username}`
        : `${squareId(row,col)} • Click to select`;

      d.onclick = () => toggle(i);
      gridEl.appendChild(d);
    }
  }
}

/* ---------- Selecting squares ---------- */
function toggle(i){
  if(grid[i]) return;
  selected.has(i) ? selected.delete(i) : selected.add(i);
  render();
}

/* ---------- Form submit ---------- */
$("entryForm").onsubmit = (ev) => {
  ev.preventDefault();

  const qty = Number($("quantity").value || 1);
  if(selected.size !== qty){
    alert(`Select exactly ${qty} square(s).`);
    return;
  }

  const username = $("username").value.trim();
  const email = $("email").value.trim();
  if(!username || !email){
    alert("Username & Email required.");
    return;
  }

  for(const i of selected){
    grid[i] = { username, email, ts: new Date().toISOString() };
  }
  selected.clear();
  saveGrid();
  render();

  $("username").value = "";
  $("email").value = "";
  $("quantity").value = 1;
};

/* ---------- Admin: reset & export ---------- */
$("resetBtn").onclick = () => {
  if(confirm("Reset game? This clears all entries.")){
    grid = Array(TOTAL).fill(null);
    selected.clear();
    saveGrid();
    render();
  }
};

$("exportBtn").onclick = () => {
  const rows = [["square_id","away_row","home_col","username","email","timestamp"]];
  for(let row=0; row<10; row++){
    for(let col=0; col<10; col++){
      const i = idx(row,col);
      if(!grid[i]) continue;
      rows.push([squareId(row,col), row, col, grid[i].username, grid[i].email, grid[i].ts || ""]);
    }
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
  a.download = "scoreline-squares-entries.csv";
  a.click();
};

$("quantity").oninput = render;

/* ---------- Start ---------- */
render();
