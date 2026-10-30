const dns = require('node:dns');
const dnsServers = (process.env.DNS_SERVERS ?? (process.env.VERCEL ? '' : '8.8.8.8,1.1.1.1')).split(',').map((server) => server.trim()).filter(Boolean);
if (dnsServers.length) dns.setServers(dnsServers);
const express = require('express')
const app=express()
const cors= require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const port=process.env.PORT || 5000;
// middle ware
const clientUrls = (process.env.CLIENT_URLS || "http://localhost:5173").split(",").map((url) => url.trim()).filter(Boolean);
app.set('trust proxy', 1)
app.use(cors({ origin: clientUrls }));
app.use(express.json())
// routes are added after the database connects, so every request waits for that first
app.use(async (req, res, next) => {
    try {
        await ready
        next()
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

app.get('/', (req,res)=>{
    res.send("TechShaj server is running")
})

if (!process.env.VERCEL) {
    app.listen( port, ()=>{
        console.log(`TechShaj server is running on port ${port}`)
    })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const user = encodeURIComponent(process.env.DB_USER);
const pass = encodeURIComponent(process.env.DB_PASS);
const uri = `mongodb+srv://${user}:${pass}@cluster0.gkemlm6.mongodb.net/`
                                                                                              
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
    const lowStockLimit = 5;
    const orderStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    const nextStatuses = { pending: ["confirmed", "cancelled"], confirmed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [] };
    const timeZone = "Asia/Dhaka";
    const dhakaDay = (date) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    const dhakaStart = (day) => new Date(`${day}T00:00:00+06:00`);
    const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
    const bannerTypes = ["hero", "side", "promo", "menu"];
    const linkTargetTypes = ["category", "product", "collection", "offers", "shop", "page", "custom", "none"];
    const topBarSpeeds = ["slow", "normal", "fast"];
    const readTopBar = (topBar) => {
      if (!isPlainObject(topBar)) return { error: "topBar must be an object" };
      const list = (items, textKey, linkKey, max) => {
        if (!Array.isArray(items) || items.length > max) return null;
        const result = [];
        for (const item of items) {
          const text = typeof item?.[textKey] === "string" ? item[textKey].trim() : "";
          const link = typeof item?.[linkKey] === "string" ? item[linkKey].trim() : "";
          if (!text) return null;
          result.push({ [textKey]: text, [linkKey]: link });
        }
        return result;
      };
      if (typeof topBar.enabled !== "boolean") return { error: "topBar.enabled must be true or false" };
      if (!topBarSpeeds.includes(topBar.speed)) return { error: "topBar.speed must be slow, normal or fast" };
      const messages = list(topBar.messages ?? [], "text", "link", 20);
      const left = list(topBar.left ?? [], "label", "href", 2);
      const right = list(topBar.right ?? [], "label", "href", 3);
      if (!messages) return { error: "topBar.messages must be a list of { text, link }" };
      if (!left) return { error: "topBar.left must be up to 2 items of { label, href }" };
      if (!right) return { error: "topBar.right must be up to 3 items of { label, href }" };
      return { topBar: { enabled: topBar.enabled, speed: topBar.speed, messages, left, right } };
    };
    const cloudinaryUrl = /^https:\/\/res\.cloudinary\.com\/\S+$/;
    const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
    const toNumber = (value) => (typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN);
    const toDate = (value) => (value === null || value === "" ? null : new Date(value));
    const isBadDate = (date) => date !== null && isNaN(date.getTime());
    const idFilter = (id) => (/^[a-f\d]{24}$/i.test(id) ? { _id: new ObjectId(id) } : { id: Number(id) });
    const pageOf = (query) => {
      const page = Math.max(parseInt(query.page) || 1, 1);
      const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
      return { page, limit, skip: (page - 1) * limit };
    };
    const slugify = (text) => String(text).toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const slugTaken = (collection, slug, id) => collection.findOne({ slug, ...(id !== undefined && { id: { $ne: id } }) });
    const uniqueSlug = async (collection, text) => {
      const base = slugify(text) || "item";
      let slug = base;
      for (let n = 2; await slugTaken(collection, slug); n++) slug = `${base}-${n}`;
      return slug;
    };
    const nextId = async (collection) => {
      const [last] = await collection.find({ id: { $type: "number" } }).sort({ id: -1 }).limit(1).toArray();
      return (last?.id ?? 0) + 1;
    };
    const categoryShort = (category) => {
      if (category.code) return category.code;
      const words = category.name.split(/[^A-Za-z0-9]+/).filter(Boolean);
      const short = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "").slice(0, 2);
      return (short || "XX").toUpperCase();
    };
    const uniqueCode = async (category, start) => {
      const codeFor = (n) => `TS-${categoryShort(category)}-${String(n).padStart(3, "0")}`;
      let n = start;
      while (await productsCollection.findOne({ code: codeFor(n) })) n++;
      return codeFor(n);
    };
    const readText = (body, data, keys) => {
      for (const key of keys) {
        if (body[key] === undefined) continue;
        if (typeof body[key] !== "string") return `${key} must be text`;
        data[key] = body[key].trim();
      }
    };
    const readFlags = (body, data, keys) => {
      for (const key of keys) {
        if (body[key] === undefined) continue;
        if (typeof body[key] !== "boolean") return `${key} must be true or false`;
        data[key] = body[key];
      }
    };
    const readProduct = async (body, current) => {
      const data = {};
      let category = null;
      const textError = readText(body, data, ["name", "brand", "shortDescription", "description", "adminNote"]) || readFlags(body, data, ["freeDelivery", "isNew", "published"]);
      if (textError) return { error: textError };
      if (data.name === "") return { error: "Name is required" };
      for (const key of ["price", "oldPrice", "costPrice"]) {
        if (body[key] === undefined) continue;
        if (key !== "price" && body[key] === null) {
          data[key] = null;
          continue;
        }
        const value = toNumber(body[key]);
        if (!Number.isFinite(value) || value < 0 || (key === "price" && value === 0)) return { error: `${key} must be a positive number` };
        data[key] = value;
      }
      if (body.stock !== undefined) {
        const stock = toNumber(body.stock);
        if (!Number.isInteger(stock) || stock < 0) return { error: "stock must be a whole number of 0 or more" };
        data.stock = stock;
      }
      if (body.categoryId !== undefined) {
        category = await categoriesCollection.findOne({ id: toNumber(body.categoryId) });
        if (!category) return { error: "Category not found" };
        data.categoryId = category.id;
      }
      if (body.images !== undefined) {
        if (!Array.isArray(body.images) || body.images.length === 0) return { error: "images must be a non-empty array" };
        const known = current?.images ?? [];
        if (!body.images.every((url) => typeof url === "string" && (cloudinaryUrl.test(url) || known.includes(url)))) {
          return { error: "images must be Cloudinary URLs" };
        }
        data.images = body.images;
      }
      if (body.collections !== undefined) {
        if (!Array.isArray(body.collections) || !body.collections.every((c) => typeof c === "string" && c.trim())) return { error: "collections must be an array of text" };
        data.collections = [...new Set(body.collections.map((c) => c.trim()))];
      }
      if (body.variants !== undefined) {
        const valid =
          Array.isArray(body.variants) &&
          body.variants.every((v) => typeof v?.name === "string" && v.name.trim() && Array.isArray(v.options) && v.options.length && v.options.every((o) => typeof o === "string" && o.trim()));
        if (!valid) return { error: "variants must be an array of { name, options }" };
        data.variants = body.variants.map((v) => ({ name: v.name.trim(), options: v.options.map((o) => o.trim()) }));
      }
      if (body.specs !== undefined) {
        const valid = Array.isArray(body.specs) && body.specs.every((s) => typeof s?.label === "string" && s.label.trim() && typeof s.value === "string");
        if (!valid) return { error: "specs must be an array of { label, value }" };
        data.specs = body.specs.map((s) => ({ label: s.label.trim(), value: s.value.trim() }));
      }
      if (body.slug !== undefined) {
        data.slug = typeof body.slug === "string" ? slugify(body.slug) : "";
        if (!data.slug) return { error: "slug is invalid" };
      }
      if (body.code !== undefined) {
        data.code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
        if (!data.code) return { error: "code is invalid" };
      }
      return { data, category };
    };
    const readCategory = async (body, current) => {
      const data = {};
      const textError = readText(body, data, ["name", "icon", "shortName", "menuName"]);
      if (textError) return { error: textError };
      if (data.name === "") return { error: "Name is required" };
      if (body.slug !== undefined) {
        data.slug = typeof body.slug === "string" ? slugify(body.slug) : "";
        if (!data.slug) return { error: "slug is invalid" };
      }
      if (body.code !== undefined) {
        data.code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
        if (!/^[A-Z0-9]{1,4}$/.test(data.code)) return { error: "code must be 1 to 4 letters or digits" };
      }
      if (body.parentId !== undefined) {
        if (body.parentId === null) {
          data.parentId = null;
        } else {
          const parent = await categoriesCollection.findOne({ id: toNumber(body.parentId) });
          if (!parent) return { error: "Parent category not found" };
          if (parent.parentId) return { error: "Parent must be a top level category" };
          if (current && parent.id === current.id) return { error: "A category cannot be its own parent" };
          if (current && (await categoriesCollection.countDocuments({ parentId: current.id }))) {
            return { error: "A category with subcategories cannot become a subcategory" };
          }
          data.parentId = parent.id;
        }
      }
      return { data };
    };
    const readBanner = (body, current) => {
      const data = {};
      const textError = readText(body, data, ["name", "eyebrow", "title", "shortTitle", "subtitle", "link", "icon", "theme", "image"]) || readFlags(body, data, ["active"]);
      if (textError) return { error: textError };
      if (body.type !== undefined) {
        if (!bannerTypes.includes(body.type)) return { error: "type must be hero, side, promo or menu" };
        data.type = body.type;
      }
      if (data.image !== undefined && !/^https:\/\/\S+$/.test(data.image)) return { error: "image must be an https URL" };
      if (body.order !== undefined) {
        const order = toNumber(body.order);
        if (!Number.isInteger(order)) return { error: "order must be a whole number" };
        data.order = order;
      }
      for (const key of ["startAt", "endAt"]) {
        if (body[key] === undefined) continue;
        data[key] = toDate(body[key]);
        if (isBadDate(data[key])) return { error: `${key} must be a valid date` };
      }
      if (body.linkTarget !== undefined) {
        const target = body.linkTarget;
        if (target !== null && !(isPlainObject(target) && linkTargetTypes.includes(target.type) && (target.value === undefined || target.value === null || typeof target.value === "string"))) {
          return { error: "linkTarget must be { type, value }" };
        }
        data.linkTarget = target && { type: target.type, value: typeof target.value === "string" ? target.value.trim() : "" };
      }
      const startAt = data.startAt !== undefined ? data.startAt : current?.startAt;
      const endAt = data.endAt !== undefined ? data.endAt : current?.endAt;
      if (startAt && endAt && new Date(endAt) <= new Date(startAt)) return { error: "endAt must be after startAt" };
      return { data };
    };
    const readCoupon = (body, current) => {
      const data = {};
      const flagError = readFlags(body, data, ["active", "isPublic"]);
      if (flagError) return { error: flagError };
      if (body.code !== undefined) {
        data.code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
        if (!/^[A-Z0-9_-]{3,30}$/.test(data.code)) return { error: "code must be 3 to 30 letters, digits, - or _" };
      }
      if (body.type !== undefined) {
        if (!["percent", "fixed"].includes(body.type)) return { error: "type must be percent or fixed" };
        data.type = body.type;
      }
      if (body.value !== undefined) {
        data.value = toNumber(body.value);
        if (!Number.isFinite(data.value) || data.value <= 0) return { error: "value must be a positive number" };
      }
      if (body.minOrder !== undefined) {
        data.minOrder = body.minOrder === null ? 0 : toNumber(body.minOrder);
        if (!Number.isFinite(data.minOrder) || data.minOrder < 0) return { error: "minOrder must be 0 or more" };
      }
      if (body.expiresAt !== undefined) {
        data.expiresAt = toDate(body.expiresAt);
        if (isBadDate(data.expiresAt)) return { error: "expiresAt must be a valid date" };
      }
      const type = data.type ?? current?.type;
      const value = data.value ?? current?.value;
      if (type === "percent" && value > 100) return { error: "A percent coupon cannot be more than 100" };
      return { data };
    };
    const readShippingZones = (zones) => {
      if (!Array.isArray(zones) || zones.length === 0) return { error: "shippingZones must be a non-empty array" };
      const result = [];
      for (const zone of zones) {
        const name = typeof zone?.name === "string" ? zone.name.trim() : "";
        const charge = toNumber(zone?.charge);
        if (!name) return { error: "Every shipping zone needs a name" };
        if (!Number.isFinite(charge) || charge < 0) return { error: `Charge for ${name} must be 0 or more` };
        const id = typeof zone.id === "string" && zone.id.trim() ? slugify(zone.id) : slugify(name);
        if (!id) return { error: `Shipping zone ${name} needs a valid id` };
        if (result.some((z) => z.id === id)) return { error: `Shipping zone id ${id} is used twice` };
        result.push({
          id,
          name,
          nameBn: typeof zone.nameBn === "string" ? zone.nameBn.trim() : "",
          charge,
          days: typeof zone.days === "string" ? zone.days.trim() : "",
        });
      }
      return { zones: result };
    };
    const refreshProductRating = async (productId) => {
      const [stats] = await reviewsCollection
        .aggregate([
          { $match: { productId, status: { $nin: ["pending", "rejected"] } } },
          { $group: { _id: null, rating: { $avg: "$rating" }, count: { $sum: 1 } } },
        ])
        .toArray();
      const rating = stats?.rating ? Math.round(stats.rating * 10) / 10 : 0;
      await productsCollection.updateOne({ id: productId }, { $set: { rating, reviewCount: stats?.count ?? 0 } });
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

    const jwtLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { message: "Too many login attempts, please try again after 15 minutes" },
    });

    // jwt related api
    app.post("/jwt", jwtLimiter, async (req, res) => {
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

    // admin products related api
    app.get("/admin/products", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { search, category, status, stock } = req.query;
        const { page, limit, skip } = pageOf(req.query);
        const query = {};
        if (category) {
          const cat = await categoriesCollection.findOne(/^\d+$/.test(category) ? { id: Number(category) } : { slug: category });
          if (!cat) return res.send({ products: [], total: 0, page, totalPages: 0 });
          query.categoryId = { $in: await categoryIdsFor(cat) };
        }
        if (status === "published") query.published = { $ne: false };
        else if (status === "draft") query.published = false;
        else if (status) return res.status(400).send({ message: "status must be published or draft" });
        if (stock === "in") query.stock = { $gt: 0 };
        else if (stock === "low") query.stock = { $gt: 0, $lte: lowStockLimit };
        else if (stock === "out") query.stock = { $not: { $gt: 0 } };
        else if (stock) return res.status(400).send({ message: "stock must be in, low or out" });
        if (typeof search === "string" && search.trim()) {
          const regex = { $regex: escapeRegex(search.trim()), $options: "i" };
          query.$or = [{ name: regex }, { code: regex }, { slug: regex }];
        }

        const total = await productsCollection.countDocuments(query);
        const products = await productsCollection.find(query).sort({ id: -1 }).skip(skip).limit(limit).toArray();
        res.send({ products, total, page, totalPages: Math.ceil(total / limit) });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.post("/admin/products", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { data, category, error } = await readProduct(req.body ?? {});
        if (error) return res.status(400).send({ message: error });
        if (!data.name || !category || data.price === undefined || !data.images) {
          return res.status(400).send({ message: "name, categoryId, price and images are required" });
        }
        const id = await nextId(productsCollection);
        if (data.slug && (await slugTaken(productsCollection, data.slug))) return res.status(400).send({ message: "This slug is already used" });
        if (data.code && (await productsCollection.findOne({ code: data.code }))) return res.status(400).send({ message: "This product code is already used" });
        const now = new Date();
        const product = {
          id,
          brand: "",
          oldPrice: null,
          variants: [],
          specs: [],
          shortDescription: "",
          description: "",
          stock: 0,
          freeDelivery: false,
          isNew: true,
          collections: [],
          published: true,
          ...data,
          slug: data.slug || (await uniqueSlug(productsCollection, data.name)),
          code: data.code || (await uniqueCode(category, id)),
          rating: 0,
          reviewCount: 0,
          soldCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        await productsCollection.insertOne(product);
        res.send(product);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.patch("/admin/products/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const current = await productsCollection.findOne(idFilter(req.params.id));
        if (!current) return res.status(404).send({ message: "Product not found" });
        const { data, error } = await readProduct(req.body ?? {}, current);
        if (error) return res.status(400).send({ message: error });
        if (!Object.keys(data).length) return res.status(400).send({ message: "No fields to update" });
        if (data.slug && (await slugTaken(productsCollection, data.slug, current.id))) return res.status(400).send({ message: "This slug is already used" });
        if (data.code && (await productsCollection.findOne({ code: data.code, id: { $ne: current.id } }))) {
          return res.status(400).send({ message: "This product code is already used" });
        }
        const product = await productsCollection.findOneAndUpdate(
          { _id: current._id },
          { $set: { ...data, updatedAt: new Date() } },
          { returnDocument: "after" }
        );
        res.send(product);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.delete("/admin/products/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const product = await productsCollection.findOneAndDelete(idFilter(req.params.id));
        if (!product) return res.status(404).send({ message: "Product not found" });
        await offersCollection.updateMany({ productIds: product.id }, { $pull: { productIds: product.id } });
        res.send({ message: "Product deleted", id: product.id });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // admin categories related api
    app.post("/admin/categories", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { data, error } = await readCategory(req.body ?? {});
        if (error) return res.status(400).send({ message: error });
        if (!data.name) return res.status(400).send({ message: "Name is required" });
        if (data.slug && (await slugTaken(categoriesCollection, data.slug))) return res.status(400).send({ message: "This slug is already used" });
        const category = {
          id: await nextId(categoriesCollection),
          icon: "Package",
          parentId: null,
          ...data,
          slug: data.slug || (await uniqueSlug(categoriesCollection, data.name)),
        };
        await categoriesCollection.insertOne(category);
        res.send(category);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.patch("/admin/categories/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const current = await categoriesCollection.findOne(idFilter(req.params.id));
        if (!current) return res.status(404).send({ message: "Category not found" });
        const { data, error } = await readCategory(req.body ?? {}, current);
        if (error) return res.status(400).send({ message: error });
        if (!Object.keys(data).length) return res.status(400).send({ message: "No fields to update" });
        if (data.slug && (await slugTaken(categoriesCollection, data.slug, current.id))) return res.status(400).send({ message: "This slug is already used" });
        const category = await categoriesCollection.findOneAndUpdate({ _id: current._id }, { $set: data }, { returnDocument: "after" });
        res.send(category);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.delete("/admin/categories/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const category = await categoriesCollection.findOne(idFilter(req.params.id));
        if (!category) return res.status(404).send({ message: "Category not found" });
        const productCount = await productsCollection.countDocuments({ categoryId: category.id });
        const subcategoryCount = await categoriesCollection.countDocuments({ parentId: category.id });
        if (productCount || subcategoryCount) {
          return res.status(400).send({
            message: `This category still has ${productCount} products and ${subcategoryCount} subcategories`,
            productCount,
            subcategoryCount,
          });
        }
        await categoriesCollection.deleteOne({ _id: category._id });
        res.send({ message: "Category deleted", id: category.id });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // admin banners related api
    app.get("/admin/banners", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const query = {};
        if (req.query.type) query.type = req.query.type;
        if (req.query.active === "true") query.active = true;
        if (req.query.active === "false") query.active = { $ne: true };
        const banners = await bannersCollection.find(query).sort({ type: 1, order: 1, id: 1 }).toArray();
        res.send(banners);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.post("/admin/banners", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { data, error } = readBanner(req.body ?? {});
        if (error) return res.status(400).send({ message: error });
        if (!data.type || !data.image) return res.status(400).send({ message: "type and image are required" });
        const banner = { id: await nextId(bannersCollection), active: true, order: 0, startAt: null, endAt: null, ...data, createdAt: new Date() };
        await bannersCollection.insertOne(banner);
        res.send(banner);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.patch("/admin/banners/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const current = await bannersCollection.findOne(idFilter(req.params.id));
        if (!current) return res.status(404).send({ message: "Banner not found" });
        const { data, error } = readBanner(req.body ?? {}, current);
        if (error) return res.status(400).send({ message: error });
        if (!Object.keys(data).length) return res.status(400).send({ message: "No fields to update" });
        const banner = await bannersCollection.findOneAndUpdate({ _id: current._id }, { $set: data }, { returnDocument: "after" });
        res.send(banner);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.delete("/admin/banners/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const banner = await bannersCollection.findOneAndDelete(idFilter(req.params.id));
        if (!banner) return res.status(404).send({ message: "Banner not found" });
        res.send({ message: "Banner deleted", id: banner.id });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // admin coupons and offers related api
    app.get("/admin/coupons", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const coupons = await couponsCollection.find().sort({ createdAt: -1, code: 1 }).toArray();
        res.send(coupons);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.post("/admin/coupons", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { data, error } = readCoupon(req.body ?? {});
        if (error) return res.status(400).send({ message: error });
        if (!data.code || !data.type || data.value === undefined) return res.status(400).send({ message: "code, type and value are required" });
        if (await couponsCollection.findOne({ code: { $regex: `^${escapeRegex(data.code)}$`, $options: "i" } })) {
          return res.status(400).send({ message: "This coupon code already exists" });
        }
        const coupon = { minOrder: 0, expiresAt: null, active: true, isPublic: true, usedCount: 0, ...data, createdAt: new Date() };
        await couponsCollection.insertOne(coupon);
        res.send(coupon);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.patch("/admin/coupons/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const current = await couponsCollection.findOne(idFilter(req.params.id));
        if (!current) return res.status(404).send({ message: "Coupon not found" });
        const { data, error } = readCoupon(req.body ?? {}, current);
        if (error) return res.status(400).send({ message: error });
        if (!Object.keys(data).length) return res.status(400).send({ message: "No fields to update" });
        if (data.code && (await couponsCollection.findOne({ code: { $regex: `^${escapeRegex(data.code)}$`, $options: "i" }, _id: { $ne: current._id } }))) {
          return res.status(400).send({ message: "This coupon code already exists" });
        }
        const coupon = await couponsCollection.findOneAndUpdate({ _id: current._id }, { $set: data }, { returnDocument: "after" });
        res.send(coupon);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.delete("/admin/coupons/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const coupon = await couponsCollection.findOneAndDelete(idFilter(req.params.id));
        if (!coupon) return res.status(404).send({ message: "Coupon not found" });
        res.send({ message: "Coupon deleted", code: coupon.code });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.patch("/admin/offers/flash-sale", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { title, endsAt, productIds, active } = req.body ?? {};
        const data = {};
        if (title !== undefined) {
          data.title = typeof title === "string" ? title.trim() : "";
          if (!data.title) return res.status(400).send({ message: "title is required" });
        }
        if (endsAt !== undefined) {
          data.endsAt = toDate(endsAt);
          if (!data.endsAt || isBadDate(data.endsAt)) return res.status(400).send({ message: "endsAt must be a valid date" });
        }
        if (productIds !== undefined) {
          const ids = Array.isArray(productIds) ? [...new Set(productIds.map(toNumber))] : [];
          if (!Array.isArray(productIds) || !ids.every(Number.isInteger)) return res.status(400).send({ message: "productIds must be an array of product ids" });
          const found = await productsCollection.countDocuments({ id: { $in: ids } });
          if (found !== ids.length) return res.status(400).send({ message: "Some products in productIds were not found" });
          data.productIds = ids;
        }
        if (active !== undefined) {
          if (typeof active !== "boolean") return res.status(400).send({ message: "active must be true or false" });
          data.active = active;
        }
        if (!Object.keys(data).length) return res.status(400).send({ message: "No fields to update" });

        const current = await offersCollection.findOne({ type: "flashSale" }, { sort: { endsAt: -1 } });
        if (!current) {
          if (!data.title || !data.endsAt || !data.productIds) return res.status(400).send({ message: "title, endsAt and productIds are required" });
          const sale = { type: "flashSale", active: true, ...data, updatedAt: new Date() };
          await offersCollection.insertOne(sale);
          return res.send(sale);
        }
        const sale = await offersCollection.findOneAndUpdate(
          { _id: current._id },
          { $set: { ...data, updatedAt: new Date() } },
          { returnDocument: "after" }
        );
        res.send(sale);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // admin settings related api
    app.patch("/admin/settings", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { store, shippingZones, freeShippingThreshold, topBar } = req.body ?? {};
        const data = {};
        if (store !== undefined) {
          if (!isPlainObject(store)) return res.status(400).send({ message: "store must be an object" });
          for (const [key, value] of Object.entries(store)) {
            if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(key)) return res.status(400).send({ message: `Invalid store field ${key}` });
            data[`store.${key}`] = typeof value === "string" ? value.trim() : value;
          }
        }
        if (shippingZones !== undefined) {
          const { zones, error } = readShippingZones(shippingZones);
          if (error) return res.status(400).send({ message: error });
          data.shippingZones = zones;
        }
        if (freeShippingThreshold !== undefined) {
          const threshold = freeShippingThreshold === null ? null : toNumber(freeShippingThreshold);
          if (threshold !== null && (!Number.isFinite(threshold) || threshold < 0)) {
            return res.status(400).send({ message: "freeShippingThreshold must be 0 or more" });
          }
          data.freeShippingThreshold = threshold;
        }
        if (topBar !== undefined) {
          const result = readTopBar(topBar);
          if (result.error) return res.status(400).send({ message: result.error });
          data.topBar = result.topBar;
        }
        if (!Object.keys(data).length) return res.status(400).send({ message: "No fields to update" });
        const settings = await settingsCollection.findOneAndUpdate({}, { $set: data }, { upsert: true, returnDocument: "after" });
        res.send(settings);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // admin reviews related api
    app.get("/admin/reviews", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { status, productId } = req.query;
        const { page, limit, skip } = pageOf(req.query);
        const query = {};
        if (status === "pending" || status === "rejected") query.status = status;
        else if (status === "approved") query.status = { $nin: ["pending", "rejected"] };
        else if (status) return res.status(400).send({ message: "status must be pending, approved or rejected" });
        if (productId) query.productId = Number(productId);

        const total = await reviewsCollection.countDocuments(query);
        const reviews = await reviewsCollection.find(query).sort({ createdAt: -1, id: -1 }).skip(skip).limit(limit).toArray();
        const products = await productsCollection
          .find({ id: { $in: [...new Set(reviews.map((r) => r.productId))] } })
          .project({ id: 1, name: 1, slug: 1 })
          .toArray();
        res.send({
          reviews: reviews.map((r) => ({ ...r, product: products.find((p) => p.id === r.productId) ?? null })),
          total,
          page,
          totalPages: Math.ceil(total / limit),
        });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.patch("/admin/reviews/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { status } = req.body ?? {};
        if (!["approved", "rejected"].includes(status)) return res.status(400).send({ message: "status must be approved or rejected" });
        const review = await reviewsCollection.findOneAndUpdate(
          idFilter(req.params.id),
          { $set: { status, reviewedAt: new Date() } },
          { returnDocument: "after" }
        );
        if (!review) return res.status(404).send({ message: "Review not found" });
        await refreshProductRating(review.productId);
        res.send(review);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // admin orders related api
    app.get("/admin/orders", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { status, paymentMethod, zone, search, from, to } = req.query;
        const { page, limit, skip } = pageOf(req.query);
        const query = {};
        if (paymentMethod) {
          if (!paymentMethods.includes(paymentMethod)) return res.status(400).send({ message: "paymentMethod must be cod, bkash or nagad" });
          query.paymentMethod = paymentMethod;
        }
        if (typeof zone === "string" && zone.trim()) query.shippingZoneId = zone.trim();
        if (typeof search === "string" && search.trim()) {
          const regex = { $regex: escapeRegex(search.trim()), $options: "i" };
          query.$or = [{ orderId: regex }, { "customer.name": regex }, { phone: regex }, { "customer.phone": regex }];
        }
        if (from || to) {
          query.createdAt = {};
          if (from) {
            const start = typeof from === "string" && dayPattern.test(from) ? dhakaStart(from) : new Date(from);
            if (isNaN(start.getTime())) return res.status(400).send({ message: "from must be a valid date" });
            query.createdAt.$gte = start;
          }
          if (to) {
            const end = typeof to === "string" && dayPattern.test(to) ? new Date(dhakaStart(to).getTime() + 24 * 60 * 60 * 1000) : new Date(to);
            if (isNaN(end.getTime())) return res.status(400).send({ message: "to must be a valid date" });
            query.createdAt[dayPattern.test(to) ? "$lt" : "$lte"] = end;
          }
        }

        const grouped = await ordersCollection.aggregate([{ $match: query }, { $group: { _id: "$status", count: { $sum: 1 } } }]).toArray();
        const counts = { all: 0, ...Object.fromEntries(orderStatuses.map((s) => [s, 0])) };
        for (const g of grouped) {
          counts[g._id] = g.count;
          counts.all += g.count;
        }

        if (status) {
          if (!orderStatuses.includes(status)) return res.status(400).send({ message: "status must be pending, confirmed, shipped, delivered or cancelled" });
          query.status = status;
        }
        const total = await ordersCollection.countDocuments(query);
        const orders = await ordersCollection
          .find(query)
          .project({ "customer.address": 0, statusHistory: 0 })
          .sort({ createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        res.send({ orders, total, counts, page, totalPages: Math.ceil(total / limit) });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/admin/orders/:orderId", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const order = await ordersCollection.findOne({ orderId: req.params.orderId.trim().toUpperCase() });
        if (!order) return res.status(404).send({ message: "Order not found" });
        res.send(order);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.patch("/admin/orders/:orderId/status", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { status, note } = req.body ?? {};
        if (!orderStatuses.includes(status)) return res.status(400).send({ message: "status must be pending, confirmed, shipped, delivered or cancelled" });
        if (note !== undefined && note !== null && typeof note !== "string") return res.status(400).send({ message: "note must be text" });
        const current = await ordersCollection.findOne({ orderId: req.params.orderId.trim().toUpperCase() });
        if (!current) return res.status(404).send({ message: "Order not found" });
        if (!nextStatuses[current.status]?.includes(status)) {
          return res.status(400).send({ message: `An order that is ${current.status} cannot be marked ${status}` });
        }

        const now = new Date();
        const entry = { status, at: now, by: req.admin.email, ...(note?.trim() && { note: note.trim() }) };
        const order = await ordersCollection.findOneAndUpdate(
          { _id: current._id, status: current.status },
          { $set: { status, updatedAt: now }, $push: { statusHistory: entry } },
          { returnDocument: "after" }
        );
        if (!order) return res.status(409).send({ message: "This order was just updated by someone else. Refresh and try again." });

        if (status === "cancelled") {
          const quantities = {};
          for (const item of current.items ?? []) quantities[item.productId] = (quantities[item.productId] ?? 0) + item.quantity;
          for (const [id, quantity] of Object.entries(quantities)) {
            await productsCollection.updateOne({ id: Number(id) }, { $inc: { stock: quantity } });
          }
        }
        res.send(order);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.patch("/admin/orders/:orderId/courier", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { courier, trackingNumber } = req.body ?? {};
        const data = {};
        for (const [key, value] of [["courier", courier], ["trackingNumber", trackingNumber]]) {
          if (value === undefined) continue;
          if (value !== null && typeof value !== "string") return res.status(400).send({ message: `${key} must be text` });
          const text = value?.trim() ?? "";
          if (text.length > 100) return res.status(400).send({ message: `${key} must be 100 characters or less` });
          data[key] = text || null;
        }
        if (!Object.keys(data).length) return res.status(400).send({ message: "No fields to update" });
        const current = await ordersCollection.findOne({ orderId: req.params.orderId.trim().toUpperCase() });
        if (!current) return res.status(404).send({ message: "Order not found" });
        if (current.status === "cancelled") return res.status(400).send({ message: "A cancelled order cannot get courier details" });
        const order = await ordersCollection.findOneAndUpdate({ _id: current._id }, { $set: { ...data, updatedAt: new Date() } }, { returnDocument: "after" });
        res.send(order);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // admin dashboard related api
    app.get("/admin/dashboard", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const today = dhakaDay(new Date());
        const todayStart = dhakaStart(today);
        const days = Array.from({ length: 7 }, (_, i) => dhakaDay(new Date(todayStart.getTime() - (6 - i) * 24 * 60 * 60 * 1000)));
        const notCancelled = { status: { $ne: "cancelled" } };
        const lowStockQuery = { stock: { $not: { $gt: lowStockLimit } } };

        const [perDay, pendingCount, lowStock, lowStockCount, topProducts, latestOrders] = await Promise.all([
          ordersCollection
            .aggregate([
              { $match: { ...notCancelled, createdAt: { $gte: dhakaStart(days[0]) } } },
              { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: timeZone } }, orders: { $sum: 1 }, sales: { $sum: "$total" } } },
            ])
            .toArray(),
          ordersCollection.countDocuments({ status: "pending" }),
          productsCollection.find(lowStockQuery).project({ id: 1, name: 1, code: 1, slug: 1, stock: 1, images: { $slice: 1 } }).sort({ stock: 1, id: 1 }).limit(20).toArray(),
          productsCollection.countDocuments(lowStockQuery),
          ordersCollection
            .aggregate([
              { $match: notCancelled },
              { $unwind: "$items" },
              { $group: { _id: "$items.productId", name: { $last: "$items.name" }, image: { $last: "$items.image" }, quantity: { $sum: "$items.quantity" }, revenue: { $sum: "$items.lineTotal" } } },
              { $sort: { quantity: -1, revenue: -1 } },
              { $limit: 5 },
              { $project: { _id: 0, productId: "$_id", name: 1, image: 1, quantity: 1, revenue: 1 } },
            ])
            .toArray(),
          ordersCollection
            .find()
            .project({ orderId: 1, "customer.name": 1, phone: 1, area: 1, total: 1, status: 1, paymentMethod: 1, createdAt: 1 })
            .sort({ createdAt: -1, _id: -1 })
            .limit(5)
            .toArray(),
        ]);

        const salesByDay = days.map((date) => {
          const day = perDay.find((d) => d._id === date);
          return { date, orders: day?.orders ?? 0, sales: day?.sales ?? 0 };
        });
        const todayStats = salesByDay.at(-1);
        res.send({
          today: { orders: todayStats.orders, sales: todayStats.sales },
          pendingCount,
          lowStock,
          lowStockCount,
          salesByDay,
          topProducts,
          latestOrders,
        });
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
        const query = { published: { $ne: false } };

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
        const product = await productsCollection.findOne({ slug: req.params.slug, published: { $ne: false } }, { projection: productProjection });
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
        const product = await productsCollection.findOne({ slug: req.params.slug, published: { $ne: false } });
        if (!product) return res.status(404).send({ message: "Product not found" });
        const related = await productsCollection
          .find({ categoryId: product.categoryId, id: { $ne: product.id }, published: { $ne: false } })
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
        const counts = await productsCollection
          .aggregate([{ $match: { published: { $ne: false } } }, { $group: { _id: "$categoryId", count: { $sum: 1 } } }])
          .toArray();
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
        const now = new Date();
        const banners = await bannersCollection
          .find({
            active: true,
            $and: [{ $or: [{ startAt: null }, { startAt: { $lte: now } }] }, { $or: [{ endAt: null }, { endAt: { $gt: now } }] }],
          })
          .sort({ order: 1, id: 1 })
          .toArray();
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
          ? { ...sale, products: await productsCollection.find({ id: { $in: sale.productIds }, published: { $ne: false } }).project(productProjection).toArray() }
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
        const { store, shippingZones, freeShippingThreshold, topBar } = settings;
        res.send({ ...store, freeShippingThreshold, shippingZones, shipping: { zones: shippingZones }, topBar: topBar ?? null });
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
        const products = await productsCollection.find({ id: { $in: productIds }, published: { $ne: false } }).toArray();
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
          if (coupon) await couponsCollection.updateOne({ code: coupon }, { $inc: { usedCount: 1 } }).catch(console.dir);
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

const ready = run();
ready.catch(console.dir);

module.exports = app;
