const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const cryptoTransSchema = new mongoose.Schema({
   date: String,
   amount: Number,
   type: String
})

module.exports = mongoose.model('cryptoTrans', cryptoTransSchema)