function render(){
  $("pricePerSquare").textContent = PRICE_PER_SQUARE.toFixed(2);
  $("year").textContent = new Date().getFullYear();

  const remaining = remainingCount();
  $("remaining").textContent = remaining;

  const qty = Math.max(1, Number($("quantity").value || 1));
  $("payBtn").textContent = `Simulate Payment for ${moneyGBP(PRICE_PER_SQUARE * qty)}`;

  $("summaryText").textContent =
    `Click empty squares to choose them. Selected: ${selected.size}/${qty}. (Test mode — no payments processed.)`;

  const grid = $("grid");
  grid.innerHTML = "";

  /* Top-left empty corner */
  grid.appendChild(document.createElement("div"));

  /* Top headers 0–9 */
  for(let col=0; col<10; col++){
    const h = document.createElement("div");
    h.className = "hcell";
    h.textContent = col;
    grid.appendChild(h);
  }

  /* Rows */
  for(let row=0; row<10; row++){
    /* Left header */
    const lh = document.createElement("div");
    lh.className = "hcell";
    lh.textContent = row;
    grid.appendChild(lh);

    /* Squares */
    for(let col=0; col<10; col++){
      const idx = row * 10 + col;
      const taken = !!gridEntries[idx];
      const isSelected = selected.has(idx);

      const cell = document.createElement("div");
      cell.className =
        "cell" +
        (taken ? " taken" : "") +
        (isSelected ? " selected" : "");

      cell.textContent = taken ? gridEntries[idx].username : "";
      cell.onclick = () => toggleSelect(idx);

      grid.appendChild(cell);
    }
  }

  $("payBtn").disabled = remaining <= 0;
}
