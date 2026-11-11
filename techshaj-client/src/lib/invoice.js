import logoMark from '../assets/logo-mark.png'
import { DEFAULT_STORE_NAME } from './branding.js'
import { formatPrice } from './format.js'
import { PAYMENT_LABELS } from './order.js'

const STATUS_LABELS = { pending: 'Pending', placed: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }

const escape = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const dhakaDate = (value, withTime = false) =>
  new Date(value).toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
  })

const variantText = (variant) =>
  Object.entries(variant ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')

const c = (name) => `var(--color-${name})`

// order: { orderId, createdAt, status, paymentMethod, customer: { name, phone, address }, area, coupon, items, subtotal, shipping, discount, total }
// store: public settings (name, hotline, email, address, social).
function invoiceHtml(order, store) {
  const name = store?.name || DEFAULT_STORE_NAME
  const wordmark = name === DEFAULT_STORE_NAME ? 'Tech<span>Shaj</span>' : escape(name)
  const items = order.items ?? []
  const quantity = (item) => item.quantity ?? item.qty ?? 1
  const rows = items
    .map(
      (item, i) => `
      <tr>
        <td class="n">${String(i + 1).padStart(2, '0')}</td>
        <td><div class="pn">${escape(item.name)}</div>${variantText(item.variant) ? `<div class="pv">${escape(variantText(item.variant))}</div>` : ''}</td>
        <td class="c">${quantity(item)}</td>
        <td class="r">${formatPrice(item.price)}</td>
        <td class="r b">${formatPrice(item.lineTotal ?? item.price * quantity(item))}</td>
      </tr>`,
    )
    .join('')
  const cod = order.paymentMethod === 'cod' && order.status !== 'delivered'
  const facebook = store?.social?.facebook?.replace(/^https?:\/\/(www\.)?/, '')

  return `
<div class="inv">
<style>
  .inv{width:794px;min-height:1123px;display:flex;flex-direction:column;background:${c('white')};color:${c('text')};font-family:Inter,'Hind Siliguri',sans-serif;font-size:13px;line-height:1.45}
  .inv *{box-sizing:border-box}
  .inv .head{background:linear-gradient(120deg,${c('primary')} 0%,${c('primary-deep')} 100%);color:${c('white')};padding:48px 56px 40px;position:relative;overflow:hidden}
  .inv .head .o1{position:absolute;right:-110px;top:-150px;width:420px;height:420px;border-radius:50%;background:rgba(255,255,255,.08)}
  .inv .head .o2{position:absolute;right:80px;bottom:-210px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,.06)}
  .inv .top{display:flex;justify-content:space-between;align-items:flex-start;position:relative}
  .inv .logo{display:flex;align-items:center;gap:10px}
  .inv .logo img{width:42px;height:42px;border-radius:10px}
  .inv .logo b{font-size:25px;font-weight:800;letter-spacing:-.5px;color:${c('white')}}
  .inv .tag{font-size:11px;opacity:.85;margin-top:6px}
  .inv h1{margin:0;font-size:31px;letter-spacing:7px;font-weight:800;text-align:right}
  .inv .no{font-size:14px;font-weight:600;text-align:right;margin-top:4px}
  .inv .meta{display:flex;gap:36px;margin-top:34px;position:relative}
  .inv .meta span{display:block;font-size:9.5px;text-transform:uppercase;letter-spacing:1.4px;opacity:.75;margin-bottom:3px}
  .inv .meta b{font-size:14px;font-weight:600}
  .inv .pill{display:inline-block;background:${c('white')};color:${c('primary-deep')};border-radius:20px;padding:2px 11px;font-size:12px;font-weight:700}
  .inv .body{padding:38px 56px 0;flex:1}
  .inv .parties{display:flex;gap:28px}
  .inv .box{flex:1;border:1px solid ${c('border')};border-radius:12px;padding:18px 20px}
  .inv .box h3{margin:0 0 10px;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${c('primary')}}
  .inv .box .nm{font-weight:700;font-size:15px}
  .inv .box p{margin:5px 0 0;color:${c('text-secondary')};line-height:1.55;white-space:pre-line}
  .inv table{width:100%;border-collapse:separate;border-spacing:0;margin-top:32px}
  .inv th{background:${c('primary-tint')};color:${c('primary-deep')};font-size:10px;text-transform:uppercase;letter-spacing:1.3px;text-align:left;padding:12px;font-weight:700}
  .inv th:first-child{border-radius:9px 0 0 9px} .inv th:last-child{border-radius:0 9px 9px 0}
  .inv td{padding:13px 12px;border-bottom:1px solid ${c('border')};vertical-align:top}
  .inv .n{color:${c('text-faint')};font-weight:600;width:34px}
  .inv .pn{font-weight:600} .inv .pv{color:${c('text-muted')};font-size:11.5px;margin-top:3px}
  .inv .c{text-align:center} .inv .r{text-align:right;white-space:nowrap} .inv .b{font-weight:700}
  .inv .sum{display:flex;justify-content:space-between;gap:36px;margin-top:30px;align-items:flex-start}
  .inv .note{flex:1;color:${c('text-muted')};font-size:11.5px;line-height:1.65}
  .inv .pay{display:inline-block;background:${c('highlight-tint')};color:${c('highlight-ink')};border:1px solid ${c('highlight-line')};border-radius:9px;padding:9px 13px;font-weight:700;font-size:12.5px;margin-bottom:12px}
  .inv .tot{width:290px} .inv .tot div{display:flex;justify-content:space-between;padding:7px 0;color:${c('text-secondary')}}
  .inv .tot .disc b{color:${c('success')}}
  .inv .tot .grand{margin-top:8px;background:linear-gradient(120deg,${c('primary')} 0%,${c('primary-deep')} 100%);color:${c('white')};border-radius:11px;padding:14px 18px;font-size:17px;font-weight:800}
  .inv .thanks{text-align:center;margin:44px 0 36px}
  .inv .thanks b{font-size:17px;color:${c('primary')}}
  .inv .thanks p{margin:6px 0 0;color:${c('text-muted')};font-family:'Hind Siliguri',Inter,sans-serif;font-size:14px}
  .inv .foot{background:${c('dark')};color:${c('text-faint')};padding:22px 56px;display:flex;justify-content:space-between;gap:16px;font-size:11.5px}
  .inv .foot b{color:${c('white')};font-weight:600} .inv .foot .pk{color:${c('primary')}}
  .inv .stripe{height:9px;background:linear-gradient(90deg,${c('primary')},${c('secondary')})}
</style>
<div class="head"><span class="o1"></span><span class="o2"></span>
  <div class="top">
    <div><div class="logo"><img src="${logoMark}" alt=""><b>${wordmark}</b></div><div class="tag">Cash on Delivery all over Bangladesh</div></div>
    <div><h1>INVOICE</h1><div class="no">#${escape(order.orderId)}</div></div>
  </div>
  <div class="meta">
    <div><span>Invoice date</span><b>${dhakaDate(new Date())}</b></div>
    <div><span>Order date</span><b>${dhakaDate(order.createdAt, true)}</b></div>
    <div><span>Payment</span><b>${escape(PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod ?? '')}</b></div>
    <div><span>Status</span><b class="pill">${escape(STATUS_LABELS[order.status] ?? order.status)}</b></div>
  </div>
</div>
<div class="body">
  <div class="parties">
    <div class="box"><h3>Bill to</h3><div class="nm">${escape(order.customer?.name)}</div><p>${escape(order.customer?.phone ?? order.phone)}\n${escape(order.customer?.address)}</p></div>
    <div class="box"><h3>From</h3><div class="nm">${escape(name)}</div><p>${escape([store?.hotline, store?.email].filter(Boolean).join(' · '))}${store?.address ? `\n${escape(store.address)}` : ''}</p></div>
  </div>
  <table><thead><tr><th>#</th><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="sum">
    <div class="note">${cod ? `<div class="pay">Pay ${formatPrice(order.total)} on delivery</div><br>` : ''}Please check the product in front of the delivery person. Manufacturing faults are replaced within 7 days.</div>
    <div class="tot">
      <div><span>Subtotal</span><b>${formatPrice(order.subtotal)}</b></div>
      <div><span>Delivery${order.area ? ` (${escape(order.area)})` : ''}</span><b>${order.shipping ? formatPrice(order.shipping) : 'Free'}</b></div>
      ${order.discount ? `<div class="disc"><span>Discount${order.coupon ? ` (${escape(order.coupon)})` : ''}</span><b>−${formatPrice(order.discount)}</b></div>` : ''}
      <div class="grand"><span>Total</span><span>${formatPrice(order.total)}</span></div>
    </div>
  </div>
  <div class="thanks"><b>Thank you for shopping with ${escape(name)}!</b><p>আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ</p></div>
</div>
<div class="foot"><span><b>${escape(window.location.host)}</b></span>${store?.hotline ? `<span>Hotline <b>${escape(store.hotline)}</b></span>` : ''}${facebook ? `<span class="pk">${escape(facebook)}</span>` : ''}</div>
<div class="stripe"></div>
</div>`
}

// Builds the invoice off screen and saves it as <orderId>.pdf. html2pdf loads only when this runs.
export async function downloadInvoice(order, store) {
  const [{ default: html2pdf }] = await Promise.all([import('html2pdf.js'), document.fonts?.ready])
  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;'
  holder.innerHTML = invoiceHtml(order, store)
  document.body.appendChild(holder)
  try {
    await Promise.all([...holder.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((resolve) => (img.onload = img.onerror = resolve)))))
    await html2pdf()
      .set({
        margin: 0,
        filename: `${order.orderId}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#fff' },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait', hotfixes: ['px_scaling'] },
      })
      .from(holder.firstElementChild)
      .save()
  } finally {
    holder.remove()
  }
}
