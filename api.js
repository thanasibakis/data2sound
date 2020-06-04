#!/usr/bin/env node

let express = require("express")
let Sonification = require("./sonification")
let bodyParser = require("body-parser")
let cors = require("cors")
let app = express()

// Instruct the server to parse application/json data
app.use(bodyParser.json())

// Enable cross-origin
app.use(cors())

// Configure the handler for a POST request on /
app.post("/", (req, res) => {
    console.log(`Received a request from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`)
    
    // These objects are all mandatory to the request
    // and should follow the structure laid out in the API documentation
    let parameter_map = req.body.parameter_map
    let config = req.body.config
    let measurement_types = req.body.measurement_types

    res.setHeader('Content-Type', 'text/plain')
    res.send(Sonification.sonification_of(parameter_map, measurement_types, config))
})

// Listen on port 80, unless a port was given with "api.js [port]"
let port = process.argv[2] || 80
app.listen(port, () => console.log(`Now listening on port ${port}...`))