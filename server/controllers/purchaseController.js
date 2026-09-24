import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

// Helper function to safely execute transaction or fallback
const runTransaction = async (workFn) => {
  let session = null;
  if (
    mongoose.connection &&
    mongoose.connection.readyState === 1 &&
    typeof mongoose.connection.client?.topology?.hasSessionSupport === "function" &&
    mongoose.connection.client.topology.hasSessionSupport()
  ) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }
  }

  try {
    const result = await workFn(session);
    if (session) {
      await session.commitTransaction();
    }
    return result;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

// Create a new purchase record or batch multi-item invoice purchases and update inventory stock
export const createPurchase = async (req, res) => {
  try {
    const { items, invoiceNumber, distributor, supplier, purchaseDate } = req.body;

    // Handle batch multi-item invoice entry workflow
    if (Array.isArray(items)) {
      const invNum = invoiceNumber ? invoiceNumber.trim() : "";
      const supplierName = (distributor || supplier || "").trim();

      if (!invNum) {
        return res.status(400).json({
          success: false,
          message: "Invoice number is required",
        });
      }

      if (!supplierName) {
        return res.status(400).json({
          success: false,
          message: "Distributor / Supplier is required",
        });
      }

      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one product item is required for purchase invoice",
        });
      }

      // Validate each item before transaction
      const preparedItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const { product: productIdInput, barcode, itemName, quantityPurchased, quantity, purchaseAmount, sellingPrice, mrp } = item;
        const itemQty = Number(quantityPurchased !== undefined ? quantityPurchased : quantity);

        const nameStr = itemName ? String(itemName).trim() : "";
        if (!nameStr) {
          return res.status(400).json({
            success: false,
            message: `Item name is required for item #${i + 1}`,
          });
        }

        if (isNaN(itemQty) || !Number.isInteger(itemQty) || itemQty < 1) {
          return res.status(400).json({
            success: false,
            message: `Quantity for "${nameStr}" must be a positive integer (minimum 1)`,
          });
        }

        const parsedPurchaseAmount = Number(purchaseAmount);
        const parsedSellingPrice = Number(sellingPrice);
        const parsedMrp = Number(mrp);

        if (isNaN(parsedPurchaseAmount) || parsedPurchaseAmount < 0) {
          return res.status(400).json({
            success: false,
            message: `Purchase amount for "${nameStr}" cannot be negative`,
          });
        }

        if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
          return res.status(400).json({
            success: false,
            message: `Selling price for "${nameStr}" cannot be negative`,
          });
        }

        if (isNaN(parsedMrp) || parsedMrp < 0) {
          return res.status(400).json({
            success: false,
            message: `MRP for "${nameStr}" cannot be negative`,
          });
        }

        preparedItems.push({
          productIdInput,
          barcode,
          itemName: nameStr,
          quantityPurchased: itemQty,
          purchaseAmount: parsedPurchaseAmount,
          sellingPrice: parsedSellingPrice,
          mrp: parsedMrp,
        });
      }

      // Execute batch save in transaction
      const createdPurchases = await runTransaction(async (session) => {
        const opts = session ? { session } : {};
        const createdDocs = [];

        for (const item of preparedItems) {
          let targetProduct = null;
          if (item.productIdInput && mongoose.Types.ObjectId.isValid(item.productIdInput)) {
            targetProduct = await Product.findById(item.productIdInput).session(session || null);
          } else if (item.barcode && typeof item.barcode === "string" && item.barcode.trim() !== "") {
            targetProduct = await Product.findOne({ barcode: item.barcode.trim(), isActive: true }).session(session || null);
          } else if (item.itemName) {
            targetProduct = await Product.findOne({ name: item.itemName, isActive: true }).session(session || null);
          }

          const finalBarcode = item.barcode && typeof item.barcode === "string" && item.barcode.trim() !== ""
            ? item.barcode.trim()
            : (targetProduct ? targetProduct.barcode : undefined);

          const purchasePayload = {
            invoiceNumber: invNum,
            product: targetProduct ? targetProduct._id : undefined,
            barcode: finalBarcode,
            itemName: item.itemName,
            supplier: supplierName,
            quantityPurchased: item.quantityPurchased,
            purchaseAmount: item.purchaseAmount,
            sellingPrice: item.sellingPrice,
            mrp: item.mrp,
            purchaseDate: purchaseDate || Date.now(),
          };

          const docs = await Purchase.create([purchasePayload], opts);
          const purchaseDoc = docs[0];

          if (targetProduct) {
            await Product.findByIdAndUpdate(
              targetProduct._id,
              { $inc: { stockQuantity: item.quantityPurchased } },
              { new: true, ...opts }
            );
          }

          createdDocs.push(purchaseDoc);
        }

        return createdDocs;
      });

      const populatedPurchases = await Purchase.find({
        _id: { $in: createdPurchases.map((doc) => doc._id) },
      }).populate("product", "name company barcode sellingPrice mrp stockQuantity unit image");

      return res.status(201).json({
        success: true,
        message: "Invoice purchase records created successfully",
        data: populatedPurchases,
      });
    }

    // Handle single item purchase workflow (compatibility)
    const { product: productIdInput, barcode, itemName, supplier: singleSupplier, quantityPurchased, purchaseAmount, sellingPrice, mrp, purchaseDate: singlePurchaseDate } = req.body;

    // Validate required fields
    if (!itemName || typeof itemName !== "string" || itemName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Item name is required",
      });
    }

    const supplierName = (singleSupplier || distributor || supplier || "").trim();
    if (!supplierName) {
      return res.status(400).json({
        success: false,
        message: "Supplier is required",
      });
    }

    if (quantityPurchased === undefined || quantityPurchased === null || quantityPurchased === "") {
      return res.status(400).json({
        success: false,
        message: "Quantity purchased is required",
      });
    }

    const qty = Number(quantityPurchased);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity purchased must be a positive integer (minimum 1)",
      });
    }

    if (purchaseAmount === undefined || purchaseAmount === null || purchaseAmount === "") {
      return res.status(400).json({
        success: false,
        message: "Purchase amount is required",
      });
    }

    if (sellingPrice === undefined || sellingPrice === null || sellingPrice === "") {
      return res.status(400).json({
        success: false,
        message: "Selling price is required",
      });
    }

    if (mrp === undefined || mrp === null || mrp === "") {
      return res.status(400).json({
        success: false,
        message: "MRP is required",
      });
    }

    // Validate numeric values
    const parsedPurchaseAmount = Number(purchaseAmount);
    const parsedSellingPrice = Number(sellingPrice);
    const parsedMrp = Number(mrp);

    if (isNaN(parsedPurchaseAmount) || parsedPurchaseAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase amount cannot be negative",
      });
    }

    if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be negative",
      });
    }

    if (isNaN(parsedMrp) || parsedMrp < 0) {
      return res.status(400).json({
        success: false,
        message: "MRP cannot be negative",
      });
    }

    // Resolve product
    let targetProduct = null;

    if (productIdInput && mongoose.Types.ObjectId.isValid(productIdInput)) {
      targetProduct = await Product.findById(productIdInput);
    } else if (barcode && typeof barcode === "string" && barcode.trim() !== "") {
      targetProduct = await Product.findOne({ barcode: barcode.trim(), isActive: true });
    } else if (itemName && typeof itemName === "string" && itemName.trim() !== "") {
      targetProduct = await Product.findOne({ name: itemName.trim(), isActive: true });
    }

    const finalBarcode = barcode && typeof barcode === "string" && barcode.trim() !== ""
      ? barcode.trim()
      : (targetProduct ? targetProduct.barcode : undefined);

    const purchasePayload = {
      invoiceNumber: invoiceNumber ? invoiceNumber.trim() : undefined,
      product: targetProduct ? targetProduct._id : undefined,
      barcode: finalBarcode,
      itemName: itemName.trim(),
      supplier: supplierName,
      quantityPurchased: qty,
      purchaseAmount: parsedPurchaseAmount,
      sellingPrice: parsedSellingPrice,
      mrp: parsedMrp,
      purchaseDate: singlePurchaseDate || Date.now(),
    };

    const createdPurchase = await runTransaction(async (session) => {
      const opts = session ? { session } : {};
      const docs = await Purchase.create([purchasePayload], opts);
      const purchaseDoc = docs[0];

      if (targetProduct) {
        await Product.findByIdAndUpdate(
          targetProduct._id,
          { $inc: { stockQuantity: qty } },
          { new: true, ...opts }
        );
      }

      return purchaseDoc;
    });

    const populatedPurchase = await Purchase.findById(createdPurchase._id).populate(
      "product",
      "name company barcode sellingPrice mrp stockQuantity unit image"
    );

    res.status(201).json({
      success: true,
      message: "Purchase record created successfully",
      data: populatedPurchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating purchase record",
    });
  }
};

