import express from 'express'
import cookieParser from 'cookie-parser'
import { newGame, dropPiece, toJson, isWaiting, joinGame, getCurrentPlayer, shouldBlockRequest } from './connect4.js'

const app = express();
app.use(cookieParser())
const port = 0 // 0 means using a random free port

let nextGameId = 0;
/** All games by gameid. */
let games = {};
/** All long-poll requests by gameid. For each gameid, a list of 
  * [response, userid] entries is stored.  */
let longpolls = {};
 
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
            console.log(`Game ${game.id} randomly joined by ${userid}`)
            join(game, userid)
            res.redirect(`${game.id}/`)
            return
        }
    }
    // No waiting game found - create a new one
    let game = newGame(nextGameId)
    games[nextGameId] = game
    nextGameId += 1
    
    join(game, userid)
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
            join(game, userid)
        }
        res.json(toJson(game, userid))
    }
})

/** Lets the given userid join the game, and sends any pending
  * long-polling responses. */
function join(game, userid) {
    joinGame(game, userid)
    sendLongPollResponses(game)
}

/** Sends any pending long-polling responses after a state change. */
function sendLongPollResponses(game) {
    let polls = longpolls[game.id]
    delete longpolls[game.id]
    if (polls) {
        for (let response of polls) {
            // a response object is a list with the actual HTTP response and the userid.
            let res = response[0]
            let userid = response[1]
            console.log(`End long-poll request for ${game.id} by ${userid}`)
            res.json(toJson(game, userid))
            res.end()
        }
    }
}

/** Serve the game state of any valid game id, but block until
 * the client is no longer blocked (long-polling). */
app.get('/:gameid/longpoll', (req, res) => {
    const userid = getUserId(req, res);
    const game = games[parseInt(req.params['gameid'])]
    if (game == undefined) {
        res.status(404).json("no such game");
    } else {
        if (isWaiting(game, userid)) {
            console.log(`Game ${game.id} directly joined by ${userid}`)
            join(game, userid)
            res.json(toJson(game, userid))
            res.end()
            return
        }
        // Check if userid needs to wait, then either:
        // - stash the [response, userid] pair for later
        // - instantly return actionable state
        if (shouldBlockRequest(game, userid)) {
            console.log(`Stash long-poll request for ${game.id} by ${userid}`)
            longpolls[game.id] ??= []
            longpolls[game.id].push([res, userid])
            // do not end here but keep request hanging.
        } else {
            // User can act on the state, no point in waiting.
            res.json(toJson(game, userid))
            res.end()
        }
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
        sendLongPollResponses(game);
    } else {
        res.status(403);
        res.json("Not your turn, my friend");
    }
})

// Listen on the given port
const server = app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${server.address().port}/`)
})
