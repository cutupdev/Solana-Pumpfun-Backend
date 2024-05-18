import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config.js';
import userRoutes from './src/routes/user.js'
import bodyParser from 'body-parser'

const app = express();
const PORT = process.env.PORT || 3000; 

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

app.use(bodyParser.json());
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Pump backend is running! 🚀');
});

app.use('/api/users/', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
