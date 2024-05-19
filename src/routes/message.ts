import express from "express";
import Message from "../models/message";
import { Date, Types } from "mongoose";

const router = express.Router();

// @route   GET /message/:
// @desc    Get messages about this coin
// @access  Public
router.get('/:coinId', (req, res) => {
    const coinId: string = req.params.coinId;
    Message.find({ coinId }).then(messages => res.status(200).send(messages))
        .catch(err => res.status(400).json(err));
})

// @route   POST /message/
// @desc    Save new Message
// @access  Public
router.post('/', async (req, res) => {
    const { body } = req;
    try {
        const newMsg = new Message(body);
        const messages = await newMsg.save()
        return res.status(200).send(messages)
    } catch (err) {
        return res.status(400).json(err)
    }
})

export default router;