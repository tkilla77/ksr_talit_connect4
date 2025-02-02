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

function updateHtml(grid, game) {
  let board = grid.getElementsByTagName("button");
  if (board.length != game.board.length) throw new Error("Size mismatch");
  for (let i = 0; i < board.length; i++) {
      let cell = game.board[i];
      let button = board[i];
      button.setAttribute('data-state', cell.toString());
  }
}

/* Returns the row index of the lowest row with an empty cell in the given column. */
function computeEmptyRow(game, column) {
  let row = 5
  while (row >= 0) {
    cell = row*7 + column;
    if (game.board[cell] == 0) {
      return row
    }
    row = row - 1
  }
  // column is full
  throw new Error("Illegal move");
}

function togglePlayer(game) {
  if (game.next == 1) {
    game.next = 2;
  } else {
    game.next = 1;
  }
}

function checkWinner(game) {
  // TODO implement
}

function dropPiece(grid, game, column) {
  // Check if move is valid.
  let row = computeEmptyRow(game, column);
  let cell = row * 7 + column;
  // Update game state.
  game.board[cell] = game.next;
  // Check for winner / tie.
  checkWinner(game);
  togglePlayer(game);
  // Update the HTML view.
  updateHtml(grid, game);
}

function init() {
  grid = document.getElementsByTagName('c4-grid')[0];
  updateHtml(grid, game);

  let index = 0
  for (button of grid.getElementsByTagName("button")) {
    const column = index % 7;
    button.addEventListener("click", () => dropPiece(grid, game, column));
    index++;
  }
}

init();