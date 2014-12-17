/* Copyright (c) 2014 Andrew Foote
 *
 * Please don't cheat
 * If you really want to, comment out the highscore code
 *  so you don't mess up the global high score
 */
var canvas = document.getElementById('floodit_canvas');
var ctx = canvas.getContext('2d');
canvas.width = Math.min(window.innerWidth*0.7, window.innerHeight*0.7);
canvas.height = Math.min(window.innerWidth*0.7, window.innerHeight*0.7);

var Game = {
    board: [],
    dimension: 8,
    width: canvas.width,
    cellSize: 40,
    target: 0,
    MAX_TURNS: 25,
    score: 0,
    highscore: null,
    turn: 0
}

Game.initBoard = function() {
    Game.board = [];
    Game.cellSize = Game.width/Game.dimension;
    var dimension = Game.dimension;
    
    for (var row = 0; row<dimension; row++) {
        Game.board.push([]);
        for (var col = 0; col<dimension; col++) {
            Game.board[row][col] = Math.floor(Math.random()*5); 
        }
    }
    this.target = this.board[0][0];
}

Game.draw = function() {
    var dimension = this.dimension;
    var cellSize = this.cellSize;
    for (var row = 0; row<dimension; row++) {
        for (var col = 0; col<dimension; col++) {
            ctx.fillStyle = getColor(Game.board[row][col]);
            var x = Math.floor(col*cellSize);
            var y = Math.floor(row*cellSize);
            //excessively complicated to prevent floating point from breaking tiling
            ctx.fillRect(x, y, cellSize + (col*cellSize - x), cellSize + (row*cellSize - y));
        }
    }
}

Game.floodfill = function(replace, r, c) {
    if (this.target == replace) return;
    if (this.board[r][c] != this.target) return;
    this.board[r][c] = replace;
    if (r > 0) {
        this.floodfill(replace, r-1, c);
    }
    if (c > 0) {
        this.floodfill(replace, r, c-1);
    }
    if (r < this.board.length-1) {
        this.floodfill(replace, r+1, c);
    }
    if (c < this.board[0].length-1) {
        this.floodfill(replace, r, c+1);
    }
}

Game.checkWin = function() {
    for (var row = 0; row<this.dimension; row++) {
        for (var col = 0; col<this.dimension; col++) {
            if (this.board[row][col] != this.target) {
                return false;
            }
        }
    }
    return true;
}
Game.advance = function() {
    this.dimension++;
    this.score++;
    this.turn = 0;
    this.initBoard();
    this.draw();
}

Game.updateHighScore = function() {
    var xhr = new XMLHttpRequest();

    //should be post
    xhr.open('GET', '/highscore/'+this.score);
    xhr.send();
    xhr = new XMLHttpRequest();
    xhr.open('GET', '/highscore');
    var that = this;
    xhr.onload = function() {
        that.highscore = parseInt(this.responseText);
        var high = document.getElementById('highscore');
        if (that.highscore >= 0) {
            high.innerHTML = "Global High Score: " + that.highscore;
        }
    }
    xhr.send();
}
Game.updateStatus = function() {
    var turnCount = document.getElementById('turn');
    var score = document.getElementById('score');
    var high = document.getElementById('highscore');
    
    if (this.failed) {
        turnCount.innerHTML = "You failed. Refresh to try again";
        score.innerHTML = "";
        high.innerHTML = "";
        return;
    }

    this.updateHighScore();
    turnCount.innerHTML = "Move: " + this.turn + "/" + this.MAX_TURNS;
    score.innerHTML = "Score: " + this.score;
}
Game.move = function(x, y) {
    if (this.failed) return;

    var r = y/this.cellSize | 0;
    var c = x/this.cellSize | 0;
    this.floodfill(this.board[r][c], 0, 0);
    this.target = this.board[0][0];
    this.turn++;

    if (this.turn > this.MAX_TURNS) {
        this.failed = true;
    }
    if (this.checkWin()) {
        this.advance();
    }
    this.updateStatus();
    Game.draw();
}

canvas.addEventListener('click', function(e) {
    var mousePosition = toCanvasCoordinates(canvas, e);
    Game.move(mousePosition.x, mousePosition.y);
});
Game.initBoard();
Game.updateStatus();
Game.draw();
