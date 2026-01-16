const grid = document.getElementById('grid');
const homeName = "HOME TEAM";
const awayName = "AWAY TEAM";

let allSquares = [];

function initBoard() {
    grid.innerHTML = '';
    allSquares = [];

    // 1. Create HOME TEAM header row
    const homeHeader = document.createElement('div');
    homeHeader.className = 'cell home-team-label';
    homeHeader.innerText = homeName;
    grid.appendChild(homeHeader);

    // 2. Build the rest of the grid
    for (let row = 0; row < 11; row++) {
        
        // Inject AWAY TEAM header (vertical)
        if (row === 1) {
            const awayHeader = document.createElement('div');
            awayHeader.className = 'cell away-team-label';
            awayHeader.innerText = awayName;
            grid.appendChild(awayHeader);
        }

        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.classList.add('spacer'); // Corner above Away digits
            } else if (row === 0) {
                cell.classList.add('digit-top');
                cell.innerText = col - 1;
            } else if (col === 0) {
                cell.classList.add('digit-left');
                cell.innerText = row - 1;
            } else {
                cell.classList.add('square', 'available');
                cell.id = `sq-${row-1}-${col-1}`;
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

    if (isNaN(quantity) || quantity < 1) {
        alert("Please enter a valid quantity.");
        return;
    }

    if (quantity > available.length) {
        alert(`Only ${available.length} squares left!`);
        return;
    }

    // Shuffle and assign randomly
    for (let i = 0; i < quantity; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        const selected = available.splice(randomIndex, 1)[0];
        selected.classList.remove('available');
        selected.classList.add('assigned');
        selected.innerText = "✓"; // Mark as bought
    }
}

initBoard();
