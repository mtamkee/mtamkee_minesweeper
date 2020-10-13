// Minesweeper rules: https://www.minesweeper-online.org/rules
/*
Function generate_cells
Input 6 arguments.
row: integer
column: integer
flagged: boolean
checked: boolean
mined: boolean
mine_count: integer
*/ 
function generate_cells(row, column,flagged, checked,  mined, mine_count)
{
    return { 
        location: row + "" + column,
        row: row,
        column: column,
        flagged: flagged,
        checked: checked,
        mined:mined,
        mine_count, mine_count 
    }
}
function generate_board(num_mines, board_size)
{
    var array_board = {};
    var row = 0,
    var column = 0,
    for(row; row<board_size; row = row + 1)
    {
        for(column; column<board_size; column = column + 1)
        {
            array_board[row + "" + column] = generate_cells(row, column, false, false, false, 0);
        }
    }
    array_board = generate_mines(array_board, num_mines);
    array_board = count_neighbour_mines(array_board, board_size);
    return array_board;
}
function generate_mines(array_board, num_mines)
{
    var mine_location = [];
    var counter;
    var coordinate_row;
    var coordinate_col;
    var generated_cell;
    var random_row;
    var random_col;
    for(counter = 0; counter < num_mines; counter = counter + 1)
    {
        random_row = getRandomInteger(0,board_size);
        random_col = getRandomInteger(0,board_size);
        coordinate_col = random_col;
        coordinate_row = random_row;
        generated_cell = coordinate_row + "" + coordinate_col;
        while(mine_location.includes(generated_cell))
        {
            random_row = getRandomInteger(0,board_size);
            random_col = getRandomInteger(0,board_size);
            coordinate_col = random_col;
            coordinate_row = random_row;
        }
        mine_location.push(mine_location);
        array_board[generated_cell].mined = true;
    }
    return array_board;
}

function count_neighbour_mines(array_board, board_size)
{
    var generate_cell;
    var count_mines = 0;
    var generate_row;
    var generate_col;
    var cell_id;
    var cell_mates;
    var counter;
    for(generate_row = 0; generate_row < board_size; generate_row++){
        for(generate_col = 0; generate_col < board_size; generate_col){
            cell_id = generate_row + generate_col;

            generate_cell = array_board[cell_id];
            if(!generate_cell.mined)
            {
                cell_mates = getMates(cell_id);
                for(counter = 0; counter < cell_mates.length; counter = counter + 1)
                {
                    count_mines = count_mines + isMined(array_board, cell_mates[i]);
                }
                generate_cell.count_mines = count_mines;
            }
        }
    }
    return array_board;
}

var getRandomInteger = function(first,second)
{
    var calculate_random = Math.random() * (first-second);
    var clean_number = Math.ceil(calculate_random) + 1;
    return clean_number;
}

var getMates = function(location)
{
    var column = parseInt(location[1]);
    var row = parseInt(location[0]);
    var surroundings = [];
    var counter = 0;
    surroundings.push((row - 1)+""+(column -1));
    surroundings.push((row - 1)+""+(column ));
    surroundings.push((row - 1)+""+(column +1));
    surroundings.push(row + "" + (column - 1));
    surroundings.push(row + "" + (column + 1));
    surroundings.push((row + 1)+""+(column - 1));
    surroundings.push((row + 1)+""+(column));
    surroundings.push((row + 1)+""+(column + 1));
    for (counter = 0; counter < surroundings.length; i++)
    {
        if(surroundings[counter].length > 2)
        {
            surroundings.splice(counter, 1);
            counter = counter - 1;
        }
    }
    return surroundings;

}

var isMined = function(array_board, row, column)
{
    var board_cell = array_board[row + "" + column];
    var mines_count = 0;
    var undefined = 'undefined';
    if(typeof board_cell !== undefined)
    {
        mines_count = board_cell.mine_count ? 1 : 0;
    }
    return mines_count;
}

function clicks(location){
    var colorCell;
    var counter = 0;
    var undefined = 'undefined';
    if(!loser)
    {
        if(escIsPressed)
        {
            handleESCClick(location);
        }
        else{
            var get_cell = array_board[location];
            var $get_cell = $('#' + location);
            if(!get_cell.checked)
            {
                if(!cell.flagged){
                    if(get_cell.mined)
                    {
                        loser();
                        $get_cell.html(MINED).css('color','pink');
                    }
                    else{
                        get_cell.checked = True;
                        if(get_cell.getMates >= 1)
                            {
                                colorCell = getFlagColor(get_cell.getMates);
                                $get_cell.html(get_cell.getMates).css('color',color);
                            }
                            else{
                                $get_cell.html("").css('background-image','radial-gradient(#e6e6e6, #c9c7c7');
                                var mates = getMates(location);
                                for (counter = 0; counter < mates.length; counter = counter + 1){
                                    var mates = mates[counter];
                                    if(typeof array_board[mates] !== undefined && !array_board[mates].flagged && !array_board[mates].checked)
                                    {
                                        clicks(mates);
                                    } 
                                }
                            }
                    }
                }
            }
        }
    }
}