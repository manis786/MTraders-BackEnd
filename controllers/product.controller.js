import Product from '../models/product.model.js';

// @desc    Fetch all products with keyword search & category filter
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  const keyword = req.query.keyword ? {
    title: {
      $regex: req.query.keyword,
      $options: 'i'
    }
  } : {};

  const category = req.query.category ? { category: req.query.category } : {};

  const products = await Product.find({ ...keyword, ...category });
  res.json(products);
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const { title, price, discountPrice, description, images, image, category, countInStock } = req.body;

  const product = new Product({
    title,
    price,
    discountPrice: discountPrice || 0,
    description,
    images: images || [image], // Fallback agar single image ho
    image: image || (images && images[0]),
    category,
    countInStock
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const { title, price, discountPrice, description, image, category, countInStock } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.title = title || product.title;
    product.price = price || product.price;
    product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
    product.description = description || product.description;
    product.image = image || product.image;
    product.category = category || product.category;
    product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ message: 'Product removed successfully' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
};
// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added successfully' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
};

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview
};