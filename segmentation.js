"use strict"

let helpers = require("./helpers")

let argmin = helpers.argmin
let mean = helpers.mean
let merge_pair = helpers.merge_pair
let sum = helpers.sum



/*
    Determine how many segments into which a given time series should be broken.

    ts:
        An array of numbers, representing time series data.
*/
let determine_num_segments_for = (ts) => {
    if (ts.length < 100)
        return Math.round(0.50 * ts.length)
    else if (ts.length < 200)
        return Math.round(0.35 * ts.length)
    else
        return Math.round(0.25 * ts.length)
}



/*
    Returns the MSE of the simple linear regression through the given data.

    A constant sample rate is assumed. The indices of the data are treated as X.

    array:
        An array of numbers, representing Y.
*/
let error_of = (array) => {
    let Xbar = (array.length - 1) / 2
    let Ybar = sum(array) / array.length

    let m = sum(array.map((y, x) => (x - Xbar) * (y - Ybar))) /
        sum(array.map((y, x) => (x - Xbar) ** 2))

    let b = Ybar - m * Xbar

    let yhat = x => m * x + b

    return mean(array.map((y, x) => (y - yhat(x)) ** 2))
}


 
/*
    Returns a segmentation of a given time series as an array of smaller arrays
    that partition the original.

    Uses the bottom-up algorithm for segmentation (Pazzani 6)

    ts:
        An array of numbers, representing time series data.
*/
let segmentation_of = (ts) => {
    let segments = []
    let costs = []

    let num_segments = determine_num_segments_for(ts)

    // Create initial fine approximation
    for (let i = 0; i < ts.length - 1; i += 2)
        segments.push(ts.slice(i, i + 2))

    // Find cost of merging each pair of segments
    for (let i = 0; i < segments.length - 1; i++)
        costs[i] = error_of(merge_pair(segments, i, i + 1))

    while (segments.length > num_segments) {
        // Find cheapest pair to merge, and do so
        let index = argmin(costs)
        segments[index] = merge_pair(segments, index, index + 1)
        segments.splice(index + 1, 1)
        costs.splice(index, 1)

        // Update cost records
        if (index > 0)
            costs[index - 1] = error_of(merge_pair(segments, index - 1, index))

        costs[index] = error_of(merge_pair(segments, index, index + 1))
    }

    return segments
}



/*
    Enables the use of "require(./segmentation)" to access segmentation_of()
*/
module.exports = {
    segmentation_of
}