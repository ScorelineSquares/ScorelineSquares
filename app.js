/**
 * Scoreline Squares — Trial (static, no build)
 * - Stores entries in localStorage (so refresh doesn't wipe your test)
 * - Simulates payment by assigning the next available squares in order
 */

const TOTAL_SQUARES = 100;
const PRICE_PER_SQUARE = 11.50;

const $ = (id) => document.getElementById(id);

const stateKey = "scoreline_squares_trial_entries_v1";
let entries = loadEntries();

function loadEntries(){
  try{
    const raw = localStorage.getItem(stateKey);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return [];
  }
}
function saveEntries(){
  localStorage.setItem(stateKey, JSON.stringify(entries));
}

function moneyGBP(n){
  return "£" + (Math.round(n * 100) / 100).toFixed(2);
}

function render(){
  $("pricePerSquare").textContent = PRICE_PER_SQUARE.toFixed(2);
  $("year").textContent = new Date().getFullYear();

  const remaining = TOTAL_SQUARES - entries.length;
  $("remaining").textContent = remaining;

  const qty = Math.max(1, Number($("quantity").value || 1));
  $("payBtn").textContent = `Simulate Payment for ${moneyGBP(PRICE_PER_SQUARE * qty)}`;

  $("summaryText").textContent = `This is a simulation. No payments are processed.`;

  const grid = $("grid");
  grid.innerHTML = "";
  for(let i=0;i<TOTAL_SQUARES;i++){
    const cell = document.createElement("div");
    cell.className = "cell" + (entries[i] ? " taken" : "");
    cell.textContent = entries[i]?.username || "";
    grid.appendChild(cell);
  }

  $("payBtn").disabled = remaining <= 0;
}

function addEntries({username, email, quantity}){
  const remaining = TOTAL_SQUARES - entries.length;
  if(quantity > remaining){
    alert(`Not enough squares remaining. Only ${remaining} left.`);
    return;
  }
  for(let i=0;i<quantity;i++){
    entries.push({ username, email, ts: new Date().toISOString() });
  }
  saveEntries();
  render();
}

function exportCSV(){
  if(!entries.length){
    alert("No entries yet.");
    return;
  }
  const header = ["square_index","username","email","timestamp"];
  const rows = entries.map((e, idx) => [idx+1, e.username, e.email, e.ts]);
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
  entries = [];
  saveEntries();
  render();
}

$("entryForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const username = $("username").value.trim();
  const email = $("email").value.trim();
  const quantity = Math.max(1, Number($("quantity").value || 1));

  if(!username){
    alert("Please enter a Username.");
    return;
  }
  if(!email){
    alert("Please enter an Email.");
    return;
  }

  addEntries({username, email, quantity});

  $("username").value = "";
  $("email").value = "";
  $("quantity").value = 1;
  render();
});

$("quantity").addEventListener("input", render);
$("exportBtn").addEventListener("click", exportCSV);
$("resetBtn").addEventListener("click", resetGame);

render();
