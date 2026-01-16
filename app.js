const grid = document.getElementById('grid');
let allSquares = [];

function initBoard() {
    grid.innerHTML = '';
    allSquares = [];

    for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.classList.add('spacer');
            } else if (row === 0) {
                // Top Number Row (0-9)
                cell.classList.add('digit-top');
                cell.innerText = col - 1;
            } else if (col === 0) {
                // Left Number Column (0-9)
                cell.classList.add('digit-left');
                cell.innerText = row - 1;
            } else {
                // The 100 Playable Squares
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

    if (isNaN(quantity) || quantity < 1) return alert("Enter a valid quantity.");
    if (quantity > available.length) return alert("Not enough squares left.");

    for (let i = 0; i < quantity; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        const selected = available.splice(randomIndex, 1)[0];
        selected.classList.replace('available', 'assigned');
        selected.innerText = "✓";
    }
}

initBoard();
