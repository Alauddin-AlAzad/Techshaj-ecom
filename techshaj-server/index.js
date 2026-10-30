const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express')
const app=express()
const cors= require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
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
    const ordersCollection = client.db("techshajDB").collection("orders");
    const countersCollection = client.db("techshajDB").collection("counters");
    const adminsCollection = client.db("techshajDB").collection("admins");

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
    const phonePattern = /^01[3-9]\d{8}$/;
    const paymentMethods = ["cod", "bkash", "nagad"];
    const checkCoupon = async (code, subtotal) => {
      const trimmed = typeof code === "string" ? code.trim() : "";
      if (!trimmed) return { valid: false, discount: 0, message: "Coupon code is required" };
      const coupon = await couponsCollection.findOne({ code: { $regex: `^${escapeRegex(trimmed)}$`, $options: "i" } });
      if (!coupon || coupon.active === false) return { valid: false, discount: 0, message: "Invalid coupon code" };
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false, discount: 0, message: "This coupon has expired" };
      if (subtotal < (coupon.minOrder ?? 0)) return { valid: false, discount: 0, message: `Minimum order ৳${coupon.minOrder} for this coupon` };
      const amount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
      const discount = Math.min(amount, subtotal);
      return { valid: true, discount, message: "Coupon applied", code: coupon.code };
    };

    // middlewares
    const verifyToken = (req, res, next) => {
      const authorization = req.headers.authorization;
      if (!authorization?.startsWith("Bearer ")) return res.status(401).send({ message: "unauthorized access" });
      const token = authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error || !decoded?.email) return res.status(401).send({ message: "unauthorized access" });
        req.decoded = { email: decoded.email };
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      try {
        const admin = await adminsCollection.findOne({ email: req.decoded?.email }, { projection: { password: 0 } });
        if (!admin) return res.status(403).send({ message: "forbidden access" });
        req.admin = admin;
        next();
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    };

    // jwt related api
    app.post("/jwt", async (req, res) => {
      try {
        const { email, password } = req.body ?? {};
        if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
          return res.status(401).send({ message: "Invalid email or password" });
        }
        const admin = await adminsCollection.findOne({ email: { $regex: `^${escapeRegex(email.trim())}$`, $options: "i" } });
        const match = admin?.password ? await bcrypt.compare(password, admin.password) : false;
        if (!match) return res.status(401).send({ message: "Invalid email or password" });
        const token = jwt.sign({ email: admin.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "7d" });
        res.send({ token });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // admin related api
    app.get("/admin/me", verifyToken, verifyAdmin, async (req, res) => {
      try {
        res.send({ name: req.admin.name ?? null, email: req.admin.email });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.post("/admin/change-password", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body ?? {};
        if (typeof currentPassword !== "string" || !currentPassword) return res.status(400).send({ message: "Current password is required" });
        if (typeof newPassword !== "string" || newPassword.length < 8) return res.status(400).send({ message: "New password must be at least 8 characters" });
        const admin = await adminsCollection.findOne({ _id: req.admin._id });
        const match = admin?.password ? await bcrypt.compare(currentPassword, admin.password) : false;
        if (!match) return res.status(400).send({ message: "Current password is incorrect" });
        const hash = await bcrypt.hash(newPassword, 10);
        await adminsCollection.updateOne({ _id: admin._id }, { $set: { password: hash, passwordChangedAt: new Date() } });
        res.send({ message: "Password changed successfully" });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

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

    // coupons related api
    app.post("/coupons/validate", async (req, res) => {
      try {
        const { code, subtotal } = req.body ?? {};
        const amount = Number(subtotal);
        if (!Number.isFinite(amount) || amount < 0) return res.status(400).send({ valid: false, discount: 0, message: "subtotal must be a valid number" });
        const { valid, discount, message } = await checkCoupon(code, amount);
        res.send({ valid, discount, message });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // orders related api
    app.post("/orders", async (req, res) => {
      try {
        const { customer, zoneId, paymentMethod, transactionId, couponCode, items } = req.body ?? {};
        const name = typeof customer?.name === "string" ? customer.name.trim() : "";
        const phone = typeof customer?.phone === "string" ? customer.phone.trim() : "";
        const address = typeof customer?.address === "string" ? customer.address.trim() : "";
        const note = typeof customer?.note === "string" ? customer.note.trim() : "";
        const trxId = typeof transactionId === "string" ? transactionId.trim() : "";

        if (!name) return res.status(400).send({ message: "Name is required" });
        if (!phonePattern.test(phone)) return res.status(400).send({ message: "Phone must be a valid 11 digit number like 01XXXXXXXXX" });
        if (!address) return res.status(400).send({ message: "Address is required" });
        if (!paymentMethods.includes(paymentMethod)) return res.status(400).send({ message: "Payment method must be cod, bkash or nagad" });
        if (paymentMethod !== "cod" && !trxId) return res.status(400).send({ message: "Transaction ID is required for bKash and Nagad payments" });
        if (!Array.isArray(items) || items.length === 0) return res.status(400).send({ message: "Order must have at least one item" });
        for (const item of items) {
          if (!Number.isInteger(item?.quantity) || item.quantity < 1 || item.quantity > 10) {
            return res.status(400).send({ message: "Quantity must be between 1 and 10" });
          }
        }

        const settings = await settingsCollection.findOne({});
        const zone = settings?.shippingZones?.find((z) => z.id === zoneId);
        if (!zone) return res.status(400).send({ message: "Please select a valid delivery zone" });

        const productIds = [...new Set(items.map((item) => Number(item.productId)))];
        const products = await productsCollection.find({ id: { $in: productIds } }).toArray();
        const quantities = {};
        const lines = [];
        for (const item of items) {
          const product = products.find((p) => p.id === Number(item.productId));
          if (!product) return res.status(400).send({ message: `Product ${item.productId} not found` });
          const variant = item.variant && typeof item.variant === "object" ? item.variant : {};
          for (const [key, value] of Object.entries(variant)) {
            const group = product.variants?.find((v) => v.name === key);
            if (!group || !group.options.includes(value)) return res.status(400).send({ message: `Invalid ${key} option for ${product.name}` });
          }
          quantities[product.id] = (quantities[product.id] ?? 0) + item.quantity;
          if ((product.stock ?? 0) < quantities[product.id]) return res.status(400).send({ message: `${product.name} is out of stock` });
          lines.push({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0] ?? null,
            variant,
            price: product.price,
            quantity: item.quantity,
            lineTotal: product.price * item.quantity,
          });
        }

        const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
        const freeShipping =
          (settings.freeShippingThreshold && subtotal >= settings.freeShippingThreshold) ||
          lines.every((line) => products.find((p) => p.id === line.productId).freeDelivery === true);
        const shipping = freeShipping ? 0 : zone.charge;

        let discount = 0;
        let coupon = null;
        if (typeof couponCode === "string" && couponCode.trim()) {
          const result = await checkCoupon(couponCode, subtotal);
          if (!result.valid) return res.status(400).send({ message: result.message });
          discount = result.discount;
          coupon = result.code;
        }
        const total = subtotal + shipping - discount;

        const reserved = [];
        for (const [id, quantity] of Object.entries(quantities)) {
          const result = await productsCollection.updateOne({ id: Number(id), stock: { $gte: quantity } }, { $inc: { stock: -quantity } });
          if (result.modifiedCount === 0) {
            for (const r of reserved) await productsCollection.updateOne({ id: r.id }, { $inc: { stock: r.quantity } });
            const product = products.find((p) => p.id === Number(id));
            return res.status(400).send({ message: `${product.name} is out of stock` });
          }
          reserved.push({ id: Number(id), quantity });
        }

        try {
          const now = new Date();
          const period = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
          const counter = await countersCollection.findOneAndUpdate(
            { _id: `order-${period}` },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: "after" }
          );
          const orderId = `TS${period}${String(counter.seq).padStart(4, "0")}`;

          await ordersCollection.insertOne({
            orderId,
            customer: { name, phone, address, note },
            phone,
            shippingZoneId: zone.id,
            area: zone.name,
            paymentMethod,
            transactionId: paymentMethod === "cod" ? null : trxId,
            coupon,
            items: lines,
            subtotal,
            shipping,
            discount,
            total,
            status: "pending",
            statusHistory: [{ status: "pending", at: now }],
            courier: null,
            trackingNumber: null,
            createdAt: now,
          });
          res.send({ orderId, total });
        } catch (error) {
          for (const r of reserved) await productsCollection.updateOne({ id: r.id }, { $inc: { stock: r.quantity } });
          throw error;
        }
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/orders/track", async (req, res) => {
      try {
        const phone = typeof req.query.phone === "string" ? req.query.phone.trim() : "";
        const orderId = typeof req.query.orderId === "string" ? req.query.orderId.trim().toUpperCase() : "";
        if (!phonePattern.test(phone)) return res.status(400).send({ message: "Phone must be a valid 11 digit number like 01XXXXXXXXX" });

        const query = { $or: [{ phone }, { "customer.phone": phone }] };
        if (orderId) query.orderId = orderId;
        const orders = await ordersCollection.find(query).sort({ createdAt: -1 }).toArray();
        const tracked = orders.map((o) => ({
          orderId: o.orderId,
          status: o.status,
          statusHistory: o.statusHistory ?? [],
          items: o.items,
          subtotal: o.subtotal,
          shipping: o.shipping,
          discount: o.discount,
          total: o.total,
          courier: o.courier ?? null,
          trackingNumber: o.trackingNumber ?? o.courier?.trackingId ?? null,
          area: o.area ?? null,
          createdAt: o.createdAt,
        }));

        if (orderId) {
          if (!tracked.length) return res.status(404).send({ message: "No order found with this order ID and phone number" });
          return res.send(tracked[0]);
        }
        res.send(tracked);
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