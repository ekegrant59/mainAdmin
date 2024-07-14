const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const pinSchema = new mongoose.Schema({
    transfer: {type: Number, default: 1234},
    imf: {type: Number, default: 1234},
    otp: {type: Number, default: 1234},
    tax: {type: Number, default: 1234}
})

module.exports = mongoose.model('pin', pinSchema)