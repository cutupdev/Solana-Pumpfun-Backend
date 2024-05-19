import express from 'express';
import 'dotenv/config.js';
import bodyParser from 'body-parser'

import userRoutes from './src/routes/user'
import coinRoutes from './src/routes/coin'
import coinStatusRoutes from './src/routes/coinStatus'
import messageRoutes from './src/routes/message'
import { init } from './src/db/dbConncetion';


const app = express();
const PORT = process.env.PORT || 3000; 

app.use(bodyParser.json());
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));

init()
app.get('/', (req, res) => {
  res.send('Pump backend is running! 🚀');
});

app.use('/users/', userRoutes);
app.use('/coin/', coinRoutes);
app.use('/coinstatus/',coinStatusRoutes);
app.use('/message/',messageRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
