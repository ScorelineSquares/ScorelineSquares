/**
 * Scoreline Squares — Trial (static, no build)
 * - Stores entries in localStorage
 * - Allows users to CLICK and choose squares before “payment”
 */

const TOTAL_SQUARES = 100;
const PRICE_PER_SQUARE = 11.50;

const $ = (id) => document.getElementById(id);

const stateKey = "scoreline_squares_trial_grid_v2";

// Grid state: array length 100, each cell is null or {username,email,ts}
let gridEntries = loadGrid();

// Which squares the current buyer has selected (indices 0..99)
let selected = new Set();

function loadGrid(){
  try{
    const raw = localStorage.getItem(stateKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If it already looks like a 100-length grid, use it
      if (Array.isArray(parsed) && parsed.length === TOTAL_SQUARES) return parsed;
    }

    // Backwards compatibility with older “sequential list” storage if present
    // (If you used the old version, it stored entries as a simple array)
    const oldRaw = localStorage.getItem("scoreline_squares_trial_entries_v1");
    if (oldRaw) {
      const oldList = JSON.parse(oldRaw);
      const newGrid = Array(TOTAL_SQUARES).fill(null);
      if (Array.isArray(oldList)) {
        for (let i = 0; i < Math.min(oldList.length, TOTAL_SQUARES); i++) {
          if (oldList[i]) newGrid[i] = oldList[i];
        }
      }
      localStorage.setItem(stateKey, JSON.stringify(newGrid));
      return newGrid;
    }

    // Fresh
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

function selectedCount(){
  return selected.size;
}

function indexToLabel(i){
  // Optional: show coordinates like 1x1 ... 10x10
  const row = Math.floor(i / 10) + 1;
  const col = (i % 10) + 1;
  return `${row}x${col}`;
}

function toggleSelect(i){
  // Can only select empty squares
  if (gridEntries[i]) return;

  if (selected.has(i)) {
    selected.delete(i);
  } else {
    selected.add(i);
  }
  render();
}

function render(){
  $("pricePerSquare").textContent = PRICE_PER_SQUARE.toFixed(2);
  $("year").textContent = new Date().getFullYear();

  const remaining = remainingCount();
  $("remaining").textContent = remaining;

  const qty = Math.max(1, Number($("quantity").value || 1));
  $("payBtn").textContent = `Simulate Payment for ${moneyGBP(PRICE_PER_SQUARE * qty)}`;

  // Helpful instruction text
  const sel = selectedCount();
  $("summaryText").textContent =
    `Click empty squares to choose them. Selected: ${sel}/${qty}. (Test mode — no payments processed.)`;

  // Grid UI
  const grid = $("grid");
  grid.innerHTML = "";

  for(let i=0;i<TOTAL_SQUARES;i++){
    const cell = document.createElement("div");
    const taken = !!gridEntries[i];
    const isSelected = selected.has(i);

    cell.className = "cell" + (taken ? " taken" : "") + (isSelected ? " selected" : "");
    cell.title = taken ? `Taken by ${gridEntries[i].username}` : `Click to select ${indexToLabel(i)}`;
    cell.textContent = taken ? gridEntries[i].username : "";

    // Click handler
    cell.addEventListener("click", () => toggleSelect(i));

    grid.appendChild(cell);
  }

  // Disable pay button if full
  $("payBtn").disabled = remaining <= 0;
}

function commitSelectedSquares({username, email}){
  const qty = Math.max(1, Number($("quantity").value || 1));
  const sel = Array.from(selected);

  if (sel.length !== qty){
    alert(`Please select exactly ${qty} square(s). You have selected ${sel.length}.`);
    return;
  }

  // Double-check selected squares are still empty
  for (const i of sel){
    if (gridEntries[i]){
      alert("One of your selected squares was just taken. Please re-select.");
      selected.clear();
      render();
      return;
    }
  }

  // Assign
  const ts = new Date().toISOString();
  for (const i of sel){
    gridEntries[i] = { username, email, ts };
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
  const header = ["square_index","square_label","username","email","timestamp"];
  const rows = [];

  for (let i=0;i<TOTAL_SQUARES;i++){
    const e = gridEntries[i];
    if (!e) continue;
    rows.push([i+1, indexToLabel(i), e.username, e.email, e.ts]);
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

  // Clear form (optional)
  $("username").value = "";
  $("email").value = "";
  $("quantity").value = 1;
  render();
});

$("quantity").addEventListener("input", () => {
  // If they change quantity, keep selection but update instruction text
  render();
});

$("exportBtn").addEventListener("click", exportCSV);
$("resetBtn").addEventListener("click", resetGame);

// Initial render
render();
