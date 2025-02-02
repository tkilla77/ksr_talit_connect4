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

/** Drops a piece in the given column and updates the game state accordingly. */
async function dropPiece(grid, status, game, column) {
  // Check if move is valid.
  if (game.state != "playing") {
    return;
  }

  let response = await fetch(`set/0/${column}`);
  game = await response.json();

  // Update the HTML view.
  updateHtml(grid, game);
  // TODO: update game status area to reflect winner / tie
  updateStatus(status, game);
}

/* Connects the game state to the HTML user interface. */
async function init() {
  // Find the HTML game grid.
  let game_id = 0;
  let response = await fetch(`game/${game_id}`);
  let game = await response.json();
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