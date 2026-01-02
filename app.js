const PRICE = 11.5;
const TOTAL = 100;
const KEY = "scoreline_squares_v5";

const $ = id => document.getElementById(id);

let grid = load();
let selected = new Set();

/* ---------- Storage ---------- */
function load(){
  const raw = localStorage.getItem(KEY);
  if(raw){
    const p = JSON.parse(raw);
    if(Array.isArray(p) && p.length === TOTAL) return p;
  }
  return Array(TOTAL).fill(null);
}
function save(){
  localStorage.setItem(KEY, JSON.stringify(grid));
}

/* ---------- Helpers ---------- */
function idx(row,col){ return row*10+col }
function label(i){ return `${Math.floor(i/10)}x${i%10}` }

/* ---------- Render ---------- */
function render(){
  $("pricePerSquare").textContent = PRICE.toFixed(2);
  $("remaining").textContent = grid.filter(v=>!v).length;
  $("year").textContent = new Date().getFullYear();

  const q = Number($("quantity").value || 1);
  $("payBtn").textContent = `Simulate Payment for £${(q*PRICE).toFixed(2)}`;

  $("summaryText").textContent =
    selected.size
      ? `Selected: ${[...selected].map(label).join(", ")}`
      : "Click squares to select them";

  const g = $("grid");
  g.innerHTML = "";

  // top-left
  g.appendChild(document.createElement("div"));

  // column headers
  for(let c=0;c<10;c++){
    const h=document.createElement("div");
    h.className="hcell";
    h.textContent=c;
    g.appendChild(h);
  }

  // rows
  for(let r=0;r<10;r++){
    const h=document.createElement("div");
    h.className="hcell";
    h.textContent=r;
    g.appendChild(h);

    for(let c=0;c<10;c++){
      const i=idx(r,c);
      const d=document.createElement("div");
      d.className="cell"+
        (grid[i]?" taken":"")+
        (selected.has(i)?" selected":"");
      d.textContent = grid[i]?.username || "";
      d.onclick=()=>toggle(i);
      g.appendChild(d);
    }
  }
}

/* ---------- Actions ---------- */
function toggle(i){
  if(grid[i]) return;
  selected.has(i)?selected.delete(i):selected.add(i);
  render();
}

$("entryForm").onsubmit=e=>{
  e.preventDefault();
  const q=Number($("quantity").value||1);
  if(selected.size!==q){
    alert(`Select exactly ${q} square(s)`);
    return;
  }
  const u=$("username").value.trim();
  const eMail=$("email").value.trim();
  if(!u||!eMail) return alert("Username & Email required");

  for(const i of selected){
    grid[i]={username:u,email:eMail};
  }
  selected.clear();
  save();
  render();
};

$("resetBtn").onclick=()=>{
  if(confirm("Reset game?")){
    grid=Array(TOTAL).fill(null);
    selected.clear();
    save();
    render();
  }
};

$("exportBtn").onclick=()=>{
  const rows=[["row","col","user","email"]];
  grid.forEach((v,i)=>{
    if(v) rows.push([Math.floor(i/10),i%10,v.username,v.email]);
  });
  const csv=rows.map(r=>r.join(",")).join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv]));
  a.download="entries.csv";
  a.click();
};

$("quantity").oninput=render;

render();