// Get filter options (suppliers and active categories) for admin purchases page
export const getPurchaseFilterOptions = async (req, res) => {
  try {
    const suppliers = await Purchase.distinct("supplier");
    const validSuppliers = suppliers
      .filter((s) => s && typeof s === "string" && s.trim() !== "")
      .sort((a, b) => a.localeCompare(b));

    const categories = await Category.find({ isActive: true }).select("_id name").sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Filter options retrieved successfully",
      data: {
        suppliers: validSuppliers,
        categories,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving filter options",
    });
  }
};

// Get all purchase records with server-side filters and invoice group integrity
export const getPurchases = async (req, res) => {
  try {
    const { search, supplier, distributor, startDate, fromDate, endDate, toDate, category, product } = req.query;

    const filter = {};
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Supplier / Distributor filter
    const supp = (supplier || distributor || "").trim();
    if (supp && supp !== "all" && supp !== "All") {
      filter.supplier = new RegExp("^" + escapeRegex(supp) + "$", "i");
    }

    // Purchase Date Range filter (uses persisted purchaseDate)
    const from = startDate || fromDate;
    const to = endDate || toDate;

    if (from || to) {
      filter.purchaseDate = {};
      if (from) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        filter.purchaseDate.$gte = start;
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.purchaseDate.$lte = end;
      }
    }

    // Category filter
    if (category && category.trim() !== "" && category !== "all" && category !== "All") {
      let catProductIds = [];
      if (mongoose.Types.ObjectId.isValid(category.trim())) {
        const prods = await Product.find({ category: category.trim() }).select("_id");
        catProductIds = prods.map((p) => p._id);
      } else {
        const catDoc = await Category.findOne({ name: new RegExp("^" + escapeRegex(category.trim()) + "$", "i") });
        if (catDoc) {
          const prods = await Product.find({ category: catDoc._id }).select("_id");
          catProductIds = prods.map((p) => p._id);
        }
      }
      if (catProductIds.length > 0) {
        filter.product = { $in: catProductIds };
      } else {
        filter._id = null; // No matching products found for this category
      }
    }

    // Specific product filter
    if (product && product.trim() !== "" && product !== "all" && product !== "All") {
      if (mongoose.Types.ObjectId.isValid(product.trim())) {
        filter.product = product.trim();
      }
    }

    // Search filter across invoiceNumber, itemName, supplier, barcode, or product name
    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");

      const matchingProducts = await Product.find({
        $or: [{ barcode: search.trim() }, { barcode: searchRegex }, { name: searchRegex }],
      }).select("_id");
      const matchingProductIds = matchingProducts.map((p) => p._id);

      const searchConditions = [
        { invoiceNumber: searchRegex },
        { itemName: searchRegex },
        { supplier: searchRegex },
        { barcode: searchRegex },
      ];

      if (matchingProductIds.length > 0) {
        searchConditions.push({ product: { $in: matchingProductIds } });
      }

      filter.$or = searchConditions;
    }

    // Invoice Grouping Integrity (Requirement #10):
    // Find matching invoiceNumbers so full invoice groups are preserved intact
    const isFiltered = Object.keys(filter).length > 0;
    let finalQueryFilter = filter;

    if (isFiltered) {
      const matchingInvoiceNumbers = await Purchase.distinct("invoiceNumber", filter);
      const validInvoiceNumbers = matchingInvoiceNumbers.filter((n) => n && typeof n === "string" && n.trim() !== "");

      if (validInvoiceNumbers.length > 0) {
        finalQueryFilter = {
          $or: [
            { invoiceNumber: { $in: validInvoiceNumbers } },
            filter,
          ],
        };
      }
    }

    const purchases = await Purchase.find(finalQueryFilter)
      .populate("product", "name company barcode sellingPrice mrp stockQuantity unit image category")
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      message: "Purchases retrieved successfully",
      data: purchases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving purchases",
    });
  }
};

