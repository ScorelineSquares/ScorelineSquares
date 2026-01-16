const grid = document.getElementById('grid');

// CONFIGURATION - Change these for different sports/games
const config = {
    homeTeam: "HOME TEAM TBC",
    awayTeam: "AWAY TEAM TBC",
    cost: 10,
    payouts: { q1: 250, q2: 250, q3: 250, final: 500 }
};

function initBoard() {
    grid.innerHTML = '';

    // 1. Top Team Label (Spans across the 10 squares)
    const topLabel = document.createElement('div');
    topLabel.className = 'cell team-header-top';
    topLabel.innerText = config.homeTeam;
    grid.appendChild(topLabel);

    // 2. Main Grid Construction (11x11 inside the 12-column layout)
    for (let row = 0; row < 11; row++) {
        
        // Inject Left Team Label once at the start of the square rows
        if (row === 1) {
            const leftLabel = document.createElement('div');
            leftLabel.className = 'cell team-header-left';
            leftLabel.innerText = config.awayTeam;
            grid.appendChild(leftLabel);
        }

        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (row === 0 && col === 0) {
                cell.style.backgroundColor = "#333"; // Corner spacer
            } else if (row === 0) {
                // Top Digits
                cell.classList.add('header-top-digit');
                cell.innerText = col - 1;
            } else if (col === 0) {
                // Side Digits
                cell.classList.add('header-side-digit');
                cell.innerText = row - 1;
            } else {
                // Playable Squares
                cell.classList.add('open');
                cell.addEventListener('click', () => cell.classList.toggle('selected'));
            }
            grid.appendChild(cell);
        }
    }
}

initBoard();
