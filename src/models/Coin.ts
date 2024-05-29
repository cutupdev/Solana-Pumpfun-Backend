// models/Coin.js
import { required } from 'joi';
import mongoose from 'mongoose';

const coinSchema = new mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, },
    ticker: { type: String, required: true, },
    description: { type: String },
    token: { type: String,  },
    reserve2: { type: Number},
    reserve1: { type: Number},
    image: { type: String, required: true }

});

const Coin = mongoose.model('Coin', coinSchema);

export default Coin;
