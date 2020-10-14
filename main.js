"use strict";



let MSGame = (function(){

    // private constants
    const STATE_HIDDEN = "hidden";
    const STATE_SHOWN = "shown";
    const STATE_MARKED = "marked";

    function array2d( nrows, ncols, val) {
        const res = [];
        for( let row = 0 ; row < nrows ; row ++) {
            res[row] = [];
            for( let col = 0 ; col < ncols ; col ++)
                res[row][col] = val(row,col);
        }
        return res;
    }

    // returns random integer in range [min, max]
    function rndInt(min, max) {
        [min,max] = [Math.ceil(min), Math.floor(max)]
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    class _MSGame {
        constructor() {
            this.init(10, 10, 15); // easy by default
        }

        validCoord(row, col) {
            return row >= 0 && row < this.nrows && col >= 0 && col < this.ncols;
        }

        init(nrows, ncols, nmines) {
            this.nrows = nrows;
            this.ncols = ncols;
            this.nmines = nmines;
            this.nmarked = 0;
            this.nuncovered = 0;
            this.exploded = false;
            // create an array
            this.arr = array2d(
                nrows, ncols,
                () => ({mine: false, state: STATE_HIDDEN, count: 0}));
        }

        count(row,col) {
            const c = (r,c) =>
                (this.validCoord(r,c) && this.arr[r][c].mine ? 1 : 0);
            let res = 0;
            for( let dr = -1 ; dr <= 1 ; dr ++ )
                for( let dc = -1 ; dc <= 1 ; dc ++ )
                    res += c(row+dr,col+dc);
            return res;
        }
        sprinkleMines(row, col) {
            // prepare a list of allowed coordinates for mine placement
            let allowed = [];
            for(let r = 0 ; r < this.nrows ; r ++ ) {
                for( let c = 0 ; c < this.ncols ; c ++ ) {
                    if(Math.abs(row-r) > 2 || Math.abs(col-c) > 2)
                        allowed.push([r,c]);
                }
            }
            this.nmines = Math.min(this.nmines, allowed.length);
            for( let i = 0 ; i < this.nmines ; i ++ ) {
                let j = rndInt(i, allowed.length-1);
                [allowed[i], allowed[j]] = [allowed[j], allowed[i]];
                let [r,c] = allowed[i];
                this.arr[r][c].mine = true;
            }
            // erase any marks (in case user placed them) and update counts
            for(let r = 0 ; r < this.nrows ; r ++ ) {
                for( let c = 0 ; c < this.ncols ; c ++ ) {
                    if(this.arr[r][c].state === STATE_MARKED)
                        this.arr[r][c].state = STATE_HIDDEN;
                    this.arr[r][c].count = this.count(r,c);
                }
            }
            let mines = []; let counts = [];
            for(let row = 0 ; row < this.nrows ; row ++ ) {
                let s = "";
                for( let col = 0 ; col < this.ncols ; col ++ ) {
                    s += this.arr[row][col].mine ? "B" : ".";
                }
                s += "  |  ";
                for( let col = 0 ; col < this.ncols ; col ++ ) {
                    s += this.arr[row][col].count.toString();
                }
                mines[row] = s;
            }
            this.nmarked = 0; //fixed the bug that kept cells marked when starting the game
            console.log("Mines and counts after sprinkling:");
            console.log(mines.join("\n"), "\n");
        }
        // puts a flag on a cell
        // this is the 'right-click' or 'long-tap' functionality
        uncover(row, col) {
            console.log("uncover", row, col);
            // if coordinates invalid, refuse this request
            if( ! this.validCoord(row,col)) return false;
            // if this is the very first move, populate the mines, but make
            // sure the current cell does not get a mine
            if( this.nuncovered === 0)
                this.sprinkleMines(row, col);
            // if cell is not hidden, ignore this move
            if( this.arr[row][col].state !== STATE_HIDDEN) return false;
            // floodfill all 0-count cells
            const ff = (r,c) => {
                if( ! this.validCoord(r,c)) return;
                if( this.arr[r][c].state !== STATE_HIDDEN) return;
                this.arr[r][c].state = STATE_SHOWN;
                this.nuncovered ++;
                if( this.arr[r][c].count !== 0) return;
                ff(r-1,c-1);ff(r-1,c);ff(r-1,c+1);
                ff(r  ,c-1);         ;ff(r  ,c+1);
                ff(r+1,c-1);ff(r+1,c);ff(r+1,c+1);
            };
            ff(row,col);
            // have we hit a mine?
            if( this.arr[row][col].mine) {
                this.exploded = true;
            }
            return true;
        }
        // uncovers a cell at a given coordinate
        // this is the 'left-click' functionality
        mark(row, col) {
            console.log("mark", row, col);
            // if coordinates invalid, refuse this request
            if( ! this.validCoord(row,col)) return false;
            // if cell already uncovered, refuse this
            console.log("marking previous state=", this.arr[row][col].state);
            if( this.arr[row][col].state === STATE_SHOWN) return false;
            // accept the move and flip the marked status
            this.nmarked += this.arr[row][col].state === STATE_MARKED ? -1 : 1;
            this.arr[row][col].state = this.arr[row][col].state === STATE_MARKED ?
                STATE_HIDDEN : STATE_MARKED;
            return true;
        }
        // returns array of strings representing the rendering of the board
        //      "H" = hidden cell - no bomb
        //      "F" = hidden cell with a mark / flag
        //      "M" = uncovered mine (game should be over now)
        // '0'..'9' = number of mines in adjacent cells
        getRendering() {
            const res = [];
            for( let row = 0 ; row < this.nrows ; row ++) {
                let s = "";
                for( let col = 0 ; col < this.ncols ; col ++ ) {
                    let a = this.arr[row][col];
                    if( this.exploded && a.mine) s += "M";
                    else if( a.state === STATE_HIDDEN) s += "H";
                    else if( a.state === STATE_MARKED) s += "F";
                    else if( a.mine) s += "M";
                    else s += a.count.toString();
                }
                res[row] = s;
            }
            return res;
        }
        getStatus() {
            let done = this.exploded ||
                this.nuncovered === this.nrows * this.ncols - this.nmines;
            return {
                done: done,
                exploded: this.exploded,
                nrows: this.nrows,
                ncols: this.ncols,
                nmarked: this.nmarked,
                nuncovered: this.nuncovered,
                nmines: this.nmines
            }
        }
    }

    return _MSGame;

})();
//////////////////////////////////////////////////////////////
let flagged = false;
let timer;
const tempo = 10; 
function mine(game, tile_location) {
    let [x_coordinate,y_coordinate] = splitString(tile_location);
    x_coordinate = Number(x_coordinate)
    y_coordinate = Number(y_coordinate)
    game.uncover(x_coordinate,y_coordinate);
    generate_Board(game);
    flagged = false;
}

function flag(game, tile_location) {
    let [x_coordinate,y_coordinate] = splitString(tile_location);
    x_coordinate = Number(x_coordinate)
    y_coordinate = Number(y_coordinate)
    game.mark(x_coordinate,y_coordinate);
    generate_Board(game);
}
function splitString(tile_location){
    var split_string = tile_location.dataset.coordinate.split("x");
    let [x_coordinate,y_coordinate] = split_string;
    return [x_coordinate,y_coordinate];
}
/*
TODO -> Redo timer function
*/
function stopwatch(game){
    let status = game.getStatus();
    var start_explosion = status.nuncovered;
    var game_over = status.done;
    if(start_explosion !== 0){
        if (game_over == false){
            game_time = game_time + 1;
        }
    } 
    document.querySelector(".stopwatch").innerHTML = "Time in Game: " + game_time
}

function countdown(game){
    let status = game.getStatus();
    var start_explosion = status.nuncovered;
    var game_over = status.done;
    if(start_explosion !== 0){
        if (game_over == false){
            game_timer = game_timer -1;
        }
    } 
    document.querySelector(".countdown").innerHTML = "Time Till Detonation: " + game_timer
}

/*
Finish doing the mouse up and mouse down function.
*/
function mouseDown(game, tile_location) {
    timer = setTimeout(function(){
        flag(game, tile_location);
    }, tempo);
};

function mouseUp(game, tile_location) {
    clearTimeout(timer);
    if (!flagged)
        mine(game, tile_location);
    flagged = false;
};


function generate_Board(game) {
    let game_status = game.getStatus();
    let mines_placed = game_status.nmines;
    let mines_marked = game_status.nmarked
    const base_layout = document.querySelector(".base");
    base_layout.innerHTML = "";
    const game_board = game.getRendering();
    let flag_count = (mines_placed - mines_marked);
    //What does this mean?
    document.querySelector(".flagCounter").innerHTML = "Flags Remaining: " + flag_count;
   //disable right click menu
   document.querySelectorAll(".playing_area").forEach(element => element.addEventListener("contextmenu", n => {
    n.preventDefault();
  }));
    
    //create a switch statement to chose a difficulty.
    let set_board = $(".base");
    let size = game_board.length;
    switch(size) {
        case 10:
            set_board.removeClass("Expert");
            set_board.addClass("Beginner");
            break;
        case 20:
            set_board.removeClass("Beginner")
            set_board.addClass("Expert");
            break;
            
    }
    //initialize variables
    let row_counter = 0;
    let column_counter = 0;
    for(row_counter = 0 ; row_counter < game_board.length ; row_counter = row_counter + 1) {
        for(column_counter = 0; column_counter < game_board[row_counter].length; column_counter = column_counter + 1){
            let field_location = game_board[row_counter][column_counter];
            let image = document.createElement('img');
            const tile_location = document.createElement('div');
            tile_location.location = `${row_counter}&#x2715;${column_counter}`;
            tile_location.className = "tile_location";
            tile_location.dataset.coordinate = row_counter+"x"+column_counter;
            tile_location.innerHTML = "";
        
            
            if (field_location == "H")
            {
                image.src = "./assets/field/building1.jpg";
            }
            else if(field_location == "F")
            {
                image.src = "./assets/field/flag.jpg";
            }
            else if (field_location == "M")
            {
                image.src = "./assets/field/bomb.jpg";
            }else if(field_location == '1')
            {
                image.src = "./assets/numbers/one.png";
            }else if(field_location == '2')
            {
                image.src = "./assets/numbers/two.jpg";
            }else if(field_location == '3')
            {
                image.src = "./assets/numbers/three.jpg";
            }else if(field_location == '4')
            {
                image.src = "./assets/numbers/four.jpg";
            }else if(field_location == '5')
            {
                image.src = "./assets/numbers/five.png";
            }else if(field_location == '6')
            {
                image.src = "./assets/numbers/images.jpg";
            }else if(field_location == '7')
            {
                image.src = "./assets/numbers/seven.jpg";
            }else if(field_location == '8')
            {
                image.src = "./assets/numbers/eight.jpg";
            }else if(field_location == '9')
            {
                image.src = "./assets/numbers/nine.jpg";
            }else if(field_location == '0')
            {
                image.src = "./assets/numbers/zero.jpg";
            }
                
            image.className = "base_image";
            tile_location.appendChild(image);
            if(!game.getStatus().done){
                
                    tile_location.onmouseup = event => {
                        if (event.button === 0) {
                            mine(game, tile_location);
                        } else {
                            flag(game, tile_location);
                        }
                    };
                
            }
            base_layout.appendChild(tile_location);
        }
    }
    //check if game is done
    if(game.getStatus().done){
        //if the game is won or lost
        //loss
        
        document.querySelector("#overlay").classList.add("active");
    }
}

function createBoardFromButton(button,game){
    let [x_coordinate,y_coordinate,mine_count,flag_count] = split_incoming_data(button);
    x_coordinate = Number(x_coordinate); 
    y_coordinate = Number(y_coordinate);
    mine_count = Number(mine_count);
    game.init(x_coordinate,y_coordinate,mine_count)
    generate_Board(game)
    
    
    //reset timer
    game_time = 0;
    game_timer = 1000;
  }

function split_incoming_data(button)
{
    var split_string = button.getAttribute("data-size").split("x");
    var [x_coordinate,y_coordinate,mine_count,flag_count] = split_string;
    return [x_coordinate,y_coordinate,mine_count,flag_count];
}


function main(){

    
    // register callbacks for buttons
    document.querySelectorAll(".difficulty_select").forEach((button) =>{
    button.addEventListener("click",function(){
      createBoardFromButton(button,game)
        })
    });
    generate_Board(game);
    window.setInterval(x => stopwatch(game),1000);
    window.setInterval(x => countdown(game),1000);

}
let game_timer = 1000;
let game_time = 0;
let hadStarted = false;
let game = new MSGame();
window.addEventListener('load', main);
