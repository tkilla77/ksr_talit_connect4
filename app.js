import express from 'express'
import cookieParser from 'cookie-parser'
import { newGame, dropPiece, toJson, isWaiting, joinGame } from './connect4.js'

const app = express()
app.use(cookieParser())
const port = 0

let nextGameId = 0;
let games = {};
 
// Serve all files from static/ as is.
// For example, a request for '/connect4.html' will be served from
// 'static/connect4.html'
app.use(express.static('static'))

function getUserId(req, res) {
    let userid = req.cookies.userid
    if (userid == undefined) {
        userid = crypto.randomUUID()
        res.cookie('userid', userid)
    }
    return userid
}
 
app.get('/join', (req, res) => {
    const userid = getUserId(req, res)
    for (let game of Object.values(games)) {
        if (isWaiting(game, userid)) {
            joinGame(game, userid)
            res.json(toJson(game, userid))
            return
        }
    }
    // No waiting game found - create a new one
    let game = newGame(nextGameId)
    games[nextGameId] = game
    nextGameId += 1
    
    joinGame(game, userid)
    res.json(toJson(game, userid))
})

app.get('/game/:gameid', (req, res) => {
    const userid = getUserId(req, res);
    const game = games[parseInt(req.params['gameid'])]
    if (game == undefined) {
        res.status(401).json("no such game");
    } else {
        res.json(toJson(game, userid))
    }
})

app.get('/set/:gameid/:column', (req, res) => {
    const userid = getUserId(req, res);
    const game = games[parseInt(req.params['gameid'])]
    if (game == undefined) {
        res.status(401).json("no such game");
    }else if (game.player1 == userid && game.next == 1 || game.player2 == userid && game.next == 2) {
        let column = parseInt(req.params['column']);
        dropPiece(game, column);
        res.json(toJson(game, userid));
    } else {
        res.status(403);
        res.json("Not your turn, my friend");
    }
})

// Listen on the given port
const server = app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${server.address().port}/connect4.html`)
})
