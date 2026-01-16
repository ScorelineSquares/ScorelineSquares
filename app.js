const grid = document.getElementById('grid');
let allSquares = [];

function initBoard() {
    grid.innerHTML = '';
    allSquares = [];

    // 1. Top Home Team Header
    const hLabel = document.createElement('div');
    hLabel.className = 'team-header home-label';
    hLabel.innerText = "HOME TEAM";
    grid.appendChild(hLabel);

    for (let row = 0; row < 11; row++) {
        // 2. Side Away Team Header
        if (row === 1) {
            const aLabel = document.createElement('div');
            aLabel.className = 'team-header away-label';
            aLabel.innerText = "AWAY TEAM";
            grid.appendChild(aLabel);
        }

        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.classList.add('spacer');
            } else if (row === 0) {
                // Home Numbers (Top)
                cell.classList.add('num-home');
                cell.innerText = col - 1;
            } else if (col === 0) {
                // Away Numbers (Left)
                cell.classList.add('num-away');
                cell.innerText = row - 1;
            } else {
                // Playable Grid
                cell.classList.add('square', 'available');
                allSquares.push(cell);
            }
            grid.appendChild(cell);
        }
    }
}

function buyRandomSquares() {
    const qty = parseInt(document.getElementById('quantity').value);
    const available = allSquares.filter(s => s.classList.contains('available'));

    if (!qty || qty < 1 || qty > available.length) return alert("Invalid Quantity");

    for (let i = 0; i < qty; i++) {
        const idx = Math.floor(Math.random() * available.length);
        const selected = available.splice(idx, 1)[0];
        selected.classList.replace('available', 'assigned');
        selected.innerText = "✓";
    }
}

initBoard();
