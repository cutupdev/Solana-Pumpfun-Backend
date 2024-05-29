import express from "express";
import Joi, { string } from "joi";
import Coin from "../models/Coin";
import { AuthRequest, auth } from "../middleware/authorization";
import { createToken, swapTx } from "../program/web3";
import { Types } from "mongoose";
import { Keypair, PublicKey } from "@solana/web3.js";

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
        reverse2: Joi.number(),
        image: Joi.string(),
        token: Joi.string(),
        reserve1: Joi.number()
    });
    const inputValidation = UserSchema.validate(body);
    if (inputValidation.error) {
        return res.status(400).json({ error: inputValidation.error.details[0].message })
    }

    const name = body.name as string;
    const coinName = await Coin.findOne({ name })
    
    if (coinName) return res.status(400).json("Name is invalid")
    const data = {
        creator: body.creator as Types.ObjectId,
        name,
        ticker: body.ticker as string,
        image: `${process.env.PINATA_GATEWAY_URL}/${body.image}`,
        description: body.description as string,
    }
    const result = await createToken(data);
    console.log(result)
    if (result !== undefined) {
        res.status(200).json(result);
    } 
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
