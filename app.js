/**
 * Scoreline Squares — Trial (static, no build)
 * - Stores entries in localStorage
 * - Buyer CLICKS to choose squares (0–9 labels on rows & columns)
 */

const TOTAL_SQUARES = 100;
const PRICE_PER_SQUARE = 11.50;

const $ = (id) => document.getElementById(id);

const stateKey = "scoreline_squares_trial_grid_v3";

// Grid state: array length 100, each cell is null or {username,email,ts}
let gridEntries = loadGrid();

// Selected squares for the current buyer (indices 0..99)
let selected = new Set();

function loadGrid(){
  try{
    const raw = localStorage.getItem(stateKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === TOTAL_SQUARES) return parsed;
    }

    // Backwards compatibility if older storage exists
    const oldV2 = localStorage.getItem("scoreline_squares_trial_grid_v2");
    if (oldV2) {
      const parsed2 = JSON.parse(oldV2);
      if (Array.isArray(parsed2) && parsed2.length === TOTAL_SQUARES) {
        localStorage.setItem(stateKey, JSON.stringify(parsed2));
        return parsed2;
      }
    }

    const oldV1 = localStorage.getItem("scoreline_squares_trial_entries_v1");
    if (oldV1) {
      const oldList = JSON.parse(oldV1);
      const newGrid = Array(TOTAL_SQUARES).fill(null);
      if (Array.isArray(oldList)) {
        for (let i = 0; i < Math.min(oldList.length, TOTAL_SQUARES); i++) {
          if (oldList[i]) newGrid[i] = oldList[i];
        }
      }
      localStorage.setItem(stateKey, JSON.stringify(newGrid));
      return newGrid;
    }

    return Array(TOTAL_SQUARES).fill(null);
  }catch(e){
    return Array(TOTAL_SQUARES).fill(null);
  }
}

function saveGrid(){
  localStorage.setItem(stateKey, JSON.stringify(gridEntries));
}

function moneyGBP(n){
  return "£" + (Math.round(n * 100) / 100).toFixed(2);
}

function remainingCount(){
  return gridEntries.filter(v => !v).length;
}

function indexFromRowCol(row, col){
  // row and col are 0..9
  return row * 10 + col;
}

function labelRowCol(row, col){
  // e.g. 0x0, 5x5, etc.
  return `${row}x${col}`;
}

function toggleSelect(index){
  if (gridEntries[index]) return; // taken can't be selected

  if (selected.has(index)) selected.delete(index);
  else selected.add(index);

  render();
}

function render(){
  $("pricePerSquare").textContent = PRICE_PER_SQUARE.toFixed(2);
  $("year").textContent = new Date().getFullYear();

  const remaining = remainingCount();
  $("remaining").textContent = remaining;

  const qty = Math.max(1, Number($("quantity").value || 1));
  $("payBtn").textContent = `Simulate Payment for ${moneyGBP(PRICE_PER_SQUARE * qty)}`;

  const sel = selected.size;
  $("summaryText").textContent =
    `Click empty squares to choose them. Selected: ${sel}/${qty}. (Test mode — no payments processed.)`;

  // Build an 11×11 grid: top-left blank, top headers 0..9, left headers 0..9
  const grid = $("grid");
  grid.innerHTML = "";

  // Top-left blank header cell
  const tl = document.createElement("div");
  tl.className = "hcell";
  tl.textContent = "";
  grid.appendChild(tl);

  // Top header row: 0..9
  for (let col = 0; col < 10; col++){
    const h = document.createElement("div");
    h.className = "hcell";
    h.textContent = String(col);
    grid.appendChild(h);
  }

  // Rows 0..9
  for (let row = 0; row < 10; row++){
    // Left header col
    const lh = document.createElement("div");
    lh.className = "hcell";
    lh.textContent = String(row);
    grid.appendChild(lh);

    // Data cells
    for (let col = 0; col < 10; col++){
      const idx = indexFromRowCol(row, col);
      const taken = !!gridEntries[idx];
      const isSelected = selected.has(idx);

      const cell = document.createElement("div");
      cell.className = "cell" + (taken ? " taken" : "") + (isSelected ? " selected" : "");

      cell.title = taken
        ? `Taken by ${gridEntries[idx].username}`
        : `Click to select ${labelRowCol(row, col)}`;

      cell.textContent = taken ? gridEntries[idx].username : "";

      cell.addEventListener("click", () => toggleSelect(idx));
      grid.appendChild(cell);
    }
  }

  $("payBtn").disabled = remaining <= 0;
}

function commitSelectedSquares({username, email}){
  const qty = Math.max(1, Number($("quantity").value || 1));
  const sel = Array.from(selected);

  if (sel.length !== qty){
    alert(`Please select exactly ${qty} square(s). You have selected ${sel.length}.`);
    return;
  }

  // Ensure still empty
  for (const idx of sel){
    if (gridEntries[idx]){
      alert("One of your selected squares was just taken. Please re-select.");
      selected.clear();
      render();
      return;
    }
  }

  const ts = new Date().toISOString();
  for (const idx of sel){
    gridEntries[idx] = { username, email, ts };
  }

  saveGrid();
  selected.clear();
  render();
}

function exportCSV(){
  const any = gridEntries.some(v => v);
  if(!any){
    alert("No entries yet.");
    return;
  }

  const header = ["row","col","square_label","username","email","timestamp"];
  const rows = [];

  for (let row=0; row<10; row++){
    for (let col=0; col<10; col++){
      const idx = indexFromRowCol(row, col);
      const e = gridEntries[idx];
      if (!e) continue;
      rows.push([row, col, labelRowCol(row, col), e.username, e.email, e.ts]);
    }
  }

  const csv = [header, ...rows]
    .map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "scoreline-squares-entries.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resetGame(){
  if(!confirm("Reset the game? This clears all trial entries.")) return;
  gridEntries = Array(TOTAL_SQUARES).fill(null);
  selected.clear();
  saveGrid();
  render();
}

// Events
$("entryForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const username = $("username").value.trim();
  const email = $("email").value.trim();

  if(!username){
    alert("Please enter a Username.");
    return;
  }
  if(!email){
    alert("Please enter an Email.");
    return;
  }

  commitSelectedSquares({username, email});

  $("username").value = "";
  $("email").value = "";
  $("quantity").value = 1;
  render();
});

$("quantity").addEventListener("input", render);
$("exportBtn").addEventListener("click", exportCSV);
$("resetBtn").addEventListener("click", resetGame);

render();
