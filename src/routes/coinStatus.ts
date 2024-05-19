import express from "express";
import Joi from "joi";
import CoinStatus from "../models/CoinsStatus";

const router = express.Router();

// @route   GET /coinStatus/:coinID
// @desc    Get all status of coin bought and sold
// @access  Public
router.get('/:coinId', (req, res) => {
    const id = req.params.coinId;
    CoinStatus.findOne({ coinId: id }).then(coinStatus => res.status(200).send(coinStatus)).catch(err => res.status(400).json('Nothing'))
})

// @route   POST /coin
// @desc    Create coin
// @access  Public
router.post('/:coinId', async (req, res) => {
    const { body } = req;
    console.log(body)
    const UserSchema = Joi.object().keys({
        holder: Joi.string().required(),
        holdingStatus: Joi.boolean().required(),
    });
    const inputValidation = UserSchema.validate(body);
    if (inputValidation.error) {
        return res.status(400).json({ error: inputValidation.error.details[0].message })
    }
    const coinId = req.params.coinId;
    try {
        const updatedDocument = await CoinStatus.findOneAndUpdate(
             {coinId},
            { $push: { record: body } },
            { new: true, upsert: true }
        );
        console.log(updatedDocument)
        res.status(200).send(updatedDocument)
    } catch (err) {
        res.status(500).json(err)
    }
})

export default router;
