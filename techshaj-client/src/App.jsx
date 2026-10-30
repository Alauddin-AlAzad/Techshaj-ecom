import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/layout/Layout.jsx'
import About from './pages/About.jsx'
import Blog from './pages/Blog.jsx'
import Cart from './pages/Cart.jsx'
import Categories from './pages/Categories.jsx'
import Category from './pages/Category.jsx'
import Checkout from './pages/Checkout.jsx'
import Contact from './pages/Contact.jsx'
import Faq from './pages/Faq.jsx'
import Favorite from './pages/Favorite.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import Offers from './pages/Offers.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import Policy from './pages/Policy.jsx'
import Product from './pages/Product.jsx'
import Shop from './pages/Shop.jsx'
import TrackOrder from './pages/TrackOrder.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:slug" element={<Category />} />
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
      <Toaster position="top-center" richColors />
    </>
  )
}
