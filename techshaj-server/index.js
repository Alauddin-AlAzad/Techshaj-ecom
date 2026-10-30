const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express')
const app=express()
const cors= require('cors')
require('dotenv').config()
const port=process.env.PORT || 5000;
// middle ware
app.use(cors());
app.use(express.json())

app.get('/', (req,res)=>{
    res.send("boss is runninh")
})

app.listen( port, ()=>{
    console.log(`Bistro boss is  sitting on port ${port}`)
})

const { MongoClient, ServerApiVersion } = require('mongodb');

const user = encodeURIComponent(process.env.DB_USER);
const pass = encodeURIComponent(process.env.DB_PASS);
const uri = `mongodb+srv://${user}:${pass}@cluster0.gkemlm6.mongodb.net/;`
                                                                                              
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    await client.connect();

    const productsCollection = client.db("techshajDB").collection("products");
    const categoriesCollection = client.db("techshajDB").collection("categories");
    const bannersCollection = client.db("techshajDB").collection("banners");
    const offersCollection = client.db("techshajDB").collection("offers");
    const couponsCollection = client.db("techshajDB").collection("coupons");
    const settingsCollection = client.db("techshajDB").collection("settings");
    const reviewsCollection = client.db("techshajDB").collection("reviews");

    const productProjection = { costPrice: 0, buyingPrice: 0, purchasePrice: 0, supplier: 0, adminNote: 0 };
    const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const categoryIdsFor = async (category) => {
      if (category.parentId) return [category.id];
      const children = await categoriesCollection.find({ parentId: category.id }).project({ id: 1 }).toArray();
      return [category.id, ...children.map((c) => c.id)];
    };
    const sortOptions = {
      newest: { isNew: -1, createdAt: -1, id: -1 },
      "price-asc": { price: 1, id: 1 },
      "price-desc": { price: -1, id: 1 },
      "best-selling": { soldCount: -1, id: 1 },
    };

    // products related api
    app.get("/products", async (req, res) => {
      try {
        const { category, collection, minPrice, maxPrice, inStock, freeDelivery, search, sort } = req.query;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
        const query = {};

        if (category) {
          const cat = await categoriesCollection.findOne({ slug: category });
          if (!cat) return res.send({ products: [], total: 0, page, totalPages: 0 });
          query.categoryId = { $in: await categoryIdsFor(cat) };
        }
        if (collection) query.collections = collection;
        if (minPrice || maxPrice) {
          query.price = {};
          if (!isNaN(parseFloat(minPrice))) query.price.$gte = parseFloat(minPrice);
          if (!isNaN(parseFloat(maxPrice))) query.price.$lte = parseFloat(maxPrice);
        }
        if (inStock === "true") query.stock = { $gt: 0 };
        if (freeDelivery === "true") query.freeDelivery = true;
        if (search?.trim()) {
          const regex = { $regex: escapeRegex(search.trim()), $options: "i" };
          query.$or = [{ name: regex }, { code: regex }];
        }

        const total = await productsCollection.countDocuments(query);
        const products = await productsCollection
          .find(query)
          .project(productProjection)
          .sort(sortOptions[sort] || sortOptions.newest)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
        res.send({ products, total, page, totalPages: Math.ceil(total / limit) });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/products/:slug", async (req, res) => {
      try {
        const product = await productsCollection.findOne({ slug: req.params.slug }, { projection: productProjection });
        if (!product) return res.status(404).send({ message: "Product not found" });
        const category = await categoriesCollection.findOne({ id: product.categoryId });
        const parentCategory = category?.parentId ? await categoriesCollection.findOne({ id: category.parentId }) : null;
        res.send({ ...product, category, parentCategory });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/products/:slug/related", async (req, res) => {
      try {
        const product = await productsCollection.findOne({ slug: req.params.slug });
        if (!product) return res.status(404).send({ message: "Product not found" });
        const related = await productsCollection
          .find({ categoryId: product.categoryId, id: { $ne: product.id } })
          .project(productProjection)
          .sort({ soldCount: -1, id: 1 })
          .limit(10)
          .toArray();
        res.send(related);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // categories related api
    app.get("/categories", async (req, res) => {
      try {
        const categories = await categoriesCollection.find().sort({ id: 1 }).toArray();
        const counts = await productsCollection.aggregate([{ $group: { _id: "$categoryId", count: { $sum: 1 } } }]).toArray();
        const countOf = (id) => counts.find((c) => c._id === id)?.count ?? 0;
        res.send(
          categories.map((c) => ({
            ...c,
            productCount: c.parentId
              ? countOf(c.id)
              : countOf(c.id) + categories.filter((child) => child.parentId === c.id).reduce((sum, child) => sum + countOf(child.id), 0),
          }))
        );
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // banners, offers and settings related api
    app.get("/banners", async (req, res) => {
      try {
        const banners = await bannersCollection.find({ active: true }).sort({ id: 1 }).toArray();
        const ofType = (type) => banners.filter((b) => b.type === type).map(({ type, ...b }) => b);
        res.send({ hero: ofType("hero"), side: ofType("side"), promo: ofType("promo"), menu: ofType("menu")[0] ?? null });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/offers", async (req, res) => {
      try {
        const sales = await offersCollection.find({ type: "flashSale", active: { $ne: false } }).sort({ endsAt: 1 }).toArray();
        const sale = sales.find((s) => !s.endsAt || new Date(s.endsAt) > new Date());
        const coupons = await couponsCollection
          .find({ active: { $ne: false }, isPublic: { $ne: false } })
          .project({ usedCount: 0, usageLimit: 0, usedBy: 0 })
          .toArray();
        const flashSale = sale
          ? { ...sale, products: await productsCollection.find({ id: { $in: sale.productIds } }).project(productProjection).toArray() }
          : null;
        res.send({ coupons, flashSale });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/settings", async (req, res) => {
      try {
        const settings = await settingsCollection.findOne({});
        if (!settings) return res.status(404).send({ message: "Settings not found" });
        const { store, shippingZones, freeShippingThreshold } = settings;
        res.send({ ...store, freeShippingThreshold, shippingZones, shipping: { zones: shippingZones } });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // reviews related api
    app.get("/reviews", async (req, res) => {
      try {
        const productId = Number(req.query.productId);
        if (!req.query.productId || isNaN(productId)) return res.status(400).send({ message: "productId is required" });
        const reviews = await reviewsCollection
          .find({ productId, status: { $nin: ["pending", "rejected"] } })
          .project({ phone: 0, email: 0 })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(reviews);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
    // await client.close();
  }
}

run().catch(console.dir);