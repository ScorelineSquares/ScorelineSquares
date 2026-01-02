/**
 * Scoreline Squares — Trial
 * Headings layout:
 *  - HOME shown once above grid
 *  - AWAY shown once to the left of grid (horizontal)
 * Grid stays: top 0–9 (home digits), left 0–9 (away digits)
 * Square IDs: H{col}-A{row}
 */

const PRICE = 11.5;
const TOTAL = 100;

const GRID_KEY = "scoreline_grid_v9";
const TEAM_KEY = "scoreline_teams_v4";

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
function saveGrid(){ localStorage.setItem(GRID_KEY, JSON.stringify(grid)); }

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
function saveTeams(){ localStorage.setItem(TEAM_KEY, JSON.stringify(teams)); }

/* ---------- Helpers ---------- */
function idx(row,col){ return row * 10 + col; } // row=away, col=home
function squareId(row,col){ return `H${col}-A${row}`; }
function remaining(){ return grid.filter(v=>!v).length; }

function selectedIds(){
  return [...selected].sort((a,b)=>a-b).map(i=>{
    const row = Math.floor(i/10);
    const col = i % 10;
    return squareId(row,col);
  });
}

/* ---------- Inject headings around existing grid (no style overhaul) ---------- */
function ensureBoardChrome(){
  const gridCard = document.querySelectorAll(".card")[1];
  if(!gridCard) return;

  // Already added?
  if(document.getElementById("boardChrome")) return;

  const gridWrap = gridCard.querySelector(".grid-wrap");
  const gridEl = $("grid");
  if(!gridWrap || !gridEl) return;

  // Create wrapper that holds: away label (left) + gridWrap (right)
  const chrome = document.createElement("div");
  chrome.id = "boardChrome";
  chrome.style.display = "grid";
  chrome.style.gridTemplateColumns = "160px 1fr";
  chrome.style.gap = "10px";
  chrome.style.alignItems = "start";
  chrome.style.marginTop = "10px";

  // Home title above the grid, aligned with the grid itself
  const homeTitle = document.createElement("div");
  homeTitle.id = "homeTitleLine";
  homeTitle.style.gridColumn = "2 / 3";
  homeTitle.style.fontWeight = "800";
  homeTitle.style.marginBottom = "6px";
  homeTitle.style.color = "var(--text, #e9eef6)";
  homeTitle.innerHTML = `HOME TEAM: <span id="homeTitle" style="color:#c7d2fe;">TBD (Home)</span>`;

  // Away title to the left of the grid
  const awayTitle = document.createElement("div");
  awayTitle.id = "awayTitleLine";
  awayTitle.style.gridColumn = "1 / 2";
  awayTitle.style.marginTop = "36px"; // aligns visually with top number row
  awayTitle.style.fontWeight = "800";
  awayTitle.style.color = "var(--text, #e9eef6)";
  awayTitle.innerHTML = `AWAY TEAM: <span id="awayTitle" style="color:#a7f3d0;">TBD (Away)</span>`;

  // Move gridWrap into our chrome container (right column)
  const parent = gridWrap.parentNode;
  parent.removeChild(gridWrap);

 