// Get a single purchase record by ID
export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    const purchase = await Purchase.findById(id).populate(
      "product",
      "name company barcode sellingPrice mrp stockQuantity unit image"
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Purchase record retrieved successfully",
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving purchase record",
    });
  }
};

// Update a purchase record and adjust inventory stock by difference
export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceNumber, distributor, product: productIdInput, barcode, itemName, supplier, quantityPurchased, purchaseAmount, sellingPrice, mrp, purchaseDate } = req.body;
    const suppName = supplier !== undefined ? supplier : distributor;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    // Check if purchase exists
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found",
      });
    }

    // Validate itemName if provided
    if (itemName !== undefined && (typeof itemName !== "string" || itemName.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Item name cannot be empty",
      });
    }

    // Validate supplier if provided
    if (suppName !== undefined && (typeof suppName !== "string" || suppName.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Supplier cannot be empty",
      });
    }

    // Validate quantityPurchased if provided
    let qty;
    if (quantityPurchased !== undefined) {
      qty = Number(quantityPurchased);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity purchased must be a positive integer (minimum 1)",
        });
      }
    }

    // Validate numeric values if provided
    if (purchaseAmount !== undefined) {
      const parsedAmount = Number(purchaseAmount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Purchase amount cannot be negative",
        });
      }
    }

    if (sellingPrice !== undefined) {
      const parsedSellingPrice = Number(sellingPrice);
      if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Selling price cannot be negative",
        });
      }
    }

    if (mrp !== undefined) {
      const parsedMrp = Number(mrp);
      if (isNaN(parsedMrp) || parsedMrp < 0) {
        return res.status(400).json({
          success: false,
          message: "MRP cannot be negative",
        });
      }
    }

    // Resolve old product and new target product
    const oldProductId = purchase.product ? purchase.product.toString() : null;
    const oldQty = purchase.quantityPurchased || 0;
    const newQty = qty !== undefined ? qty : oldQty;

    let newTargetProduct = null;
    if (productIdInput && mongoose.Types.ObjectId.isValid(productIdInput)) {
      newTargetProduct = await Product.findById(productIdInput);
    } else if (barcode && typeof barcode === "string" && barcode.trim() !== "") {
      newTargetProduct = await Product.findOne({ barcode: barcode.trim(), isActive: true });
    } else if (oldProductId) {
      newTargetProduct = await Product.findById(oldProductId);
    } else if (itemName || purchase.itemName) {
      const nameToLook = itemName ? itemName.trim() : purchase.itemName;
      newTargetProduct = await Product.findOne({ name: nameToLook, isActive: true });
    }

    const newProductId = newTargetProduct ? newTargetProduct._id.toString() : null;

    // Check stock adjustments before executing
    if (oldProductId && newProductId && oldProductId === newProductId) {
      // Same product, quantity difference
      const qtyDiff = newQty - oldQty;
      if (newTargetProduct && (newTargetProduct.stockQuantity + qtyDiff) < 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot update purchase. Current stock for ${newTargetProduct.name} (${newTargetProduct.stockQuantity}) cannot accommodate quantity reduction to ${newQty}.`,
        });
      }
    } else {
      // Different product or product reassignment
      if (oldProductId && oldQty > 0) {
        const oldProduct = await Product.findById(oldProductId);
        if (oldProduct && oldProduct.stockQuantity < oldQty) {
          return res.status(400).json({
            success: false,
            message: `Cannot update purchase. Current stock for ${oldProduct.name} (${oldProduct.stockQuantity}) is less than original purchase quantity (${oldQty}).`,
          });
        }
      }
    }

    const finalBarcode = barcode && typeof barcode === "string" && barcode.trim() !== ""
      ? barcode.trim()
      : (newTargetProduct ? newTargetProduct.barcode : purchase.barcode);

    const updatePayload = {
      ...(invoiceNumber !== undefined && { invoiceNumber: invoiceNumber.trim() }),
      ...(newTargetProduct && { product: newTargetProduct._id }),
      ...(finalBarcode && { barcode: finalBarcode }),
      ...(itemName !== undefined && { itemName: itemName.trim() }),
      ...(suppName !== undefined && { supplier: suppName.trim() }),
      ...(qty !== undefined && { quantityPurchased: qty }),
      ...(purchaseAmount !== undefined && { purchaseAmount: Number(purchaseAmount) }),
      ...(sellingPrice !== undefined && { sellingPrice: Number(sellingPrice) }),
      ...(mrp !== undefined && { mrp: Number(mrp) }),
      ...(purchaseDate !== undefined && { purchaseDate }),
    };

    const updatedPurchaseDoc = await runTransaction(async (session) => {
      const opts = session ? { session } : {};

      const updated = await Purchase.findByIdAndUpdate(
        id,
        updatePayload,
        { new: true, runValidators: true, ...opts }
      );

      // Perform stock updates
      if (oldProductId && newProductId && oldProductId === newProductId) {
        const qtyDiff = newQty - oldQty;
        if (qtyDiff !== 0) {
          await Product.findByIdAndUpdate(
            oldProductId,
            { $inc: { stockQuantity: qtyDiff } },
            { ...opts }
          );
        }
      } else {
        if (oldProductId && oldQty > 0) {
          await Product.findByIdAndUpdate(
            oldProductId,
            { $inc: { stockQuantity: -oldQty } },
            { ...opts }
          );
        }
        if (newProductId && newQty > 0) {
          await Product.findByIdAndUpdate(
            newProductId,
            { $inc: { stockQuantity: newQty } },
            { ...opts }
          );
        }
      }

      return updated;
    });

    const populatedPurchase = await Purchase.findById(updatedPurchaseDoc._id).populate(
      "product",
      "name company barcode sellingPrice mrp stockQuantity unit image"
    );

    res.status(200).json({
      success: true,
      message: "Purchase record updated successfully",
      data: populatedPurchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating purchase record",
    });
  }
};

// Delete a purchase record and reverse inventory stock
export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    // Check if purchase exists
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found",
      });
    }

    const productId = purchase.product ? purchase.product.toString() : null;
    const qtyPurchased = purchase.quantityPurchased || 0;

    let targetProduct = null;
    if (productId) {
      targetProduct = await Product.findById(productId);
    } else if (purchase.itemName) {
      targetProduct = await Product.findOne({ name: purchase.itemName.trim(), isActive: true });
    }

    // Validate negative stock protection before deletion
    if (targetProduct && qtyPurchased > 0) {
      if (targetProduct.stockQuantity < qtyPurchased) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete purchase. Current stock for ${targetProduct.name} (${targetProduct.stockQuantity}) is less than purchase quantity (${qtyPurchased}).`,
        });
      }
    }

    await runTransaction(async (session) => {
      const opts = session ? { session } : {};

      if (targetProduct && qtyPurchased > 0) {
        await Product.findByIdAndUpdate(
          targetProduct._id,
          { $inc: { stockQuantity: -qtyPurchased } },
          { ...opts }
        );
      }

      await Purchase.findByIdAndDelete(id, opts);
    });

    res.status(200).json({
      success: true,
      message: "Purchase record deleted successfully",
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting purchase record",
    });
  }
};

