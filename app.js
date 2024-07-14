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

app.get('/register', (req,res)=>{
    res.render('register')
})

app.post('/register', async(req,res)=>{
    const regInfo = req.body
    const password = regInfo.password
    const password2 = regInfo.password2

  if (password != password2){
    req.flash('danger', 'Passwords do not match, Please Try Again')
    res.redirect('/register')
  } else {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
  
      run()
      async function run(){
          try {
              const admin = new adminSchema({
                  email: regInfo.email,
                  password: hashedPassword
              })
              await admin.save()
          }
          catch (err) {
              console.log(err.message)
          
          }
      }
      req.flash('success', 'Registeration Successful, Please Log In')
      res.redirect('/signin')
  } 
  })

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
            createAccounts()
        } catch (error) {
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
                account: accountId
            })        
            await user.save()  
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

    const filter ={id: user.account}

    // const account = await accountSchema.findOne(filter)

    accountSchema.findOneAndUpdate(filter, {$set:{number: number, balance: balance, cryptoBalance: cryptoBalance, withdrawals: withdrawals }} , {new: true}, (err,dets)=>{
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

app.post('/updatePin/:id', async (req,res)=>{
    const id = req.params.id
    const {transfer, imf, otp, tax} = req.body

    // console.log(balance, number, cryptoBalance, withdrawals)

    const user = await userSchema.findById(id)
    // console.log(user.account)

    const filter ={id: user.pin}

    // const account = await accountSchema.findOne(filter)

    pinSchema.findOneAndUpdate(filter, {$set:{transfer: transfer, imf: imf, otp: otp, tax: tax }} , {new: true}, (err,dets)=>{
        if (err){
            console.log(err)
            req.flash('danger', 'An Error Occured, Please try again')
            res.redirect(`/${id}`)
        }else{
            req.flash('success', 'Pin Updated Sucessfully')
            res.redirect(`/${id}`)
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

app.get('/:id', async (req,res)=>{
    const id = req.params.id

    const user = await userSchema.findById(id).populate('account').populate('pin').populate('transaction')
    res.render('user', {user, user})
})


const port = process.env.PORT || 5000

app.listen(port, ()=>{
    console.log(`App started on port ${port}`)
} )
