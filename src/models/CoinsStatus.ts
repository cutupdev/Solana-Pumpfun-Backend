// models/Coin.js
import { number, required } from 'joi';
import mongoose from 'mongoose';

const coinStatusSchema = new mongoose.Schema({
    coinId: { type: mongoose.Schema.Types.ObjectId, ref: 'coin', required: true },
    record: [{
        holder: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
        holdingStatus: { type: Number, required: true },
        time: { type: Date, default: Date.now },
        amount: { type: Number }
    }
    ]
});

const CoinStatus = mongoose.model('CoinStatus', coinStatusSchema);

export default CoinStatus;
