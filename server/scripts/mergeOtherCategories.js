import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

const mergeCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Snapshot categories before
    const categoriesBefore = await Category.find({}).sort({ name: 1 });
    console.log(`\n=== STEP 1: CATEGORIES BEFORE MIGRATION (${categoriesBefore.length} categories) ===`);
    categoriesBefore.forEach((c, idx) => {
      console.log(`  ${idx + 1}. [ID: ${c._id}] "${c.name}"`);
    });

    // 2. Find target "Other" and source "Other / Needs Review"
    const otherCategory = await Category.findOne({ name: { $regex: /^Other$/i } });
    const otherReviewCategory = await Category.findOne({ name: { $regex: /Other\s*\/\s*Needs\s*Review/i } });

    if (!otherCategory) {
      throw new Error('Target category "Other" not found in database!');
    }
    if (!otherReviewCategory) {
      throw new Error('Source category "Other / Needs Review" not found in database!');
    }

    if (otherCategory._id.toString() === otherReviewCategory._id.toString()) {
      throw new Error('Target and source category IDs are identical! Aborting for safety.');
    }

    // 3. Count products before
    const totalProductsBefore = await Product.countDocuments({});
    const otherProductsBefore = await Product.countDocuments({ category: otherCategory._id });
    const otherReviewProductsBefore = await Product.countDocuments({ category: otherReviewCategory._id });

    console.log('\n=== STEP 2: PRE-MIGRATION COUNTS ===');
    console.log(`- Total products in database: ${totalProductsBefore}`);
    console.log(`- Target "Other" [ID: ${otherCategory._id}]: ${otherProductsBefore} products`);
    console.log(`- Source "Other / Needs Review" [ID: ${otherReviewCategory._id}]: ${otherReviewProductsBefore} products`);

    // 4. Perform reassignment
    console.log('\n=== STEP 3: REASSIGNING PRODUCTS ===');
    const updateResult = await Product.updateMany(
      { category: otherReviewCategory._id },
      { $set: { category: otherCategory._id } }
    );

    console.log(`- Matched count: ${updateResult.matchedCount}`);
    console.log(`- Modified count: ${updateResult.modifiedCount}`);

    if (updateResult.modifiedCount !== otherReviewProductsBefore) {
      console.warn(`Warning: Expected to update ${otherReviewProductsBefore} products, but modified ${updateResult.modifiedCount}`);
    }

    // 5. Verify remaining in source
    const remainingInReview = await Product.countDocuments({ category: otherReviewCategory._id });
    console.log(`- Remaining products under "Other / Needs Review": ${remainingInReview}`);

    if (remainingInReview !== 0) {
      throw new Error(`Safety check failed: ${remainingInReview} products still reference "Other / Needs Review". Deletion aborted.`);
    }

    // 6. Delete the empty "Other / Needs Review" category
    console.log('\n=== STEP 4: DELETING EMPTY CATEGORY "Other / Needs Review" ===');
    const deleteResult = await Category.deleteOne({ _id: otherReviewCategory._id });
    console.log(`- Category deleted count: ${deleteResult.deletedCount}`);

    // 7. Verify post-migration state
    const categoriesAfter = await Category.find({}).sort({ name: 1 });
    const totalProductsAfter = await Product.countDocuments({});
    const otherProductsAfter = await Product.countDocuments({ category: otherCategory._id });
    const checkDeleted = await Category.findOne({ name: { $regex: /Other\s*\/\s*Needs\s*Review/i } });
    const otherCount = await Category.countDocuments({ name: { $regex: /^Other$/i } });

    console.log(`\n=== STEP 5: CATEGORIES AFTER MIGRATION (${categoriesAfter.length} categories) ===`);
    categoriesAfter.forEach((c, idx) => {
      console.log(`  ${idx + 1}. [ID: ${c._id}] "${c.name}"`);
    });

    console.log('\n=== FINAL VERIFICATION & REPORT ===');
    console.log(`- Products originally in Other: ${otherProductsBefore}`);
    console.log(`- Products originally in Other / Needs Review: ${otherReviewProductsBefore}`);
    console.log(`- Products successfully moved: ${updateResult.modifiedCount}`);
    console.log(`- Final Other product count: ${otherProductsAfter} (Expected: ${otherProductsBefore + otherReviewProductsBefore})`);
    console.log(`- Total products in DB before: ${totalProductsBefore}, after: ${totalProductsAfter} (No products lost: ${totalProductsBefore === totalProductsAfter})`);
    console.log(`- Total categories before: ${categoriesBefore.length}, after: ${categoriesAfter.length} (Reduced by exactly 1: ${categoriesBefore.length - categoriesAfter.length === 1})`);
    console.log(`- Exactly one "Other" category exists: ${otherCount === 1}`);
    console.log(`- "Other / Needs Review" category exists: ${checkDeleted !== null ? 'YES (Error)' : 'NO (Confirmed deleted)'}`);

    await mongoose.disconnect();
    console.log('\nMigration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

mergeCategories();
