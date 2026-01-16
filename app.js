const grid = document.getElementById('grid');
let allSquares = [];

function initBoard() {
    grid.innerHTML = '';
    allSquares = [];

    // 1. Create Home Team Label (Top Row)
    const hLabel = document.createElement('div');
    hLabel.className = 'cell team-header home-label';
    hLabel.innerText = "HOME TEAM";
    grid.appendChild(hLabel);

    // 2. Build the 11x11 part (Numbers + Squares)
    for (let row = 0; row < 11; row++) {
        // Create Away Team Label (Left Column)
        if (row === 1) {
            const aLabel = document.createElement('div');
            aLabel.className = 'cell team-header away-label';
            aLabel.innerText = "AWAY TEAM";
            grid.appendChild(aLabel);
        }

        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.classList.add('spacer');
            } else if (row === 0) {
                cell.classList.add('num-label', 'num-home');
                cell.innerText = col - 1;
            } else if (col === 0) {
                cell.classList.add('num-label', 'num-away');
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
    const qty = parseInt(document.getElementById('quantity').value);
    const available = allSquares.filter(s => s.classList.contains('available'));
    if (!qty || qty < 1 || qty > available.length) return;

    for (let i = 0; i < qty; i++) {
        const idx = Math.floor(Math.random() * available.length);
        const selected = available.splice(idx, 1)[0];
        selected.classList.replace('available', 'assigned');
        selected.innerText = "✓";
    }
}

initBoard();
