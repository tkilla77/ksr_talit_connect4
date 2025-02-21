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

/** A Connect4 board */
class C4Board {
  static defaultBoard() {
    return C4Board.emptyBoard();
  }
  static emptyBoard(columns=7, rows=6, winning=4) {
    let game = {
      "state": "playing",
      "board": Array(columns*rows).fill(0),
      "next": 1,
    }

    return C4Board.fromJson(game, columns, rows, winning);
  }
  static fromJson(game, columns=7, rows=6, winning=4) {
    return new C4Board(game, columns, rows, winning);
  }
  constructor(game, columns=7, rows=6, winning=4) {
    columns = Math.trunc(columns)
    rows = Math.trunc(rows)
    winning = Math.trunc(winning)
    if (columns <= 0) throw `Columns must be >0, was ${columns}`
    if (rows <= 0) throw `Rows must be >0, was ${rows}`
    if (winning <= 1) throw `Winning must be >1, was ${winning}`
    this.columns = columns
    this.rows = rows
    this.winning = winning

    // Create deep clone of game to ensure it can't be modified.
    this.game = JSON.parse(JSON.stringify(game))
    if (this.game.board.length != this.rows * this.columns) {
      throw `Board size mismatch, expected ${this.rows * this.columns} cells!`
    }
  }

  /** Returns true exactly if point represents a valid cell on this board. */
  isValid(point) {
    return point.isWithin(Point.at(0, 0), Point.at(this.columns, this.rows))
  }

  /**
   * Returns the board contents (color) at the given coordinates. 
   * @throws Exception if the given point is not {@link C4Board#isValid valid}
   */
  at(point) {
    return this.game.board[this.#toCellIndex(point)]
  }
  
  #toCellIndex(point) {
    if (!this.isValid(point)) throw `Invalid cell coordinates: ${point}`
    return point.row * this.columns + point.column;
  }

  /** Checks if the game has a winner after the given cell has been filled. */
  #checkWinner(cell) {
    // There are four directions: horizontal, vertical, and two diagonals.
    // In each direction, count the number of contiguous cells with the
    // same color as the given cell.
    // For this, we treat cell coordinates as (column, row) tuples that can
    // be mathematically modified like vectors.
    const horizontal = Point.at(1, 0);
    const vertical = Point.at(0, 1);
    const southeast = Point.at(1, 1);
    const northeast = Point.at(1, -1);
    const directions = [horizontal, vertical, southeast, northeast];

    const color = this.at(cell);

    for (let direction of directions) {
      let count = 1; // the start cell has the right color.
      // Find same-color cells in the plus direction.
      let coords = cell.plus(direction);
      while (this.isValid(coords) && this.at(coords) == color) {
        count += 1;
        coords = coords.plus(direction);
      }
      // Find same-color cells in the minus direction.
      coords = cell.minus(direction);
      while (this.isValid(coords) && this.at(coords) == color) {
        count += 1;
        coords = coords.minus(direction);
      }
      if (count >= this.winning) {
        this.game.state = "won";
        return;
      }
    }

    // No winner - check for tie.
    for (let column = 0; column < this.columns; column++) {
      if (this.at(Point.at(column, 0)) == 0) {
        return; // empty cell found - not a tie.
      }
    }

    // No empty cells found - tie.
    this.game.state = "tie";
  }

  /** Returns the row index of the lowest row with an empty cell in the given column. */
  #computeEmptyCell(column) {
    let row = this.rows - 1
    while (row >= 0) {
      let point = Point.at(column, row)
      if (this.at(point) == 0) {
        return point
      }
      row = row - 1
    }
    // column is full
    throw new Error("Illegal move");
  }
  
  /** Toggles the next player. */
  #togglePlayer() {
    if (this.game.next == 1) {
      this.game.next = 2;
    } else {
      this.game.next = 1;
    }
  }

  /** Makes a game play by adding the current player's color in the given column. */
  play(column) {
    // Check if move is valid.
    if (this.game.state != "playing") {
      return;
    }
    let cell = this.#computeEmptyCell(column);
    // Update game state.
    this.game.board[this.#toCellIndex(cell)] = this.game.next;
    // Check for winner / tie.
    this.#checkWinner(cell);
    if (this.game.state == "playing") {
      this.#togglePlayer();
    }
  }
}

/**
 * A 2D point identifying a cell on a two-dimensional game board. 
 * Points are immutable.
 */
class Point {
  /** Creates a new point at column / row. */
  static at(column, row) {
    return new Point(column, row);
  }

  constructor(column, row) {
    this.column = column
    this.row = row
    Object.freeze(this)
  }

  /** Returns a new point which is the sum of this and point. */
  plus(point) {
    return Point.at(this.column + point.column, this.row + point.row)
  }
  
  /** Returns a new point which is the difference of this and point. */
  minus(point) {
    return Point.at(this.column - point.column, this.row - point.row)
  }
  
  /** Returns true exactly iff this point is within the rectangle opened
   * by lower (inclusive) and upper (exclusive). */
  isWithin(lower, upper) {
    return lower.column <= this.column && this.column < upper.column
        && lower.row <= this.row && this.row < upper.row;
  }
}


/** Drops a piece in the given column and updates the game state accordingly. */
function dropPiece(grid, status, game, column) {
  // Make the play.
  game.play(column);
  // Update the HTML view.
  updateHtml(grid, game.game);
  // Update game status area to reflect winner / tie
  updateStatus(status, game.game);
}

/** Create HTML buttons for game grid, and adapt the CSS repeat. */
function createHtmlGrid(game, grid) {
  grid.style['grid-template-columns'] = `repeat(${game.columns}, 1fr)`
  for (let cell = 0; cell < game.rows * game.columns; cell++) {
    let button = document.createElement('button')
    grid.appendChild(button)
  }
}

/* Connects the game state to the HTML user interface. */
function init() {
  let game = C4Board.emptyBoard(10, 4, 4);
  // Find the HTML game grid.
  let grid = document.getElementsByTagName('c4-grid')[0];
  createHtmlGrid(game, grid);
  let status = document.getElementsByTagName('c4-status')[0];
  updateHtml(grid, game.game);
  updateStatus(status, game.game);

  // Install button click handlers for each button.
  let index = 0
  for (let button of grid.getElementsByTagName("button")) {
    const column = index % game.columns;
    button.addEventListener("click", () => dropPiece(grid, status, game, column));
    index++;
  }
}

init();