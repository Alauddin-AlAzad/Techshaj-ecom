const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const readline = require('node:readline/promises');
const bcrypt = require('bcryptjs');
require('dotenv').config()
const data = require('../techshaj-client/src/data/fakeData.json');

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

const now = new Date();
const stamp = (doc, createdAt = now) => ({ ...doc, createdAt });

async function confirm() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('This deletes all existing data in techshajDB. Continue? (y/N) ');
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}

async function buildDocs() {
  const { store, shipping, banners, offers } = data;
  const { freeShippingThreshold, ...storeInfo } = store;

  return {
    products: data.products.map((p) => stamp(p)),
    categories: data.categories.map((c) => stamp(c)),
    banners: [
      ...['hero', 'side', 'promo'].flatMap((type) => banners[type].map((b) => stamp({ type, ...b }))),
      ...(banners.menu ? [stamp({ type: 'menu', ...banners.menu })] : []),
    ],
    offers: [stamp({ type: 'flashSale', ...offers.flashSale })],
    coupons: offers.coupons.map((c) => stamp(c)),
    settings: [
      stamp({
        store: storeInfo,
        shippingZones: shipping.zones,
        freeShippingThreshold,
        home: data.home,
        collections: data.collections,
        colors: data.colors,
      }),
    ],
    orders: data.orders.map(({ id, ...o }) => stamp({ orderId: id, ...o }, new Date(o.placedAt))),
    reviews: data.reviews.map((r) => stamp(r, new Date(r.date))),
    admins: [
      stamp({
        email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
        role: 'admin',
      }),
    ],
  };
}

async function run() {
  try {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
      return;
    }
    if (!(await confirm())) {
      console.log('Seed cancelled. Nothing was changed.');
      return;
    }

    await client.connect();
    const db = client.db('techshajDB');
    const docs = await buildDocs();

    for (const [name, list] of Object.entries(docs)) {
      const collection = db.collection(name);
      await collection.deleteMany({});
      const result = await collection.insertMany(list);
      console.log(`${name}: ${result.insertedCount}`);
    }

    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
    await db.collection('products').createIndex({ code: 1 }, { unique: true });
    await db.collection('categories').createIndex({ slug: 1 }, { unique: true });
    await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
    console.log('Seed complete.');
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
