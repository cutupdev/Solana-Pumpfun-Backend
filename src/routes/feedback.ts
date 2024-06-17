import express from "express";
import Message from "../models/Feedback";
import { Date, Types } from "mongoose";
import { AuthRequest, auth } from "../middleware/authorization";

const router = express.Router();

// @route   GET /message/:
// @desc    Get messages about this coin
// @access  Public
router.get('/coin/:coinId', (req, res) => {
    const coinId: string = req.params.coinId;
    console.log(coinId)
    Message.find({ coinId }).populate('coinId','sender').then(messages => res.status(200).send(messages))
        .catch(err => res.status(400).json(err));
})

// @route   GET /message/:
// @desc    Get messages about this user
// @access  Public
router.get('/user/:userId', (req, res) => {
    const sender: string = req.params.userId;
    Message.find({ sender }).then(messages => res.status(200).send(messages))
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