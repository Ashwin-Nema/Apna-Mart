const express = require('express')
const UserModel = require('../models/user')
const user_router = express.Router()
const opencage = require('opencage-api-client');
user_router.use(express.urlencoded({ extended: true }))
const bcrypt = require('bcrypt')

require('dotenv').config()
const { REACT_APP_GOOGLE_CLIENT_ID } = process.env

const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(REACT_APP_GOOGLE_CLIENT_ID)



const { validate_email, validate_mobile_number, validate_password, verify_mobile_number, verify_email } = require('../middlewares/verification')
const { authenticatetoken, accesstokengenerator } = require('../middlewares/token');
const { getuserordercount } = require('../middlewares/orders')

user_router.post("/signup", async (req, res) => {
    const verifyemail = await verify_email(req.body.Email)
    if (verifyemail != true) {
        return res.json({
            error: verifyemail
        })
    }

    const verifymobilenumber = await verify_mobile_number(req.body.Mobilenumber)
    if (verifymobilenumber != true) {
        return res.json({
            error: verifymobilenumber
        })
    }
    if (typeof req.body.Password !== "string" || req.body.Password.length === 0) return res.json({ error: "Passowrd provided is not valid" })

    try {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(req.body.Password, salt)
        req.body.Password = hash
        const newuser = new UserModel(req.body)
        const finaluser = await newuser.save()
        const token = accesstokengenerator(finaluser._id)
        const { Name, Email, Mobilenumber, Location } = finaluser
        return res.json({ error: "", token, Name, Email, Mobilenumber, Location })

    } catch (error) {

        return res.json({ error: "Inputs provided are not valid" })
    }
})

user_router.post("/login", async (req, res) => {
    try {
        const { Email, Password } = req.body
        const user = await UserModel.findOne({ Email })
        const isMatching = await bcrypt.compare(Password, user.Password)
        if (user != null && isMatching) {
            const token = accesstokengenerator(user._id)
            const { Name, Email, Mobilenumber, Location } = user
            const ordercount = await getuserordercount(user._id)
            return res.json({ token, Name, Email, Mobilenumber, Location, ordercount })
        }
    } catch (error) {
        return res.status(404).send("No such user found")
    }

    return res.json({ error: "Password provided was not correct" })
})

user_router.post("/login/google", async (req, res) => {
    try {
        const { token } = req.body
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: REACT_APP_GOOGLE_CLIENT_ID
        });
        const {  email } = ticket.getPayload()
        const user = await UserModel.findOne({ Email:email })
        if (user != null ) {
            const token = accesstokengenerator(user._id)
            const { Name, Email, Mobilenumber, Location } = user
            const ordercount = await getuserordercount(user._id)
            return res.json({  token, Name, Email, Mobilenumber, Location, ordercount })
        }
        
    } catch(error) {
        console.log(error)
    }
    res.status(500).send("Sorry something went wrong")
})

user_router.post("/profile", authenticatetoken, async (req, res) => {
    try {

        const user = await UserModel.findById(req.verifieduser)
        const ordercount = await getuserordercount(user._id)
        const { Name, Mobilenumber, Email, Location } = user
        return res.json({ Name, Mobilenumber, Email, error: "", Location, ordercount })
    } catch {
        return res.json({ error: "User is not loggin in" })
    }
})

user_router.put("/profile", authenticatetoken, async (req, res) => {
    const { Password, NewPassword, Name, Email, Mobilenumber } = req.body
    try {
        if (Object.keys(req.body).length !== 5 || Password === undefined || NewPassword === undefined) {
            return res.json({ error: "Inputs provided are not of valid format" })
        }

        if (Name === undefined || Name.length === 0) return res.json({ error: "Name is not valid" })

        const email = await validate_email(Email, req.verifieduser)
        const mobilenumber = await validate_mobile_number(Mobilenumber, req.verifieduser)

        if (req.verifieduser != email) {
            return res.json({ error: "Sorry another user with this email already exists" })
        }

        if (req.verifieduser != mobilenumber) {
            return res.json({ error: "Sorry another user with this mobile number already exists" })
        }

        let editeduser = {}

        if (typeof Password === "string" && Password.trim() !== "" && typeof NewPassword === "string" && NewPassword.trim() !== "") {
            const oldpassword = await validate_password(Password, req.verifieduser)
            if (oldpassword === true) {
                const salt = await bcrypt.genSalt(10)
                const hash = await bcrypt.hash(NewPassword, salt)
                editeduser.Password = hash
            }
        }

        delete req.body.NewPassword
        delete req.body.Password
        editeduser = { ...editeduser, ...req.body }
        await UserModel.updateOne({ _id: req.verifieduser }, { $set: editeduser })
        return res.json({ error: "" })

    } catch (error) {
        console.log("Error occurred while saving profile data")
        return res.json({ error: "Error occurred at backend" })
    }
})

user_router.post("/location", authenticatetoken, async (req, res) => {
    try {
        const location = await opencage.geocode({ q: req.body.location })
        return res.json({ useraddress: location.results[0].components, error: "" })

    } catch (error) {
        console.log(error)
        return res.json({ error: "Sorry your location cannot be fetched" })
    }
})

user_router.put("/location", authenticatetoken, async (req, res) => {

    try {
        let user = await UserModel.findById(req.verifieduser)
        if (user === null) {
            return res.json({ error: "No such user present" })
        }

        const location = await opencage.geocode({ q: req.body.location })
        if (location.results[0].components.country !== "India" || location.results[0].components.state === undefined) {
            return res.json({ error: "Sorry we do not serve this area" })
        }

        await UserModel.updateOne({ _id: req.verifieduser }, { $set: { Location: req.body.Location } })
        return res.json({ error: "" })
    }

    catch (error) {
        console.log("Error occurred while saving new user location")
        return res.json({ error: "Sorry your location could not be saved as some error occurred. Please try again later" })
    }
})

user_router.delete("/", authenticatetoken, async (req, res) => {
    try {
        await UserModel.findByIdAndDelete(req.verifieduser)
        res.json({ success: true })
    } catch {
        res.status(400).send("Sorry your account could not be deleted")
    }
})

module.exports = user_router