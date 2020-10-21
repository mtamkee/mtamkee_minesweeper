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

//initialize timers 
let game_timer = 1000;
let game_time = 0;



function end_game()
{
    reset_clock();
    document.querySelector("#overlay").classList.add("active");
}
function winner()
{
    document.querySelector("#overlay").innerHTML = "You won with: " + game_timer + " seconds left"
}
function loser()
{
    document.querySelector("#overlay").innerHTML = "You died with: " + game_timer + " seconds left"
}

function reset_game()
{
    document.querySelector("#overlay").classList.remove("active");
}

function finish_game()
{
    var get_status = mine_sweeper.getStatus().done;
    var is_loser = mine_sweeper.getStatus().exploded
    activate_overlay(get_status,is_loser);
}

function handle_tap(mine_sweeper, tile_location)
{
    let click_time = 0;
    let drop_flag = false;
    tile_location.ontouchstart = () => {
        click_time = setTimeout(function(){
            flag(mine_sweeper,tile_location);
        }, 250);
        console.log("mobile touch initiated");
    };
    tile_location.ontouchend = () => {
        clearTimeout(click_time);
        if(!drop_flag){
            mine(mine_sweeper,tile_location);
        drop_flag = false;
        }
        console.log("mobile touch ended");
    }; 
    
}

function activate_overlay (status, is_loser)
{
    let lost = is_loser;
    if(status == true)
    {
        if(lost == false)
        {
            winner();
            end_game();
        }
        else
        {
            loser();
            end_game();
        }
    }
    
        
}

function mine(mine_sweeper, tile_location)
{
    let [x_coordinate,y_coordinate] = splitString(tile_location);
    x_coordinate = Number(x_coordinate)
    y_coordinate = Number(y_coordinate)
    mine_sweeper.uncover(x_coordinate,y_coordinate);
    generate_Board(mine_sweeper);
}

function flag(mine_sweeper, tile_location)
{
    let [x_coordinate,y_coordinate] = splitString(tile_location);
    x_coordinate = Number(x_coordinate)
    y_coordinate = Number(y_coordinate)
    mine_sweeper.mark(x_coordinate,y_coordinate);
    generate_Board(mine_sweeper);
}
function splitString(tile_location)
{
    var split_string = tile_location.dataset.coordinate.split(",");
    let [x_coordinate,y_coordinate] = split_string;
    return [x_coordinate,y_coordinate];
}

function stopwatch(mine_sweeper)
{
    let status = mine_sweeper.getStatus();
    var start_explosion = status.nuncovered;
    var game_over = status.done;
    if(start_explosion !== 0)
    {
        if (game_over == false)
        {
            game_time = game_time + 1;
        }
    } 
    document.querySelector(".stopwatch").innerHTML = "Time in warzone: " + game_time
}

function countdown(mine_sweeper)
{
    let status = mine_sweeper.getStatus();
    var start_explosion = status.nuncovered;
    var game_over = status.done;
    if(start_explosion !== 0)
    {
        if (game_over == false)
        {
            game_timer = game_timer -1;
        }
    } 
    document.querySelector(".countdown").innerHTML = "Detonation In : " + game_timer
}

var previous_state = false;
var device = "computer";
function check_device(){
    if(navigator.userAgent.match(/Android/i))
    {
        device = "mobile";
        console.log("on andriod");
    }
    else if(navigator.userAgent.match(/iPhone/i))
    {
        device = "mobile";
        console.log("on iphone");
    }
    else if(navigator.userAgent.match(/iPad/i))
    {
        device = "mobile";
        console.log("on ipad");
    }
    else if(navigator.userAgent.match(/webOS/i))
    {
        device = "mobile";
        console.log("on webOS");
    }
    else if(navigator.userAgent.match(/IEMobile/i))
    {
        device = "mobile";
        console.log("on mobile");
    }
    else 
    {
        device = "computer";
        console.log("on pc");
    }
}
function timedRefresh(timeoutPeriod)
{
	setTimeout("location.reload(true);",timeoutPeriod);
}
check_device();

function get_nmines(game_status){
    var x = game_status.nmines;
    return x;
}

function get_nmarked(game_status){
    var x = game_status.nmarked;
    return x;
}

function get_rendering(mine_sweeper){
    var x = mine_sweeper.getRendering();
    return x;
}

