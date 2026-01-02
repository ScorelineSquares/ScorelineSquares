:root{
  --bg:#0b0f14;
  --card:#121924;
  --text:#e9eef6;
  --muted:#a8b3c7;
  --accent:#7c5cff;
  --good:#2dd4bf;
  --line:rgba(255,255,255,.12);
  --radius:16px;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --sans: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}

*{ box-sizing:border-box }

body{
  margin:0;
  font-family:var(--sans);
  background:
    radial-gradient(900px 500px at 20% -10%, rgba(124,92,255,.28), transparent 55%),
    radial-gradient(900px 500px at 90% 0%, rgba(45,212,191,.20), transparent 55%),
    var(--bg);
  color:var(--text);
}

/* Layout */
.topbar, .notice, .layout, .footer{
  max-width:1100px;
  margin:0 auto;
  padding:16px;
}

.layout{
  display:grid;
  grid-template-columns:360px 1fr;
  gap:16px;
}

@media(max-width:900px){
  .layout{ grid-template-columns:1fr }
}

/* Cards */
.card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:var(--radius);
  padding:16px;
}

.muted{ color:var(--muted) }
.small{ font-size:12px }

/* Form */
label{ display:block; margin-top:10px; font-weight:600 }
input{
  width:100%;
  padding:10px;
  margin-top:4px;
  border-radius:10px;
  border:1px solid var(--line);
  background:#0f1620;
  color:var(--text);
}

button{
  margin-top:12px;
  width:100%;
  padding:12px;
  border-radius:12px;
  border:none;
  background:var(--accent);
  color:white;
  font-weight:700;
  cursor:pointer;
}

/* GRID */
.grid-wrap{
  width:100%;
  overflow-x:auto;
}

.grid{
  display:grid;
  grid-template-columns:36px repeat(10, 56px);
  grid-template-rows:36px repeat(10, 56px);
  gap:2px;
  min-width:596px;
  min-height:596px;
}

/* Headers */
.hcell{
  background:#1f2937;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:var(--mono);
  font-size:12px;
  border-radius:6px;
  pointer-events:none;
}

/* Squares */
.cell{
  background:#111827;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:12px;
  border-radius:6px;
  cursor:pointer;
}

.cell.selected{
  outline:3px solid var(--accent);
  background:rgba(124,92,255,.35);
}

.cell.taken{
  background:rgba(45,212,191,.25);
  cursor:not-allowed;
}
