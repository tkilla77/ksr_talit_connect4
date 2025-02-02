import express from 'express'
import { newGame, dropPiece } from './connect4.js'

const app = express()
const port = 3001

let the_game = newGame();
 
// Serve all files from static/ as is.
// For example, a request for '/connect4.html' will be served from
// 'static/connect4.html'
app.use(express.static('static'))

app.get('/game/:gameid', (req, res) => {
    // For now, we only have a single game, so ignore the gameid.
    return res.json(the_game);
})
 
app.get('/set/:gameid/:column', (req, res) => {
    // For now, we only have a single game, so ignore the gameid.
    let column = parseInt(req.params['column']);
    dropPiece(the_game, column);
    res.json(the_game)
})

// Listen on the given port
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
