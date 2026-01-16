const grid = document.getElementById('grid');
let allSquares = [];

function initBoard() {
    grid.innerHTML = '';
    allSquares = [];

    // Place HOME TEAM at the top
    const hLabel = document.createElement('div');
    hLabel.className = 'cell team-label home-label';
    hLabel.innerText = "HOME TEAM";
    grid.appendChild(hLabel);

    for (let row = 0; row < 11; row++) {
        // Place AWAY TEAM on the side
        if (row === 1) {
            const aLabel = document.createElement('div');
            aLabel.className = 'cell team-label away-label';
            aLabel.innerText = "AWAY TEAM";
            grid.appendChild(aLabel);
        }

        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.classList.add('spacer');
            } else if (row === 0) {
                cell.classList.add('num-home');
                cell.innerText = col - 1;
            } else if (col === 0) {
                cell.classList.add('num-away');
                cell.innerText = row - 1;
            } else {
                cell.classList.add('square', 'available');
                allSquares.push(cell);
            }
            grid.appendChild(cell);
        }
    }
}

function buyRandomSquares() {
    const qtyInput = document.getElementById('quantity');
    const qty = parseInt(qtyInput.value);
    const available = allSquares.filter(s => s.classList.contains('available'));

    if (!qty || qty < 1) return alert("Please enter a valid number.");
    if (qty > available.length) return alert("Only " + available.length + " squares left!");

    for (let i = 0; i < qty; i++) {
        const idx = Math.floor(Math.random() * available.length);
        const selected = available.splice(idx, 1)[0];
        selected.classList.replace('available', 'assigned');
        selected.innerText = "✓";
    }
}

initBoard();
