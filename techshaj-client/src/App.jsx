import { WifiOff } from 'lucide-react'
import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppToaster from './components/AppToaster.jsx'
import EmptyState from './components/EmptyState.jsx'
import Layout from './components/layout/Layout.jsx'
import AdminRoot from './components/admin/AdminRoot.jsx'
import { notify } from './lib/notify.jsx'

function PageLoadFailed() {
  return <EmptyState Icon={WifiOff} title="Could not load this page" text="Check your connection and try again." cta="Go to Home" to="/" />
}

// Each route is its own chunk. A failed chunk download shows an error toast with Retry instead of a blank page.
const page = (load) =>
  lazy(() =>
    load().catch(() => {
      notify.error('Could not load this page', {
        description: 'Check your connection and try again',
        action: { label: 'Retry', onClick: () => window.location.reload() },
        duration: Infinity,
      })
      return { default: PageLoadFailed }
    }),
  )

const Home = page(() => import('./pages/Home.jsx'))
const Shop = page(() => import('./pages/Shop.jsx'))
const Categories = page(() => import('./pages/Categories.jsx'))
const Product = page(() => import('./pages/Product.jsx'))
const Cart = page(() => import('./pages/Cart.jsx'))
const Checkout = page(() => import('./pages/Checkout.jsx'))
const OrderSuccess = page(() => import('./pages/OrderSuccess.jsx'))
const TrackOrder = page(() => import('./pages/TrackOrder.jsx'))
const Favorite = page(() => import('./pages/Favorite.jsx'))
const Offers = page(() => import('./pages/Offers.jsx'))
const About = page(() => import('./pages/About.jsx'))
const Contact = page(() => import('./pages/Contact.jsx'))
const Faq = page(() => import('./pages/Faq.jsx'))
const Policy = page(() => import('./pages/Policy.jsx'))
const Blog = page(() => import('./pages/Blog.jsx'))
const NotFound = page(() => import('./pages/NotFound.jsx'))

const AdminRoute = page(() => import('./components/admin/AdminRoute.jsx'))
const AdminLayout = page(() => import('./components/admin/AdminLayout.jsx'))
const AdminLogin = page(() => import('./pages/admin/Login.jsx'))
const AdminAccount = page(() => import('./pages/admin/Account.jsx'))
const AdminPlaceholder = page(() => import('./pages/admin/Placeholder.jsx'))
const AdminProducts = page(() => import('./pages/admin/Products.jsx'))
const AdminProductForm = page(() => import('./pages/admin/ProductForm.jsx'))
const AdminCategories = page(() => import('./pages/admin/Categories.jsx'))

// Admin pages not built yet: [path, title].
const adminPlaceholders = [
  ['', 'Dashboard'],
  ['orders', 'Orders'],
  ['orders/:orderId', 'Order details'],
  ['banners', 'Banners'],
  ['coupons', 'Coupons'],
  ['flash-sale', 'Flash Sale'],
  ['reviews', 'Reviews'],
  ['settings', 'Settings'],
]

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/admin" element={<AdminRoot />}>
          <Route path="login" element={<AdminLogin />} />
          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            {adminPlaceholders.map(([path, title]) =>
              path ? <Route key={path} path={path} element={<AdminPlaceholder title={title} />} /> : <Route key="index" index element={<AdminPlaceholder title={title} />} />,
            )}
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="account" element={<AdminAccount />} />
            <Route path="*" element={<AdminPlaceholder title="Page not found" subtitle="This admin page does not exist." />} />
          </Route>
        </Route>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/categories" element={<Categories />} />
          {/* Same element as /shop so moving between listings keeps the loaded data. */}
          <Route path="/category/:slug" element={<Shop />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/favorite" element={<Favorite />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/policy/:type" element={<Policy />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <AppToaster />
    </>
  )
}
