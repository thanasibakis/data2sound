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

// Configure the handler for a POST request on /sonify
app.post("/sonify", (req, res) => {
    console.log(`Received a request from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`)
    
    // These objects are all mandatory to the request
    // and should follow the structure laid out in the API documentation
    let parameter_map = req.body.parameter_map
    let config = req.body.config
    let measurement_types = req.body.measurement_types

    res.setHeader('Content-Type', 'text/plain')
    res.send(Sonification.sonification_of(parameter_map, measurement_types, config))
})

// Send users who load the API URL in a browser to the documentation
app.get("/", (req, res) => {
    res.redirect("https://github.com/thanasibakis/data2sound")
})

// Prioritize cmdline arg "node api.js [port]", then Heroku's PORT environment var, then default to 80
let port = process.argv[2] || process.env.PORT || 80
app.listen(port, () => console.log(`Now listening on port ${port}...`))
