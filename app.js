const grid = document.getElementById('grid');

// Editable Team Names for your different competition pages
const teamTopName = "HOME TEAM TBC"; 
const teamLeftName = "AWAY TEAM TBC";

function initBoard() {
    grid.innerHTML = '';

    // 1. Create Top Team Row
    const topTeam = document.createElement('div');
    topTeam.className = 'cell team-header-top';
    topTeam.innerText = teamTopName;
    grid.appendChild(topTeam);

    // 2. Create the Grid
    for (let row = 0; row < 11; row++) {
        
        // Inject the Side Team Label on the first row of digits
        if (row === 1) {
            const leftTeam = document.createElement('div');
            leftTeam.className = 'cell team-header-left';
            leftTeam.innerText = teamLeftName;
            grid.appendChild(leftTeam);
        }

        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.style.background = "#333"; // Corner spacer
            } else if (row === 0) {
                cell.classList.add('header-top-digit');
                cell.innerText = col - 1;
            } else if (col === 0) {
                cell.classList.add('header-side-digit');
                cell.innerText = row - 1;
            } else {
                cell.classList.add('open');
                cell.addEventListener('click', () => cell.classList.toggle('selected'));
            }
            grid.appendChild(cell);
        }
    }
}

initBoard();
