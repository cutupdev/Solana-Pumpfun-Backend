// models/Coin.js
import { required } from 'joi';
import mongoose from 'mongoose';

const coinSchema = new mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, },
    ticker: { type: String, required: true, },
    description: { type: String },
    token: { type: String, required: true },
    price: { type: Number, requried: true },
    amount: { type: Number, required: true },
    image: { type: String }

});

const Coin = mongoose.model('Coin', coinSchema);

export default Coin;
