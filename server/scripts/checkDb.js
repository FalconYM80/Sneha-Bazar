import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const productCount = await mongoose.connection.db.collection('products').countDocuments();
    console.log('Current product count:', productCount);

    const categories = await mongoose.connection.db.collection('categories').find({}).toArray();
    console.log('Categories:', categories.map(c => c.name));

    await mongoose.disconnect();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkDB();
