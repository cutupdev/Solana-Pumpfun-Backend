import express from "express";
import Joi from "joi";
import Coin from "../models/Coin";
import { Schema, Types } from "mongoose";

const router = express.Router();

// @route   GET /coin/
// @desc    Get all created coins
// @access  Public
router.get('/', async (req, res) => {

    const coins = await Coin.find({})
    return res.status(200).send(coins)
})

// @route   GET /coin/:userID
// @desc    Get coins created by userID
// @access  Public
router.get('/:userID', (req, res) => {
    const creator = req.params.userID;
    Coin.find({ creator }).then(users => res.status(200).send(users)).catch(err => res.status(400).json('Nothing'))
})

// @route   POST /coin
// @desc    Create coin
// @access  Public
router.post('/', async (req, res) => {
    const { body } = req;
    const UserSchema = Joi.object().keys({
        creator: Joi.string().required(),
        name: Joi.string().required(),
        ticker: Joi.string().required(),
        description: Joi.string(),
        price: Joi.number().required(),
        image: Joi.string(),
        token: Joi.string().required(),
        amount: Joi.number().required()
    });
    const inputValidation = UserSchema.validate(body);
    // console.log(inputValidation)
    if (inputValidation.error) {
        return res.status(400).json({ error: inputValidation.error.details[0].message })
    }
    const token = body.token;
    const name = body.name;
    try {
        const coinData = await Coin.findOne({ token })
        if (coinData) return res.status(400).json("This coin is already created.")
        const coinName = await Coin.findOne({ name })
        if (coinName) return res.status(400).json("Name is invalid")
        console.log('great')
        const newCoin = new Coin(body);
        const savedCoin = await newCoin.save();
        res.status(200).json(savedCoin);
    } catch (err) {
        res.status(500).json(err)
    }

})

// @route   POST /coin/:coinId
// @desc    Update coin
// @access  Public
router.post('/:coinId', (req, res) => {
    const { body } = req;
    const coinId = req.params.coinId;
    console.log(body)
    Coin.updateOne({ _id: coinId }, { $set:  body })
        .then((updateCoin) => {
            console.log(updateCoin)
            res.status(200).send(updateCoin
            )
        })
        .catch(err => res.status(400).json("update is failed!!"));
})

export default router;

interface CoinInfo {
    creator: Types.ObjectId;
    name: string;
    ticker: string;
    description?: string;
    token: string;
    price: number;
    image?: string;
}