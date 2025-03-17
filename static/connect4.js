let game = undefined;

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
  if (game.state == "playing" && game.myturn) {
    status.innerHTML = `It's your turn, you are ${playerName(game.next)}.`;
  } else if (game.state == "playing") {
    status.innerHTML = `Waiting for ${playerName(game.next)} to play.`;
  } else if (game.state == "waiting") {
    status.innerHTML = `Waiting for other players to join`;
  } else if (game.state == "tie") {
    status.innerHTML = `It's a <b>tie</b>!`;
  } else {
    status.innerHTML = `<b>${playerName(game.next)}</b> has won!`;
  }
}

/** Drops a piece in the given column and updates the game state accordingly. */
async function dropPiece(grid, status, column) {
  // Check if move is valid.
  if (!game.myturn) {
    return;
  }

  handleFetch(grid, status, `set/${game.id}/${column}`);
}

// wait ms milliseconds
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleFetch(grid, status, url) {
  let response = await fetch(url);
  if (response.ok) {
    game = await response.json();
    // Update the HTML view.
    updateHtml(grid, game);
    // Update game status area to reflect winner / tie
    updateStatus(status, game);
  }
  if (!response.ok || game.state == "waiting" || game.state == "playing" && !game.myturn) {
    await wait(500);
    await handleFetch(grid, status, `game/${game.id}`);
  }
}

/* Connects the game state to the HTML user interface. */
async function init() {
  // Find the HTML game grid.
  let grid = document.getElementsByTagName('c4-grid')[0];
  let status = document.getElementsByTagName('c4-status')[0];
  
  
  let join = document.querySelector("#join")
  let gameid = document.querySelector("#gameid")
  gameid.addEventListener("input", () => {
    try {
      text = gameid.value
      if (text.length == 0) {
        join.removeAttribute("disabled")
        join.textContent = "Join Random Game"
        return
      } else {
        id = parseInt(text)
        if (id >= 0) {
          join.textContent = "Join Game"
          join.removeAttribute("disabled")
          return
        }
      }
    } catch {}
    join.textContent = "Game Id must be a number!"
    join.setAttribute("disabled", "1")
  });
  
  join.addEventListener("click", () => {
    let id = parseInt(gameid.value)
    if (id >= 0)
      handleFetch(grid, status, `join/${id}`)
    else
      handleFetch(grid, status, `join`)
  });


  // Install button click handlers for each button.
  let index = 0
  for (let button of grid.getElementsByTagName("button")) {
    const column = index % 7;
    button.addEventListener("click", () => dropPiece(grid, status, column));
    index++;
  }
}

init();