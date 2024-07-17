const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const userSchema = new mongoose.Schema({
    name: String,
    address: String,
    Gender: String,
    DateOfBirth: String,
    password: String,
    password2: String,
    email: String,
    picture: String,
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'account'},
    pin: { type: mongoose.Schema.Types.ObjectId, ref: 'pin'},
    transaction: [{ type: mongoose.Schema.Types.ObjectId, ref: 'transaction'}],
    cryptotransaction: [{ type: mongoose.Schema.Types.ObjectId, ref: 'cryptoTrans'}],
    card: { type: mongoose.Schema.Types.ObjectId, ref: 'card'}
})

module.exports = mongoose.model('user', userSchema)