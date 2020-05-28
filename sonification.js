let MidiWriter = require("midi-writer-js")
let Segmentation = require("./segmentation")

// Use this structure instead of hard-coding the CC values
const PARAM = {
    PITCH: "pitch",
    VOLUME: "volume"
}


// Round a pitch to be tonal to the scale.
// The paper only used Cmaj so it hardcoded a decrement
let get_scale_tone_for = (midi_note, config) => {
    let decreased = midi_note
    let increased = midi_note

    let is_tonal = note => config.scale.includes(note % 12)

    while (!is_tonal(decreased) || !is_tonal(increased)) {
        decreased--
        increased++
    }

    if (is_tonal(decreased))
        return decreased
    else
        return increased
}

let sonification_of = (parameter_map, config) => {
    let midi_track = new MidiWriter.Track()

    // Returns an Array of Arrays such that midi_events[parameter][time] = a midi event
    let midi_events = Object.keys(parameter_map)
                        .map(parameter => sonify_parameter(parameter, parameter_map[parameter], config))

    // We need to add the events of every parameter in order of time, not parameter type
    // otherwise we'll see all the CC events occur after the notes are done
    for(let time = 0; time < midi_events[0].length; time++)
        for(let par = 0; par < midi_events.length; par++)
        {
            // The MidiWriter API is different for note-on and CC...
            // Note-on uses track.addEvent(NoteEvent)
            // but CC uses track.controllerChange()
            // so an "event" is a function that properly adds the desired event to the track
            // to keep things consistent here

            let add_event_to = midi_events[par][time]
            add_event_to(midi_track)
        }
    
    return new MidiWriter.Writer(midi_track).dataUri()
}


let sonify_parameter = (parameter, ts, config) => {
    let ts_statistics = {
        min: Math.min(...ts),
        max: Math.max(...ts)
    }

    if(parameter == PARAM.PITCH) // two == not === because the PARAM integer gets cast to a string somewhere
        return Segmentation.segmentation_of(ts)
            .map(segment => create_note_event_from(segment, ts_statistics, config))

    else if(parameter == PARAM.VOLUME)
        return Segmentation.segmentation_of(ts)
            .map(segment => create_cc_event_from(segment, 7, ts_statistics))
}


let create_cc_event_from = (array, cc_number, ts_statistics) => {
    let segment_value = mean(array)

    let cc_value = Math.round(
        map_to_range(
            value = segment_value,
            old_min = ts_statistics.min,
            old_max = ts_statistics.max,
            new_min = 0,
            new_max = 127
        )
    )

    return (track) => track.controllerChange(cc_number, cc_value)
        
}

let create_note_event_from = (array, ts_statistics, config) => {
    let duration = array.length * config.ticks_per_samp
    let segment_value = mean(array)

    // Map the segment value (within the total range of the data) to the range of pitches
    let note = Math.round(
        map_to_range(
            value = segment_value,
            old_min = ts_statistics.min,
            old_max = ts_statistics.max,
            new_min = config.low,
            new_max = config.low + config.range
        )
    )

    let note_event = new MidiWriter.NoteEvent({
        pitch: get_scale_tone_for(note, config),
        duration: "T" + duration
    })

    return (track) => track.addEvent(note_event)
}

let map_to_range = (value, old_min, old_max, new_min, new_max) =>
    (value - old_min) / (old_max - old_min) * (new_max - new_min) + new_min


let sum = array => array.reduce((a, b) => a + b)
let mean = array => sum(array) / array.length


module.exports = {
    sonification_of: sonification_of
}