const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const cardSchema = new mongoose.Schema({
   debit: String,
   crypto: String
})

module.exports = mongoose.model('card', cardSchema)