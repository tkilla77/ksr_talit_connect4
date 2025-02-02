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

  updateHtml(document.getElementsByTagName('c4-grid')[0], game)