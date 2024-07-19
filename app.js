require('dotenv').config()
const express = require('express') 
const ejs = require('ejs')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const session = require('express-session')
const adminSchema = require('./schema/adminSchema')
const accountSchema = require('./schema/accountSchema')
const pinSchema = require('./schema/pinSchema')
const transactionSchema = require('./schema/transactionSchema')
const userSchema = require('./schema/userSchema')
const cryptoTransSchema = require('./schema/cryptoTransSchema')
const cardSchema = require('./schema/cardSchema')

const secretkey = process.env.SECRETKEY
const adminkey = process.env.ADMINKEY

const mongodb = process.env.MONGODB
mongoose.connect(mongodb)
.then(() => {
   console.log('Connection successful')
}).catch((err) => {
    console.log(err, "Connection failed")
})

const app = express()
app.use('/assets', express.static('assets')) 
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.json())
app.use(
    session({
      resave: false,
      saveUninitialized: true,
      secret: 'secret',
    })
);


app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// app.get('/register', (req,res)=>{
//     res.render('register')
// })

// app.post('/register', async(req,res)=>{
//     const regInfo = req.body
//     const password = regInfo.password
//     const password2 = regInfo.password2

//   if (password != password2){
//     req.flash('danger', 'Passwords do not match, Please Try Again')
//     res.redirect('/register')
//   } else {
//     const salt = await bcrypt.genSalt(10)
//     const hashedPassword = await bcrypt.hash(password, salt)
  
//       run()
//       async function run(){
//           try {
//               const admin = new adminSchema({
//                   email: regInfo.email,
//                   password: hashedPassword
//               })
//               await admin.save()
//           }
//           catch (err) {
//               console.log(err.message)
          
//           }
//       }
//       req.flash('success', 'Registeration Successful, Please Log In')
//       res.redirect('/signin')
//   } 
//   })

  function protectAdminRoute(req, res, next){
    const token = req.cookies.admintoken
    try{
        const user = jwt.verify(token, adminkey)

        req.user = user
        // console.log(req.user)
        next()
    }
    catch(err){
        res.clearCookie('admintoken')
        return res.render('signin')
    }
}


app.get('/signin', (req,res)=>{
    res.render('signin')
})

app.post('/signin', (req,res)=>{
    const loginInfo = req.body

    const email = loginInfo.email
    const password = loginInfo.password

    adminSchema.findOne({email})
    .then((admin)=>{
        adminSchema.findOne({email: email}, (err,details)=>{
            if(!details){
                req.flash('danger','User not found!, Please try again')
                res.redirect('/')
            } else{
                bcrypt.compare(password, admin.password, async (err,data)=>{
                    if(data){
                        const payload1 = {
                            user:{
                                email: admin.email
                            }
                        }
                        const token1 = jwt.sign(payload1, adminkey,{
                            expiresIn: '3600s'
                        })

                        res.cookie('admintoken', token1, {
                            httpOnly: false
                        })

                        res.redirect('/')
                    } else{
                        req.flash('danger', 'Incorrect Password, Please Try Again!')
                        res.redirect('/')
                    }
                })
            }
        })
    }).catch((err)=>{
        console.log(err)
    })
})  


//home page
app.get('/', protectAdminRoute, async (req,res)=>{
    const users = await userSchema.find()
    res.render('index', {users: users})
})

app.get('/create', protectAdminRoute, (req,res)=>{
    res.render('create')
})

app.post('/create', protectAdminRoute, async (req,res)=>{
    const {picture, name, address, email, password, dob, gender} = req.body

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    let pinId
    let accountId
    let cardId

    createPins()
    async function createPins(){
        try { 
            const pin = new pinSchema({
                transfer: 1234,
                imf: 1234,
                otp: 1234,
                tax: 1234
            })        
            await pin.save()  
            pinId = pin._id
            // console.log(pinId, pin._id)
            createCards()
        } catch (error) {
            console.log(error.message)
        }
    }

    async function createCards(){
        try{
            const card = new cardSchema({
                debit: 'inactive',
                crypto: 'inactive'
            })
            await card.save()
            cardId = card._id
            createAccounts()
        } catch(error){
            console.log(error.message)
        }
    }

    
    async function createAccounts(){
        try { 
            const account = new accountSchema({
                number: 1234567890, 
                balance: 0,
                cryptoBalance: 0,
                withdrawals: 0
            })        
            await account.save()  
            accountId = account._id
            // console.log(accountId, account._id)
            createUser()
        } catch (error) {
            console.log(error.message)
        }
    }

    
    async function createUser(){
        // console.log(pinId, accountId)
        try { 
            const user = new userSchema({
                name: name,
                email: email,
                address: address,
                Gender: gender,
                password: hashedPassword,
                password2: password,
                DateOfBirth: dob,
                picture: picture,
                pin: pinId,
                account: accountId,
                card: cardId
            })        
            await user.save()  
            // console.log(user.pin, pinId)
            res.send('OK')  
        } catch (error) {
            console.log(error.message)
        }
    }
})

