import express from 'express'
import cookieParser from 'cookie-parser'
import { WebSocketExpress, Router } from 'websocket-express';
import { newGame, dropPiece, toJson, isWaiting, joinGame, getCurrentPlayer } from './connect4.js'

const app = new WebSocketExpress();
app.use(cookieParser())
const port = 0 // 0 means using a random free port

let nextGameId = 0;
let games = {};
 
/** Extract the user id from the cookie, or set a fresh cookie if it does not exist. */
function getUserId(req, res) {
    let userid = req.cookies.userid
    if (userid == undefined) {
        userid = crypto.randomUUID()
        res.cookie('userid', userid)
    }
    return userid
}
// Serve the main entry from '/:gameid/'
app.get('/:gameid(\\d+)/', (req, res) => {
    res.sendFile('/static/connect4.html', {root: import.meta.dirname})
})
// Serve all files from static/ folder as is, for all game ids.
// For example, a request for '/42/connect4.css' will be served from
// 'static/connect4.css'
app.use('/:gameid(\\d+)/', express.static('static'))

// TODO: separate game creation / joining / getting.

/** Join a new or waiting game. */
app.get('', (req, res) => {
    const userid = getUserId(req, res)
    // First attempt to find a waiting game and join that.
    for (let game of Object.values(games)) {
        if (isWaiting(game, userid)) {
            joinGame(game, userid)
            console.log(`Game ${game.id} randomly joined by ${userid}`)
            res.redirect(`${game.id}/`)
            return
        }
    }
    // No waiting game found - create a new one
    let game = newGame(nextGameId)
    games[nextGameId] = game
    nextGameId += 1
    
    joinGame(game, userid)
    console.log(`Game ${game.id} started by ${userid}`)
    res.redirect(`${game.id}/`)
})

/** Serve the game state of any valid game id. */
app.get('/:gameid/game', (req, res) => {
    const userid = getUserId(req, res);
    const game = games[parseInt(req.params['gameid'])]
    if (game == undefined) {
        res.status(404).json("no such game");
    } else {
        if (isWaiting(game, userid)) {
            console.log(`Game ${game.id} directly joined by ${userid}`)
            joinGame(game, userid)
        }
        res.json(toJson(game, userid))
    }
})

/** Make a play. Only allows the joined players to  */
app.get('/:gameid/set/:column', (req, res) => {
    const userid = getUserId(req, res);
    const game = games[parseInt(req.params['gameid'])]
    if (game == undefined) {
        res.status(404).json("no such game");
    } else if (game.state != "playing") {
        res.status(403).json("game is not playing");
    } else if (getCurrentPlayer(game) == userid) {
        let column = parseInt(req.params['column']);
        dropPiece(game, column);
        res.json(toJson(game, userid));
    } else {
        res.status(403);
        res.json("Not your turn, my friend");
    }
})

app.ws('/echo', async (req, res) => {
    const ws = await res.accept();
    ws.on('message', (msg) => {
      ws.send(`echo ${msg}`);
    });
    ws.send('hello');
})

// Listen on the given port
const server = app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${server.address().port}/`)
})
