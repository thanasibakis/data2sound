/*
    Returns the index of the minimum element in the given array.

    Credit to https://gist.github.com/engelen/fbce4476c9e68c52ff7e5c2da5c24a28
*/
let argmin = array => array.map((x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1]



/*
    Performs a linear mapping of the given value from one range to another.
*/
let map_to_range = (value, old_min, old_max, new_min, new_max) =>
    (value - old_min) / (old_max - old_min) * (new_max - new_min) + new_min



/*
    Returns the mean of the given array.
*/
let mean = array => array.reduce((a, b) => a + b) / array.length



/*
    Returns an array length 2, containing the elements of the given array at the given indices.
*/
let merge_pair = (array, index1, index2) => array[index1].concat(array[index2])



/*
    Returns the sum of the given array.
*/
let sum = array => array.reduce((a, b) => a + b)



/*
    Enables the use of "require(./helpers)" to access these functions
*/
module.exports = {
    argmin, map_to_range, mean, merge_pair, sum
}