app.post('/update/:id', async (req,res)=>{
    const id = req.params.id
    const filter = {_id: id}
    const {name, address, email, password, dob, gender} = req.body

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    userSchema.findOneAndUpdate(filter, {$set:{name: name, address:address, email:email, password: hashedPassword, password2:password, DateOfBirth:dob, Gender: gender}}, {new: true}, (err,dets)=>{
        if (err){
            console.log(err)
            req.flash('danger', 'An Error Occured, Please try again')
            res.redirect(`/${id}`)
        }else{
            req.flash('success', 'Account Updated Sucessfully')
            res.redirect(`/${id}`)
        }
    })
})

app.post('/updateAccount/:id', async (req,res)=>{
    const id = req.params.id
    const {balance, number, cryptoBalance, withdrawals} = req.body

    // console.log(balance, number, cryptoBalance, withdrawals)

    const user = await userSchema.findById(id)
    // console.log(user.account)

    const filter = {_id: user.account}

    // const account = await accountSchema.findOne(filter)

    accountSchema.findOneAndUpdate(filter, {$set:{number: number, balance: balance, cryptoBalance: cryptoBalance, withdrawals: withdrawals }} , {new: true}, (err, dets)=>{
        if (err){
            console.log(err)
            req.flash('danger', 'An Error Occured, Please try again')
            res.redirect(`/${id}`)
        }else{
            // console.log(dets)
            userSchema.findByIdAndUpdate(id, {$set:{account: dets._id}}, {new: true}, (error,details)=>{
                if (error){
                    console.log(err)
                    req.flash('danger', 'An Error Occured, Please try again')
                    res.redirect(`/${id}`)
                } else{
                    req.flash('success', 'Account Updated Sucessfully')
                    res.redirect(`/${id}`)
                    // console.log(details)
                }
            })
        }
    })
})

app.post('/updatePin/:id', async (req,res)=>{
    const id = req.params.id
    const {transfer, imf, otp, tax} = req.body

    // console.log(balance, number, cryptoBalance, withdrawals)

    const user = await userSchema.findById(id)
    // console.log(user.account)

    const filter ={_id: user.pin}
    // console.log(filter)

    // const account = await accountSchema.findOne(filter)

    pinSchema.findOneAndUpdate(filter, {$set: {transfer: transfer, imf: imf, otp: otp, tax: tax }} , {new: true}, (err,dets)=>{
        if (err){
            console.log(err)
            req.flash('danger', 'An Error Occured, Please try again')
            res.redirect(`/${id}`)
        }else{
            // console.log(dets)
            userSchema.findByIdAndUpdate(id, {$set:{pin: dets._id}}, {new: true}, (error,details)=>{
                if (error){
                    console.log(err)
                    req.flash('danger', 'An Error Occured, Please try again')
                    res.redirect(`/${id}`)
                } else{
                    req.flash('success', 'Pin Updated Sucessfully')
                    res.redirect(`/${id}`)
                    // console.log(details)
                }
            })
        }
    })
})

app.post('/updateImage/:id', async (req,res)=>{
    const id = req.params.id
    const filter = {_id: id}
    const {picture} = req.body

    userSchema.findOneAndUpdate(filter, {$set:{picture: picture}}, {new: true}, (err,dets)=>{
        if (err){
            console.log(err)
            return
        }else{
            res.send('OK')
        }
    })
})

