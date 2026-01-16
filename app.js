const grid = document.getElementById('grid');

// Configuration for easy editing
const gameConfig = {
    homeTeam: "KANSAS CITY CHIEFS",
    awayTeam: "SAN FRANCISCO 49ERS"
};

function initBoard() {
    grid.innerHTML = '';

    // 1. TOP TEAM NAME (Row 1, Columns 3-12)
    const topTeam = document.createElement('div');
    topTeam.className = 'cell team-name-top';
    topTeam.innerText = gameConfig.homeTeam;
    grid.appendChild(topTeam);

    // 2. BUILD THE GRID (Rows 2-12)
    for (let row = 0; row < 11; row++) {
        
        // SIDE TEAM NAME (Column 1, spans Rows 3-12)
        if (row === 1) {
            const sideTeam = document.createElement('div');
            sideTeam.className = 'cell team-name-left';
            sideTeam.innerText = gameConfig.awayTeam;
            grid.appendChild(sideTeam);
        }

        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                // The empty corner where digits meet
                cell.classList.add('spacer');
            } else if (row === 0) {
                // TOP DIGITS (0-9)
                cell.classList.add('digit-top');
                cell.innerText = col - 1;
            } else if (col === 0) {
                // LEFT DIGITS (0-9)
                cell.classList.add('digit-left');
                cell.innerText = row - 1;
            } else {
                // PLAYABLE SQUARES
                cell.classList.add('open');
                cell.dataset.coord = `${row-1}-${col-1}`;
                cell.addEventListener('click', () => cell.classList.toggle('selected'));
            }
            grid.appendChild(cell);
        }
    }
}

initBoard();
