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
    lastTarget: 0,
    MAX_TURNS: 25,
    score1: 0,
    score2: 0,
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
    this.board[0][0] = 5;
    this.board[this.dimension-1][this.dimension-1] = 6;
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
    var c1 = this.board[0][0];
    var c2 = this.board[this.dimension-1][this.dimension-1];
    for (var row = 0; row<this.dimension; row++) {
        for (var col = 0; col<this.dimension; col++) {
            if (this.board[row][col] != c1 && this.board[row][col] != c2) {
                return false;
            }
        }
    }
    return true;
}

Game.evaluate = function() {
    var c1 = this.board[0][0];
    var c2 = this.board[this.dimension-1][this.dimension-1];
    var count1 = 0;
    var count2 = 0;
    for (var row = 0; row<this.dimension; row++) {
        for (var col = 0; col<this.dimension; col++) {
            if (this.board[row][col] == c1) {
                count1++;
            } else if (this.board[row][col] == c2) {
                count2++;
            }
        }
    }
    if (count1 > count2) {
        return 0;
    } else {
        return 1;
    }
}
Game.advance = function(win) {
    this.dimension++;
    this.turn = 0;
    if (win == 0) {
        this.score1++;
    } else {
        this.score2++;
    }
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
    
    turnCount.innerHTML = "Player " + (this.turn%2+1) + "'s turn";
    score.innerHTML = "Player 1: " + this.score1 + ",     Player 2: " + this.score2;
}
Game.move = function(x, y) {
    if (this.failed) return;

    var r = y/this.cellSize | 0;
    var c = x/this.cellSize | 0;

    if (this.board[r][c] == this.board[0][0] || this.board[r][c] == this.board[this.dimension-1][this.dimension-1]) {
        return;
    }
    if (this.turn % 2 == 0) {
        this.floodfill(this.board[r][c], 0, 0);
        this.target = this.board[0][0];
        this.floodfill(5, 0, 0);
        this.lastTarget = this.target;
        this.target = this.board[this.dimension-1][this.dimension-1];
    } else {
        this.floodfill(this.board[r][c], this.dimension-1, this.dimension-1);
        this.target = this.board[this.dimension-1][this.dimension-1];
        this.floodfill(6, this.dimension-1, this.dimension-1);
        this.lastTarget = this.target;
        this.target = this.board[0][0];
    }
    this.turn++;

    if (this.checkWin()) {
        this.advance(this.evaluate());
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
