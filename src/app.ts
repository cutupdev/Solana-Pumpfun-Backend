import express from 'express';
import 'dotenv/config.js';
import bodyParser from 'body-parser'
import cors from 'cors'
import userRoutes from './routes/user'
import coinRoutes from './routes/coin'
import messageRoutes from './routes/feedback'
import coinTradeRoutes from './routes/coinTradeRoutes'
import chartRoutes from './routes/chart'
import { init } from './db/dbConncetion';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000'
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

init()

app.set('port', 5000)

app.use('/user/', userRoutes);
app.use('/coin/', coinRoutes);
app.use('/feedback/', messageRoutes);
app.use('/cointrade/', coinTradeRoutes)
app.use('/chart/', chartRoutes)


export  default app;