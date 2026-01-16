const grid = document.getElementById("grid");

function buildGrid(){
  if(!grid) return;

  grid.innerHTML = "";

  // top row
  grid.appendChild(cell(""));
  for(let i=0;i<10;i++) grid.appendChild(cell(i));

  // rows
  for(let r=0;r<10;r++){
    grid.appendChild(cell(r));
    for(let c=0;c<10;c++){
      grid.appendChild(cell(""));
    }
  }
}

function cell(text){
  const d = document.createElement("div");
  d.textContent = text;
  return d;
}

buildGrid();
