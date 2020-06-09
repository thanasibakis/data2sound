# data2sound
This is a Node.js server for the sonification of time series data to the MIDI format.

## Running the server

`node api.js [optional port number]`

There are some package dependencies; see the `package.json` for the list. (Maybe this will eventually published as a NPM package!)

## API documentation

To make use of the API, perform a POST request to `[server host:port]/sonify` with the following JSON body:

```javascript
{

  /*
    Specifies the time series data that will be used to modify each parameter of the sound.
    
    You are required to have at least one parameter listed in parameter_map.
    You are not required to include them all.
  */
  parameter_map: {
    pitch:          [/* numbers, representing data */],
    volume:         [/* numbers, representing data */],
    pan:            [/* numbers, representing data */]
  },
  
  
  
  /*
    Specifies how the data will be reduced to values that modify the parameters.
    
    This algorithm works by segmenting the time series data.
    One of the following functions is then applied to each segment to reduce it to a single value:
      - mean
      - min
      - max
      - length
      
    You may specify which function is applied to the data for each parameter.
    The parameters listed in parameter_map must also be listed here in measurement_types.
  */
  measurement_types: {
    pitch:          /* one of "mean", "min", "max", "length" */,
    volume:         /* one of "mean", "min", "max", "length" */,
    pan:            /* one of "mean", "min", "max", "length" */
  },
  
  
  
  /*
    Configures various properties of the sonification.
  */
  config: {
    ticks_per_samp: /* integer, the minimal duration of each sonified segment, in MIDI ticks */,
    range:          /* integer, the number of tones to use in sonification */,
    low:            /* integer, the lowest MIDI note to use in sonification */,
    volume_low:     /* integer 0-127, the lowest volume level to use in sonification */,
    volume_high:    /* integer 0-127, the highest volume level to use in sonification */,
    scale:          [/* integers, representing the pitch classes of scale tones */]
  }
  
}
```

## Will more sound parameters be supported?

Theoretically, it's easy to add support for more parameters here-- especially continuous controllers, since they're usually just mapping the data to values 0-127. However, this was developed alongside a client program (see below, "Example Usage") which interprets the MIDI messages to feed to a Tone.js synth, so at the moment, I'm keeping the capabilties of the two programs hand-in-hand.

## Example usage

The API is put to use on my [Data to Sound](https://thanasibakis.github.io/CS190/data2sound) project page. Its source code can be found at [here](https://github.com/thanasibakis/CS190/tree/master/final-project). (Note that this API can run completely independently from that codebase-- the other way around is not true.)

An instance of the API is currently deployed at [data2sound.herokuapp.com](https://data2sound.herokuapp.com) for the use of client programs like the one mentioned above. Navigating to this page directly (ie. not the /sonify endpoint) will bring you to this repository. 

## Credits

This project is an implementation and expansion of the work done in the following paper:

> Last, M., & Usyskin, A. (2015). Listen to the sound of data. In Multimedia Data Mining and Analytics (pp. 419-446). Springer, Cham.

Additionally, the segmentation algorithm in one of its references (a UCI paper!) was implemented in this project:

> Keogh E, Chu S, Hart D, Pazzani M (2004) Segmenting time series: a survey and novel approach. In: Last M, Kandel A, Bunke H (eds) Data mining in time series databases. World Scientific Publishing Company, Singapore, pp 1–21
