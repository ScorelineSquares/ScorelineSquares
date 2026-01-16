// CONFIGURATION
const TOTAL_SQUARES = 100;
const grid = document.getElementById('grid');
const remainingDisplay = document.getElementById('remaining-count');

// Initialize State
let squaresSold = 0; 
let selectedSquares = [];

function initBoard() {
    grid.innerHTML = ''; // Full Clear

    for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.classList.add('corner');
            } 
            else if (row === 0) {
                // Top Axis (Blue)
                cell.classList.add('header-top');
                cell.innerText = col - 1;
            } 
            else if (col === 0) {
                // Side Axis (Red)
                cell.classList.add('header-side');
                cell.innerText = row - 1;
            } 
            else {
                // Playable Square
                cell.classList.add('open');
                cell.dataset.id = `${row-1}-${col-1}`;
                cell.addEventListener('click', () => toggleSquare(cell));
            }
            grid.appendChild(cell);
        }
    }
}

function toggleSquare(cell) {
    if (cell.classList.contains('sold')) return;

    cell.classList.toggle('selected');
    const id = cell.dataset.id;

    if (cell.classList.contains('selected')) {
        selectedSquares.push(id);
    } else {
        selectedSquares = selectedSquares.filter(s => s !== id);
    }
    
    console.log("Selected:", selectedSquares);
}

// Run on load
initBoard();
