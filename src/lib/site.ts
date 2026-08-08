/**
 * Single place for every piece of store information that appears on the site.
 * Edit this file to change contact details, dispatch timings or legal names.
 *
 * Razorpay checks several of these during merchant activation: the support
 * email, phone, and a real postal address must be visible on the website.
 */

export const site = {
  name: "Petalora",
  tagline: "Soft Toys & Plush Flower Gifts",
  description:
    "Handpicked giant plush roses that never wilt. Dispatched from Delhi, delivered across India.",

  legalName: "Petalora",
  email: "petalora.k@gmail.com",
  phone: "+91 87966 40558",
  whatsapp: "918796640558", // digits only, country code first, for wa.me links

  // TODO: this is still a placeholder. Razorpay requires a real, verifiable
  // postal address on the website before it will activate the account, and it
  // is also what a customer looks for when deciding whether a new shop is
  // real. Replace it before applying for activation.
  address: {
    line1: "Shop address line 1",
    line2: "Area",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001",
    country: "India",
  },

  instagram: "https://instagram.com/petalora.k",

  // Fulfilment promises quoted on the product page, shipping policy and
  // order confirmation. Keep these three in sync with what you can actually do.
  dispatch: {
    origin: "Delhi",
    cutoffHour: 14, // orders before 2pm IST ship the same working day
    sameDayCutoffLabel: "2 PM IST",
    processingDays: "1-2 working days",
  },

  returnWindowDays: 7,
} as const;

export function whatsappLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
