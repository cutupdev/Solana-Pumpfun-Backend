import express from 'express';
import 'dotenv/config.js';
import bodyParser from 'body-parser'

import userRoutes from './src/routes/user'
import coinRoutes from './src/routes/coin'
import messageRoutes from './src/routes/message'
import { init } from './src/db/dbConncetion';
import { Keypair, PublicKey } from '@solana/web3.js';
import { swapTx } from './src/program/web3';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

init()


// http and swap test
app.get('/', async (req, res) => {

  console.log("swap test:::::::::::::::")
  const mint1 = new PublicKey('5ub68BwusEqW3Ug6dW6jvhHov2ornz2Hr7C2eHvw5msk')
  const user = Keypair.generate();
  console.log(user.publicKey.toBase58())
  const result = await swapTx(mint1 ,user  ) 
  console.log("swap result", result)

  console.log("WebHook Test")
  res.send('Pump backend is running! 🚀');
});

app.use('/users/', userRoutes);
app.use('/coin/', coinRoutes);
app.use('/message/', messageRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
