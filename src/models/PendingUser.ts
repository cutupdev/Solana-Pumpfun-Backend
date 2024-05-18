// models/PendingUser.js
import mongoose from 'mongoose';

const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true, },
  wallet: { type: String, required: true,},
  nonce: { type: String, required: true},
  isLedger:{type:Boolean, required: true},
  expiredTime: { type: Date, expires: '20m', default: Date.now}
});

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

export default PendingUser;
