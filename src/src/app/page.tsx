import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-neutral-900">One Invest</h1>
      <p className="mt-2 text-neutral-600">Market Insights cho thuê ngắn hạn — dữ liệu công khai.</p>
      <ul className="mt-6 space-y-2 text-blue-700 underline">
        <li>
          <Link href="/vn/hanoi">Hà Nội (self-collected Airbnb data)</Link>
        </li>
        <li>
          <Link href="/th/bangkok/map">Bangkok — Market Finder (choropleth map)</Link>
        </li>
        <li>
          <Link href="/th/bangkok">Bangkok (market)</Link>
        </li>
        <li>
          <Link href="/th/bangkok/vadhana">Bangkok › Vadhana (submarket)</Link>
        </li>
        <li>
          <Link href="/saved">Saved markets (cần đăng nhập)</Link>
        </li>
      </ul>
    </main>
  );
}
