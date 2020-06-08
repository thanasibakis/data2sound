"use strict"

let MidiWriter = require("midi-writer-js")
let Segmentation = require("./segmentation")
let helpers = require("./helpers")

let map_to_range = helpers.map_to_range
let mean = helpers.mean



/*
    Returns a function that adds a desired MIDI CC event, created from examining the given array
    of numbers, to a given MIDI track.

    Why a function? See the sonify_parameter() comments.

    array:
        An array of numbers.

    cc_number:
        The MIDI CC number of the continuous controller that the event will modify.
        Should be between 0 and 127, inclusive.

    value_function:
        A function to be applied to the array, reducing the array to a single value.
        The resulting value is then mapped to the range 0 to 127 as the CC change value.
    
    ts_statistics:
        An object containing information used to map the output of value_function to
        the range 0 to 127, inclusive.
        
        It must contain at least the following properties:
        
        min:
            The minimum value that value_function is expected to output

        max:
            The maximum value that value_function is expected to output

    config:
        An object containing information about the range of desired output note values.

        It must contain at least the following properties:

        volume_low:
            The lowest desired volume level (0-127) that the CC event will possibly receive.

        volume_high:
            The highest desired volume level (0-127) that the CC event will possibly receive.
*/
let create_cc_event_from = (array, cc_number, value_function, ts_statistics, config) => {
    let segment_value = value_function(array)

    let cc_value = Math.round(
        map_to_range(
            segment_value,
            ts_statistics.min,
            ts_statistics.max,
            config.volume_low,
            config.volume_high
        )
    )

    return (track) => track.controllerChange(cc_number, cc_value)
        
}


/*
    Returns a function that adds a desired MIDI note event, created from examining the given array
    of numbers, to a given MIDI track.

    Why a function? See the sonify_parameter() comments.

    array:
        An array of numbers.

    value_function:
        A function to be applied to the array, reducing the array to a single value.
        The resulting value is then mapped to the desired range of notes specified in config.
    
    ts_statistics:
        An object containing information used to map the output of value_function to
        the desired range of notes specified in config.
        
        It must contain at least the following properties:
        
        min:
            The minimum value that value_function is expected to output

        max:
            The maximum value that value_function is expected to output

    config:
        An object containing information about the range of desired output note values.

        It must contain at least the following properties:

        low:
            The MIDI note number of the desired lowest note to possibly be returned.

        range:
            The desired number of unique MIDI notes to possibly be returned.
            The actual range of notes starts at low and ends at low + range, inclusive.
*/
let create_note_event_from = (array, value_function, ts_statistics, config) => {
    let duration = array.length * config.ticks_per_samp
    let segment_value = value_function(array)

    // Map the segment value (within the total range of the data) to the range of pitches
    let note = Math.round(
        map_to_range(
            segment_value,
            ts_statistics.min,
            ts_statistics.max,
            config.low,
            config.low + config.range
        )
    )

    let note_event = new MidiWriter.NoteEvent({
        pitch: get_scale_tone_for(note, config.scale),
        duration: "T" + duration
    })

    return (track) => track.addEvent(note_event)
}

/*
    Rounds a MIDI note value up or down to the closest note in a given scale.

    The paper hardcoded a Cmaj scale, so it only ever needed to decrement a given note.

    midi_note:
        An integer representing a MIDI note.
    
    scale:
        An array of integers representing a scale of MIDI notes.
*/
let get_scale_tone_for = (midi_note, scale) => {
    let decreased = midi_note
    let increased = midi_note

    let is_tonal = note => scale.includes(note % 12)

    while (!is_tonal(decreased) || !is_tonal(increased)) {
        decreased--
        increased++
    }

    return is_tonal(decreased) ? decreased : increased
}


/*
    Returns the sonification of the given data & configuration, in MIDI format.

    parameter_map, measurement_types, config:
        Objects that follow the structures laid out in the API documentation.
*/
let sonification_of = (parameter_map, measurement_types, config) => {
    let midi_track = new MidiWriter.Track()

    // midi_event_generators[parameter][time] = a function that adds a midi event to a given track
    // See sonify_parameter() comments for why
    let midi_event_generators = Object.keys(parameter_map).map(parameter => sonify_parameter(parameter,parameter_map[parameter], measurement_types[parameter], config))

    // We need to add the events of every parameter in order of time, not parameter type
    // otherwise we'll see all the CC events occur after the notes are done
    for(let time = 0; time < midi_event_generators[0].length; time++)
        for(let par = 0; par < midi_event_generators.length; par++)
        {
            let add_event_to = midi_event_generators[par][time]
            add_event_to(midi_track)
        }
    
    return new MidiWriter.Writer(midi_track).dataUri()
}

/*
    Returns a function that adds a MIDI event to a given MIDI track.

    Why this kind of function and not the MIDI event object itself?
    The MidiWriter API uses different methods to add note-on and CC events to a track.
    Note-on uses track.addEvent(), but CC uses track.controllerChange().
    By returning a function, the caller of this function does not have to worry about
    what kind of event they are actually receiving; they can simply use the result
    to build their track.

    parameter:
        A string with the name of one of the supported parameters as listed in the API documentation.

    ts:
        An array of numbers, representing time series data.
    
    measurement_type:
        A string representing one of the supported measurement types as listed in the API documentation.

    config:
        An object that follows the structure laid out in the API documentation.
*/
let sonify_parameter = (parameter, ts, measurement_type, config) => {
    let segments = Segmentation.segmentation_of(ts)

    let value_function = null

    // Decide how each segment will be reduced to a value
    switch(measurement_type) {
        case "mean":
            value_function = mean
            break

        case "min":
            value_function = (segment => Math.min(...segment))
            break

        case "max":
            value_function = (segment => Math.max(...segment))
            break
        
        case "length":
            value_function = (segment => segment.length)
            break
    }

    // Get the min/max of those reduced segments, for mapping to note parameters
    let ts_statistics = {
        min: segments.map(value_function).reduce((a,b) => Math.min(a,b)),
        max: segments.map(value_function).reduce((a,b) => Math.max(a,b))
    }

    switch(parameter) {
        case "pitch":
            return segments.map(segment => create_note_event_from(segment, value_function, ts_statistics, config))

        case "volume":
            return segments.map(segment => create_cc_event_from(segment, 7, value_function, ts_statistics, config))

        case "pan":
            return segments.map(segment => create_cc_event_from(segment, 10, value_function, ts_statistics, config))
    }   
}






/*
    Enables the use of "require(./sonification)" to access sonification_of()
*/
module.exports = {
    sonification_of
}