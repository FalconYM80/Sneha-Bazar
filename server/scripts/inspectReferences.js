import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Purchase from '../models/Purchase.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const targetId = new mongoose.Types.ObjectId('6aa6a6af7f1a78db904230f5');

    console.log('Checking references to "Other / Needs Review" (_id: 6aa6a6af7f1a78db904230f5)...');
    
    // Check cart (if any category field exists in cart items)
    const carts = await Cart.find({ 'items.category': targetId });
    console.log(`Carts referencing category: ${carts.length}`);

    // Check orders (if any category field exists in orders)
    const orders = await Order.find({ 'items.category': targetId });
    console.log(`Orders referencing category: ${orders.length}`);

    // Check purchases (if any category field exists in purchases)
    const purchases = await Purchase.find({ 'items.category': targetId });
    console.log(`Purchases referencing category: ${purchases.length}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
