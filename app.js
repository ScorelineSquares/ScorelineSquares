const grid = document.getElementById('grid');
let allSquares = [];

function initBoard() {
    grid.innerHTML = '';
    allSquares = [];

    // Loop through 11 rows (1 for top digits, 10 for squares)
    for (let row = 0; row < 11; row++) {
        // Loop through 11 columns (1 for left digits, 10 for squares)
        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.classList.add('spacer'); // Top-left corner empty
            } else if (row === 0) {
                cell.classList.add('num-home');
                cell.innerText = col - 1; // Top Digits 0-9
            } else if (col === 0) {
                cell.classList.add('num-away');
                cell.innerText = row - 1; // Left Digits 0-9
            } else {
                cell.classList.add('square', 'available');
                allSquares.push(cell); // Playable 10x10 area
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
