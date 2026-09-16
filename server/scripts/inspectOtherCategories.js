import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const allCategories = await Category.find({}).sort({ name: 1 });
    console.log(`\nTotal categories in database: ${allCategories.length}`);
    console.log('Category list:');
    allCategories.forEach((c, idx) => {
      console.log(`  ${idx + 1}. [ID: ${c._id}] "${c.name}" (isActive: ${c.isActive})`);
    });

    const otherCat = await Category.findOne({ name: { $regex: /^Other$/i } });
    const otherReviewCat = await Category.findOne({ name: { $regex: /Other\s*\/\s*Needs\s*Review/i } });

    console.log('\n--- Category Examination ---');
    if (otherCat) {
      const count = await Product.countDocuments({ category: otherCat._id });
      console.log(`"Other" Category ID: ${otherCat._id}, Name: "${otherCat.name}", Products count: ${count}`);
    } else {
      console.log('"Other" Category NOT found!');
    }

    if (otherReviewCat) {
      const count = await Product.countDocuments({ category: otherReviewCat._id });
      console.log(`"Other / Needs Review" Category ID: ${otherReviewCat._id}, Name: "${otherReviewCat.name}", Products count: ${count}`);
    } else {
      console.log('"Other / Needs Review" Category NOT found!');
    }

    const totalProducts = await Product.countDocuments({});
    console.log(`\nTotal products in database: ${totalProducts}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
