import express from "express";
import Joi, { string } from "joi";
import Coin from "../models/Coin";
import { AuthRequest, auth } from "../middleware/authorization";
import { createToken, swapTx } from "../program/web3";
import { Types } from "mongoose";
import { Keypair, PublicKey } from "@solana/web3.js";
import CoinStatus from "../models/CoinsStatus";


const router = express.Router();

// @route   GET /coin/
// @desc    Get all created coins
// @access  Public
router.get('/', async (req, res) => {
    const coins = await Coin.find({}).populate('creator')
    return res.status(200).send(coins)
})
// @route   GET /coin/:userID
// @desc    Get coins created by userID
// @access  Public
router.get('/:id', (req, res) => {
    const id = req.params.id;
    Coin.findOne({ _id: id }).populate('creator').then(users => res.status(200).send(users)).catch(err => res.status(400).json('Nothing'))
})


// @route   GET /coin/user/:userID
// @desc    Get coins created by userID
// @access  Public
router.get('/user/:userID', (req, res) => {
    const creator = req.params.userID;
    Coin.find({ creator }).populate('creator').then(users => res.status(200).send(users)).catch(err => res.status(400).json('Nothing'))
})

// @route   POST /coin
// @desc    Create coin
// @access  Public
router.post('/', async (req, res) => {
    console.log("++++++++Create coin++++++++++", req.body.creator)
    const { body } = req;
    const UserSchema = Joi.object().keys({
        creator: Joi.string().required(),
        name: Joi.string().required(),
        ticker: Joi.string().required(),
        description: Joi.string(),
        url: Joi.string().required(),

        // amount: Joi.number().required()
    });
    // console.log(req.user);
    const inputValidation = UserSchema.validate(body);
    // console.log(inputValidation)
    if (inputValidation.error) {
        return res.status(400).json({ error: inputValidation.error.details[0].message })
    }
    // Create Token with UMI
    const token:any = await createToken({
        name: req.body.name,
        ticker: req.body.ticker,
        url: req.body.url,
        creator: req.body.creator,
        description: req.body.description,
    });
    console.log("token====", token)
    if(token =="transaction failed") res.status(400).json("fialed")
        res.status(200).send(token)
    // const name = body.name;
    // const coinName = await Coin.findOne({ name })
    // if (coinName) return res.status(400).json("Name is invalid")
    // const coinData = await Coin.findOne({ token })
    // if (coinData) return res.status(400).json("This coin is already created.")
    
})

// @route   POST /coin/:coinId
// @desc    Update coin
// @access  Public
router.post('/:coinId', (req, res) => {
    const { body } = req;
    const coinId = req.params.coinId;
    console.log(body)
    Coin.updateOne({ _id: coinId }, { $set: body })
        .then((updateCoin) => {
            console.log(updateCoin)
            res.status(200).send(updateCoin)
        })
        .catch(err => res.status(400).json("update is failed!!"));
})

export default router;
