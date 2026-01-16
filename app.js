function render() {
    grid.innerHTML = ''; // Clear previous grid
    
    for (let r = 0; r < 11; r++) {
        for (let c = 0; c < 11; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            if (r === 0 && c === 0) {
                // Top left corner square
                cell.style.backgroundColor = '#333';
            } else if (r === 0) {
                // Apply the BLUE header class to top row
                cell.classList.add('header-top');
                cell.textContent = c - 1;
            } else if (c === 0) {
                // Apply the RED header class to side column
                cell.classList.add('header-side');
                cell.textContent = r - 1;
            } else {
                // Playable squares
                const id = `${r - 1}-${c - 1}`;
                cell.classList.add('open');
                // ... rest of your logic for checking if square is sold ...
            }
            grid.appendChild(cell);
        }
    }
}
