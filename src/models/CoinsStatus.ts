// models/Coin.js
import { required } from 'joi';
import mongoose from 'mongoose';

const coinStatusSchema = new mongoose.Schema({
    coinId: { type: mongoose.Schema.Types.ObjectId, ref: 'coin', required: true },
    record: [{
        holder: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
        holdingStatus: { type: Boolean, required: true },
        time: { type: Date, default: Date.now},
    }
    ]
});

const CoinStatus = mongoose.model('CoinStatus', coinStatusSchema);

export default CoinStatus;