app.post('/addTransaction/:id', async (req,res)=>{
    const id = req.params.id

    const {narration, date, amount, type, successful} = req.body

    // Initial date string
    let dateStr = date;

    // Convert to a Date object
    let newDate = new Date(dateStr);

    // Format the date to the desired format
    let formattedDate = newDate.toISOString().replace('T', ' ').replace(/\..+/, '');

    // Ensure seconds are set to "00"
    if (formattedDate.length === 16) {
        formattedDate += ':00';
    }

    // console.log(formattedDate);


    // console.log(narration, date, amount, type, successful)

    const transaction = new transactionSchema({
        narration: narration,
        date: formattedDate,
        amount: amount,
        type: type,
        successful: successful
    })

    await transaction.save()

    const user = await userSchema.findById(id)
    const accountId = user.account

    const accountStats = await accountSchema.findById(accountId)
    const balance = accountStats.balance

    console.log(user, accountStats)

    let  newBalance = balance
    if (transaction.successful == 'true'){
        if (transaction.type == 'deposit'){
            newBalance = balance + Number(amount)
        } else {
            newBalance = balance - Number(amount)
        }
    }
    
    accountSchema.findByIdAndUpdate(accountId, {$set: {balance: newBalance}}, {new: true}, (err,dets)=>{
        if (err){
            console.log(err)
            req.flash('danger', 'An Error Occured, Please try again')
            res.redirect(`/${id}`)
        }else{
            userSchema.findByIdAndUpdate(id, {$push: {transaction: transaction._id}, $set: {account: dets._id}}, {new: true})
            .then(()=>{
                // console.log(dets)
                req.flash('success', 'Transaction created Sucessfully')
                res.redirect(`/${id}`)
            }).catch((err)=>{
                console.log(err)
                req.flash('danger', 'An Error Occured, Please try again')
                res.redirect(`/${id}`)
            })
        }
    })

    
})

app.post('/addCryptoTransaction/:id', async (req,res)=>{
    const id = req.params.id

    const {date, amount, type} = req.body

    // Initial date string
    let dateStr = date;

    // Convert to a Date object
    let newDate = new Date(dateStr);

    // Format the date to the desired format
    let formattedDate = newDate.toISOString().replace('T', ' ').replace(/\..+/, '');

    // Ensure seconds are set to "00"
    if (formattedDate.length === 16) {
        formattedDate += ':00';
    }

    // console.log(formattedDate);


    // console.log(narration, date, amount, type, successful)

    const cryptotransaction = new cryptoTransSchema({
        date: formattedDate,
        amount: amount,
        type: type
    })

    await cryptotransaction.save()

    const user = await userSchema.findById(id)
    const accountId = user.account

    const accountStats = await accountSchema.findById(accountId)
    const balance = accountStats.cryptoBalance

    let  newBalance
    if (cryptotransaction.type == 'deposit'){
        newBalance = balance + Number(amount)
    } else {
        newBalance = balance - Number(amount)
    }

    accountSchema.findByIdAndUpdate(accountId, {$set: {cryptoBalance: newBalance}}, {new: true}, (err,dets)=>{
        if (err){
            console.log(err)
            req.flash('danger', 'An Error Occured, Please try again')
            res.redirect(`/${id}`)
        }else{
            userSchema.findByIdAndUpdate(id, {$push: {cryptotransaction: cryptotransaction._id}, $set: {account: dets._id}}, {new: true})
            .then(()=>{
                req.flash('success', 'Crypto Transaction created Sucessfully')
                res.redirect(`/${id}`)
            }).catch((err)=>{
                console.log(err)
                req.flash('danger', 'An Error Occured, Please try again')
                res.redirect(`/${id}`)
            })
        }
    })

    
})

app.get('/:id', async (req,res)=>{
    const id = req.params.id

    const user = await userSchema.findById(id).populate('account').populate('pin').populate('transaction').populate('cryptotransaction').populate('card')
    res.render('user', {user, user})
})

app.get('/getTransactions/:id', async (req,res)=>{
    const id = req.params.id

    const user = await userSchema.findById(id).populate('account').populate('pin').populate('transaction')
    const transactions = user.transaction

    res.send(transactions)
})

