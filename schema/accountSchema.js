const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const accountSchema = new mongoose.Schema({
    number: {type: Number, default: 1234567890}, 
    balance:  {type: Number, default: 0},
    cryptoBalance: {type: Number, default: 0},
    withdrawals: {type: Number, default: 0}
})

module.exports = mongoose.model('account', accountSchema)