const grid = document.getElementById('grid');
let allSquares = [];

function initBoard() {
    grid.innerHTML = '';
    allSquares = [];

    // 1. HOME TEAM header row (Top)
    const homeHeader = document.createElement('div');
    homeHeader.className = 'cell home-team-label';
    homeHeader.innerText = "HOME TEAM";
    grid.appendChild(homeHeader);

    for (let row = 0; row < 11; row++) {
        // 2. AWAY TEAM header (Left Side)
        if (row === 1) {
            const awayHeader = document.createElement('div');
            awayHeader.className = 'cell away-team-label';
            awayHeader.innerText = "AWAY TEAM";
            grid.appendChild(awayHeader);
        }

        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.classList.add('spacer');
            } else if (row === 0) {
                // Number Header (Top)
                cell.classList.add('digit-top');
                cell.innerText = col - 1;
            } else if (col === 0) {
                // Number Header (Left)
                cell.classList.add('digit-left');
                cell.innerText = row - 1;
            } else {
                // The Playable Squares
                cell.classList.add('square', 'available');
                allSquares.push(cell);
            }
            grid.appendChild(cell);
        }
    }
}

function buyRandomSquares() {
    const qtyInput = document.getElementById('quantity');
    const quantity = parseInt(qtyInput.value);
    const available = allSquares.filter(s => s.classList.contains('available'));

    if (isNaN(quantity) || quantity < 1) return alert("Enter a valid amount.");
    if (quantity > available.length) return alert("Not enough squares left!");

    // Shuffle and pick squares
    for (let i = 0; i < quantity; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        const selected = available.splice(randomIndex, 1)[0];
        selected.classList.replace('available', 'assigned');
        selected.innerText = "✓";
    }
}

initBoard();
