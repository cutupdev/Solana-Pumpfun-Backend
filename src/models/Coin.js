// models/Coin.js
import mongoose from 'mongoose';

const coinSchema = new mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    name: { type: String, required: true, },
    ticker: { type: String, required: true, },
    description: { type: String },
    image: { type: String },
    feedback: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId, ref: 'coin'
        },
        msg: { type: String, }
    }]


});

const Coin = mongoose.model('Coin', coinSchema);

export default Coin;
