import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center sm:px-6">
      <p className="font-display text-6xl font-semibold text-plum-300">404</p>
      <h1 className="mt-4 text-4xl font-semibold text-plum-900">This page has wilted</h1>
      <p className="mt-3 text-ink-soft">
        The link is broken or the page has moved. The roses, thankfully, have not.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-plum-800 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-900"
        >
          Shop the collection
        </Link>
        <Link
          href="/contact"
          className="rounded-full px-6 py-3.5 text-sm font-semibold text-plum-800 ring-1 ring-plum-300 transition-colors hover:bg-plum-50"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
