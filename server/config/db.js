const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async (uri) => {
  if (!uri) throw new Error('MONGO_URI missing');
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('MongoDB connected');
};

module.exports = connectDB;
