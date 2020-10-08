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
        id: row + "" + column,
        row: row,
        column: column,
        flagged: flagged,
        checked: checked,
        mined,
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
    return array_board
}
function generate_mines(game_board, num_mines)
{
    var mine_location = [];
    var counter = 0,
    var coordinate_row = 0,
    var coordinate_col = 0,
    var generated_cell = 0,
    var random_row = 0,
    var random_col = 0,
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
        game_board[generated_cell].mined = true;
    }
    return game_board;
}

var getRandomInteger = function(first,second)
{
    var calculate_random = Math.random() * (first-second);
    var clean_number = Math.ceil(calculate_random) + 1;
    return clean_number;
}