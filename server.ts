import express from 'express';
import 'dotenv/config.js';
import bodyParser from 'body-parser'
import cors from 'cors'
import userRoutes from './src/routes/user'
import coinRoutes from './src/routes/coin'
import messageRoutes from './src/routes/feedback'
import coinTradeRoutes from './src/routes/coinTradeRoutes'
import { init } from './src/db/dbConncetion';
import { Keypair, PublicKey } from '@solana/web3.js';
import { createRaydium, initializeTx, swapTx } from './src/program/web3';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000'
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

init()


// http and swap test
app.get('/', async (req, res) => {
  console.log("WebHook Test")
  res.send('Pump backend is running! 🚀');
});
// app.post('/', async (req, res) => {
//   const mint1 = new PublicKey('9tdPfbH1GteCXJdY3jH5FLagEG4mc568CebDCWMxnMAa')
//   // await initializeTx();
//   if (req.body.style == "raydium") {
//     const result = await createRaydium(mint1);
//     console.log("Sucess!!")
//   } else if (req.body.style == "swap") {
//     console.log("swap test:::::::::::::::")
//     const user = Keypair.generate();
//     console.log(user.publicKey.toBase58())
//     const result = await swapTx(mint1, user)
//     console.log("swap result", result)
//   } 
// })
app.use('/user/', userRoutes);
app.use('/coin/', coinRoutes);
app.use('/feedback/', messageRoutes);
app.use('/cointrade/', coinTradeRoutes)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
