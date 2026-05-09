const Collection = require('../models/Collection');
const Product = require('../models/Product');

exports.getCollections = async (req, res) => {
  const collections = await Collection.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .select('-products');
  res.json({ success: true, collections });
};

exports.getCollection = async (req, res) => {
  const collection = await Collection.findOne({ slug: req.params.slug, isActive: true })
    .populate({ path: 'products', match: { status: 'active' }, select: 'name slug images price comparePrice avgRating numReviews' });
  if (!collection) return res.status(404).json({ success: false, message: 'Collection not found' });
  res.json({ success: true, collection });
};

exports.createCollection = async (req, res) => {
  const collection = await Collection.create(req.body);
  res.status(201).json({ success: true, collection });
};

exports.updateCollection = async (req, res) => {
  const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!collection) return res.status(404).json({ success: false, message: 'Collection not found' });
  res.json({ success: true, collection });
};

exports.deleteCollection = async (req, res) => {
  await Collection.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Collection deleted' });
};

exports.addProductToCollection = async (req, res) => {
  const collection = await Collection.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { products: req.body.productId } },
    { new: true }
  );
  res.json({ success: true, collection });
};

exports.removeProductFromCollection = async (req, res) => {
  const collection = await Collection.findByIdAndUpdate(
    req.params.id,
    { $pull: { products: req.params.productId } },
    { new: true }
  );
  res.json({ success: true, collection });
};

exports.getAllCollectionsAdmin = async (req, res) => {
  const collections = await Collection.find().sort({ displayOrder: 1 });
  res.json({ success: true, collections });
};
