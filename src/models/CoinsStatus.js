// models/Coin.js
import mongoose from 'mongoose';

const coinStatusSchema = new mongoose.Schema({
    coinId: { type: mongoose.Schema.Types.ObjectId, ref: 'coin', required: true },
    status: { type: String, required: true },
});

const CoinStatus = mongoose.model('CoinStatus', coinStatusSchema);

export default CoinStatus;
