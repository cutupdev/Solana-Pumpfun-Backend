import express from 'express';
import 'dotenv/config.js';
import userRoutes from './src/routes/user'
import bodyParser from 'body-parser'
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

app.use('/api/users/', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
