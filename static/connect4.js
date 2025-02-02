game = {
  "state": "playing",  // or "waiting" or "won" or "tie"
  "board": [
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ],
  "next": 1,  // 1 or 2, the player whose turn it is, the winner if state is "won"
}

/** Updates the HTML user interface to match the given game state. */
function updateHtml(grid, game) {
  let board = grid.getElementsByTagName("button");
  if (board.length != game.board.length) throw new Error("Size mismatch");
  for (let i = 0; i < board.length; i++) {
      let cell = game.board[i];
      let button = board[i];
      button.setAttribute('data-state', cell.toString());
  }
}

function playerName(playerId) {
  if (playerId == 1) {
    return "yellow";
  } else if (playerId == 2) {
    return "red";
  } else {
    return "nobody";
  }
}

function updateStatus(status, game) {
  if (game.state == "playing") {
    status.innerHTML = `Playing, next turn: ${playerName(game.next)}.`;
  } else if (game.state == "tie") {
    status.innerHTML = `It's a <b>tie</b>!`;
  } else {
    status.innerHTML = `<b>${playerName(game.next)}</b> has won!`;
  }
}

function toCellIndex(coords) {
  return coords[1]*7 + coords[0];
}

function toCoords(cell) {
  const row = Math.floor(cell / 7);
  const column = cell % 7;
  return [column, row];
}

/** Returns the row index of the lowest row with an empty cell in the given column. */
function computeEmptyRow(game, column) {
  let row = 5
  while (row >= 0) {
    cell = toCellIndex([column, row]);
    if (game.board[cell] == 0) {
      return row
    }
    row = row - 1
  }
  // column is full
  throw new Error("Illegal move");
}

/** Toggles the next player. */
function togglePlayer(game) {
  if (game.next == 1) {
    game.next = 2;
  } else {
    game.next = 1;
  }
}

function addCoords(one, two) {
  return [one[0] + two[0], one[1] + two[1]];
}

function subCoords(one, two) {
  return [one[0] - two[0], one[1] - two[1]];
}

/** Returns true, if coord is a valid connect4 coordinate. */
function isValid(coord) {
  return 0 <= coord[0] && coord[0] < 7 && 0 <= coord[1] && coord[1] < 6;
}

/** Checks if the game has a winner after the given cell has been filled. */
function checkWinner(game, cell) {
  // There are four directions: horizontal, vertical, and two diagonals.
  // In each direction, count the number of contiguous cells with the
  // same color as the given cell.
  // For this, we treat cell coordinates as (column, row) tuples that can
  // be mathematically modified like vectors.
  const horizontal = [1, 0];
  const vertical = [0, 1];
  const southeast = [1, 1];
  const northeast = [1, -1];
  const directions = [horizontal, vertical, southeast, northeast];

  const color = game.board[cell];
  const start = toCoords(cell);

  for (let direction of directions) {
    let count = 1; // the start cell has the right color.
    // Find same-color cells in the plus direction.
    let coords = addCoords(start, direction);
    while (isValid(coords) && game.board[toCellIndex(coords)] == color) {
      count += 1;
      coords = addCoords(coords, direction);
    }
    // Find same-color cells in the minus direction.
    coords = subCoords(start, direction);
    while (isValid(coords) && game.board[toCellIndex(coords)] == color) {
      count += 1;
      coords = subCoords(coords, direction);
    }
    if (count >= 4) {
      game.state = "won";
      return;
    }
  }

  // No winner - check for tie.
  for (let column of [0, 1, 2, 3, 4, 5, 6]) {
    if (game.board[toCellIndex([column, 0])] == 0) {
      return; // empty cell found - not a tie.
    }
  }

  // No empty cells found - tie.
  game.state = "tie";
}

/** Drops a piece in the given column and updates the game state accordingly. */
function dropPiece(grid, status, game, column) {
  // Check if move is valid.
  if (game.state != "playing") {
    return;
  }
  let row = computeEmptyRow(game, column);
  let cell = row * 7 + column;
  // Update game state.
  game.board[cell] = game.next;
  // Check for winner / tie.
  checkWinner(game, cell);
  if (game.state == "playing") {
    togglePlayer(game);
  }
  // Update the HTML view.
  updateHtml(grid, game);
  // TODO: update game status area to reflect winner / tie
  updateStatus(status, game);
}

/* Connects the game state to the HTML user interface. */
function init() {
  // Find the HTML game grid.
  let grid = document.getElementsByTagName('c4-grid')[0];
  let status = document.getElementsByTagName('c4-status')[0];
  updateHtml(grid, game);
  updateStatus(status, game);

  // Install button click handlers for each button.
  let index = 0
  for (let button of grid.getElementsByTagName("button")) {
    const column = index % 7;
    button.addEventListener("click", () => dropPiece(grid, status, game, column));
    index++;
  }
}

init();