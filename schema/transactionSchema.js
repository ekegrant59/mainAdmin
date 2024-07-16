const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const transactionSchema = new mongoose.Schema({
   narration: String,
   date: String,
   amount: Number,
   type: String,
   successful: String
})

module.exports = mongoose.model('transaction', transactionSchema)