app.get('/deleteTransaction/:userId/:id', async (req,res)=>{
    const userId = req.params.userId
    const id = req.params.id

    const transaction = await transactionSchema.findById(id)
    const amount = transaction.amount

    const user = await userSchema.findById(userId)
    const accountId = user.account
    const account = await accountSchema.findById(accountId)
    const balance = account.balance

    let newBalance = balance
    if (transaction.successful == 'true'){
        if (transaction.type == 'deposit'){
            newBalance = balance - amount
        }else{
            newBalance = balance + amount
        }
    }

    transactionSchema.findByIdAndDelete(id)
    .then(result =>{
        // console.log(result)
        accountSchema.findByIdAndUpdate(accountId, {$set: {balance: newBalance}}, {new: true}, (err, dets)=>{
            if (err){
                console.log(err)
                req.flash('danger', 'An Error Occured, Please try again')
                res.redirect(`/${id}`)
            }else{
                userSchema.findByIdAndUpdate(userId, {$pull: {transaction: id}, $set: {account: dets.id}})
                .then(()=>{
                    req.flash('success', 'Transaction Deleted Sucessfully')
                    res.redirect(`/${userId}`)
                }).catch((err)=>{
                    console.log(err)
                    req.flash('danger', 'An Error Occured, Please try again')
                    res.redirect(`/${userId}`)
                })
            }
        })
        
    }).catch((err)=>{
        console.log(err)
        req.flash('danger', 'An Error Occured, Please try again')
        res.redirect(`/${userId}`)
    })
})

app.get('/deleteCryptoTransaction/:userId/:id', async (req,res)=>{
    const userId = req.params.userId
    const id = req.params.id

    const cryptotransaction = await cryptoTransSchema.findById(id)
    const amount = cryptotransaction.amount

    const user = await userSchema.findById(userId)
    const accountId = user.account
    const account = await accountSchema.findById(accountId)
    const balance = account.cryptoBalance

    let newBalance
    if (cryptotransaction.type == 'deposit'){
        newBalance = balance - amount
    }else{
        newBalance = balance + amount
    }    

    cryptoTransSchema.findByIdAndDelete(id)
    .then(result =>{
        // console.log(result)
        accountSchema.findByIdAndUpdate(accountId, {$set: {cryptoBalance: newBalance}}, {new: true}, (err, dets)=>{
            if (err){
                console.log(err)
                req.flash('danger', 'An Error Occured, Please try again')
                res.redirect(`/${id}`)
            }else{
                userSchema.findByIdAndUpdate(userId, {$pull: {cryptotransaction: id}, $set: {account: dets.id}})
                .then(()=>{
                    req.flash('success', 'Crypto Transaction Deleted Sucessfully')
                    res.redirect(`/${userId}`)
                }).catch((err)=>{
                    console.log(err)
                    req.flash('danger', 'An Error Occured, Please try again')
                    res.redirect(`/${userId}`)
                })
            }
        })
    }).catch((err)=>{
        console.log(err)
        req.flash('danger', 'An Error Occured, Please try again')
        res.redirect(`/${userId}`)
    })
})

app.post('/debit/:id/:status', async (req,res)=>{
    const id = req.params.id
    const status = req.params.status

    const user = await userSchema.findById(id)
    const cardId = user.card

    cardSchema.findByIdAndUpdate(cardId, {$set: {debit: status}}, {new: true}, (err, dets)=>{
        if (err){
            console.log(err)
            res.send({message: err})
        } else{
            // console.log(dets)
            userSchema.findByIdAndUpdate(id, {$set: {card: dets.id}})
            .then(()=>{
                res.send({message: 'done'})
            }).catch((err)=>{
                console.log(err)
                res.send({message: err})
            })
        }
    })
    
})

app.post('/crypto/:id/:status', async (req,res)=>{
    const id = req.params.id
    const status = req.params.status

    const user = await userSchema.findById(id)
    const cardId = user.card

    cardSchema.findByIdAndUpdate(cardId, {$set: {crypto: status}}, {new: true}, (err, dets)=>{
        if (err){
            console.log(err)
            res.send({message: err})
        } else{
            userSchema.findByIdAndUpdate(id, {$set: {card: dets.id}})
            .then(()=>{
                res.send({message: 'done'})
            }).catch((err)=>{
                console.log(err)
                res.send({message: err})
            })
        }
    })
})


const port = process.env.PORT || 5000

app.listen(port, ()=>{
    console.log(`App started on port ${port}`)
} )
