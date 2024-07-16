const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const pinSchema = new mongoose.Schema({
    transfer: {type: Number},
    imf: {type: Number},
    otp: {type: Number},
    tax: {type: Number}
})

module.exports = mongoose.model('pin', pinSchema)