#!/usr/bin/env node

let express = require("express")
let Sonification = require("./sonification")
let bodyParser = require("body-parser")
let cors = require("cors")

let app = express()

// Parse application/json
app.use(bodyParser.json())

// Enable cross-origin
app.use(cors())

app.post("/", (req, res) => {
    console.log(`Received a request from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`)
    
    let parameter_map = req.body.parameter_map
    let config = req.body.config
    let measurement_types = req.body.measurement_types

    res.setHeader('Content-Type', 'text/plain')
    res.send(Sonification.sonification_of(parameter_map, measurement_types, config))
})

let port = process.argv[2] || 80
app.listen(port, () => console.log("Now listening..."))