function tile_generator(field_location,tile){
    if (field_location == "H")
            {
                tile.src = "./assets/field/building.jpg";
            }
            else if(field_location == "F")
            {
                tile.src = "./assets/field/flag.jpg";
            }
            else if (field_location == "M")
            {
                tile.src = "./assets/field/bomb.jpg";
            }
            else if(field_location == '1')
            {
                tile.src = "./assets/numbers/one.jpg";
            }
            else if(field_location == '2')
            {
                tile.src = "./assets/numbers/two.jpg";
            }
            else if(field_location == '3')
            {
                tile.src = "./assets/numbers/three.jpg";
            }
            else if(field_location == '4')
            {
                tile.src = "./assets/numbers/four.jpg";
            }
            else if(field_location == '5')
            {
                tile.src = "./assets/numbers/five.png";
            }
            else if(field_location == '6')
            {
                tile.src = "./assets/numbers/six.jpg";
            }
            else if(field_location == '7')
            {
                tile.src = "./assets/numbers/seven.jpg";
            }
            else if(field_location == '8')
            {
                tile.src = "./assets/numbers/eight.jpg";
            }
            else if(field_location == '9')
            {
                tile.src = "./assets/numbers/nine.jpg";
            }
            else if(field_location == '0')
            {
                tile.src = "./assets/numbers/zero1.jpg";
            }
}
function generate_Board(mine_sweeper)
{
    const base_layout = document.querySelector(".base");
    let game_status = mine_sweeper.getStatus();
    let mines_placed = get_nmines(game_status);
    let mines_marked = get_nmarked(game_status);
    base_layout.innerHTML = "";
    const game_board = get_rendering(mine_sweeper);
    let flag_count = (mines_placed - mines_marked);
    let flags_placed = mines_marked
    check_device();
    document.querySelector(".flags_remaining").innerHTML = "Flags Remaining: " + flag_count;
    document.querySelector(".flags_placed").innerHTML = "Flags Placed: " + flags_placed;
   //disable right click menu
   document.querySelectorAll(".playing_area").forEach(element => element.addEventListener("contextmenu", n => {
    n.preventDefault();
  }));
    
    //create a switch statement to chose a difficulty.
    let set_board = $(".base");
    var expert = "Expert";
    var intermediate = "Intermediate";
    var beginner = "Beginner";
    let board_size = game_board.length;
    switch(board_size) 
    {
        case 10:
            set_board.removeClass(expert);
            set_board.removeClass(intermediate);
            set_board.addClass(beginner);
            break;
        case 15:
            set_board.removeClass(expert);
            set_board.removeClass(beginner);
            set_board.addClass(intermediate);
            break;
        case 20:
            set_board.removeClass(beginner);
            set_board.removeClass(intermediate);
            set_board.addClass(expert);
            break;
            
    }
    //initialize variables
    let row_counter = 0;
    let column_counter = 0;
    let board_length = game_board.length;
    for(row_counter = 0 ; row_counter < board_length ; row_counter = row_counter + 1)
    {
        var rows_in_board = game_board[row_counter].length;
        for(column_counter = 0; column_counter < rows_in_board; column_counter = column_counter + 1)
        {
            let field_location = game_board[row_counter][column_counter];
            let tile = document.createElement('img');
            let tile_location = document.createElement('div');
            set_tile_location(tile_location,row_counter,column_counter);
            tile_generator(field_location,tile);
            tile.className = "base_image";
            tile_location.appendChild(tile);
            var get_status = mine_sweeper.getStatus().done;
            if(get_status == false){
                if(device == "computer"){
                    console.log("mouse click")
                    click_event(tile_location,mine_sweeper);
                }
                else if (device == "mobile")
                {
                    console.log("tap to mine or hold to flag")
                    handle_tap(mine_sweeper,tile_location);
                }
            }
            else {
                console.log("game finished")
            }
            tile.className = "base_image";
            tile_location.appendChild(tile);
            base_layout.appendChild(tile_location);
        }
    }
    //check if mine_sweeper is done
    finish_game();
}

function click_event(tile_location,mine_sweeper){
    tile_location.onmousedown = event => {
        var game_event = event.button;
        console.log("game event is" + game_event);
        //game event 0 is for left click and returns 2 for right click.
        if(game_event == 0)
        {
            //mine square
            mine(mine_sweeper,tile_location);
            
        }
        else if(game_event == 2)
        {
            //flag square
            flag(mine_sweeper,tile_location);
        }
     };
}

function set_tile_location(tile_location,row_counter,column_counter){
    tile_location.location = `${row_counter}&#x2715;${column_counter}`;
    tile_location.className = "tile_location";
    tile_location.dataset.coordinate = row_counter+","+column_counter;
    tile_location.innerHTML = "";
}

function reset_clock()
{
    game_timer = 1000; // count down
    game_time = 0 //count up
    return game_time, game_timer;
}
function restart_game(){
    reset_game();
    reset_clock();

}
function initialize_board(button,mine_sweeper)
{
    let [x_coordinate,y_coordinate,mine_count,flag_count] = split_incoming_data(button);
    mine_sweeper.init(Number(x_coordinate),Number(y_coordinate),Number(mine_count))
    generate_Board(mine_sweeper)
    restart_game();
}


  /*
  create cases to get the number of mines.
  from html, takes the datasize and parses it
  */
function split_incoming_data(button)
{
    var split_string = button.getAttribute("data-size").split("x");
    var [x_coordinate,y_coordinate,mine_count,flag_count] = split_string;
    return [x_coordinate,y_coordinate,mine_count,flag_count];
}

function set_timings(mine_sweeper){
    window.setInterval(x => stopwatch(mine_sweeper),1000);
    window.setInterval(x => countdown(mine_sweeper),1000);
    console.log("timers are set")
}

function start_game()
{

    
    // register callbacks for buttons
    document.querySelectorAll(".difficulty_select").forEach((button) =>{
    button.addEventListener("click",function(){
      initialize_board(button,mine_sweeper)
        })
    });
    generate_Board(mine_sweeper);
    set_timings(mine_sweeper);
    console.log("game has successfully started.")

}


let mine_sweeper = new MSGame(); // call the game engine 
window.addEventListener('load', start_game);
