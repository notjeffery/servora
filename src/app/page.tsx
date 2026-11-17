import Image from "next/image";
import Link from "next/link";
import {
  Search,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
  BadgeDollarSign,
  Star,
} from "lucide-react";
import HeroSearch from "@/components/home/HeroSearch";
import SiteHeader from "@/components/layout/SiteHeader";

const categories = [
  { name: "Painting", slug: "painting", image: "/images/cat-painting.jpg" },
  { name: "Plumbing", slug: "plumbing", image: "/images/cat-plumbing.jpg" },
  { name: "HVAC", slug: "hvac", image: "/images/cat-hvac.jpg" },
  { name: "Drywall", slug: "drywall", image: "/images/cat-drywall.jpg" },
  {
    name: "General Construction",
    slug: "general-construction",
    image: "/images/cat-construction.jpg",
  },
];

const steps = [
  {
    icon: Search,
    title: "Choose a service",
    text: "Pick a trade and tell us what you need done, where, and when.",
  },
  {
    icon: CalendarCheck,
    title: "Pick your pro",
    text: "Compare profiles, reviews and upfront hourly rates, then send a booking request.",
  },
  {
    icon: CheckCircle2,
    title: "Get it done",
    text: "Your pro confirms and shows up. Leave a review once the job is complete.",
  },
];

const trust = [
  {
    icon: ShieldCheck,
    title: "Licence-reviewed pros",
    text: "Every pro's licence is reviewed by our team before their profile goes live.",
  },
  {
    icon: BadgeDollarSign,
    title: "Upfront hourly rates",
    text: "See each pro's rate before you book. No bidding and no surprises.",
  },
  {
    icon: Star,
    title: "Verified reviews",
    text: "Only customers who completed a booking can leave a review.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative h-[560px] md:h-[640px]">
        <Image
          src="/images/hero.jpg"
          alt="A tradesperson at work"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-12 text-white md:pb-16">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
            Book trusted pros for any home job
          </h1>
          <p className="mt-4 max-w-xl text-lg text-gray-200">
            Painters, plumbers, HVAC technicians and more. See the hourly
            rate upfront, pick your pro, and book in minutes.
          </p>
          <div className="mt-8">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="services" className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Popular services</h2>
        <p className="mt-2 text-gray-600">Pick a trade to get started.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/services/${c.slug}`}
              className="group relative block aspect-[3/4] overflow-hidden rounded-xl"
            >
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(min-width: 768px) 20vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 font-semibold text-white">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <s.icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {i + 1}. {s.title}
                </h3>
                <p className="mt-1 text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Hire with confidence</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {trust.map((t) => (
            <div key={t.title} className="rounded-xl border p-6">
              <t.icon className="text-orange-500" size={28} />
              <h3 className="mt-4 text-lg font-semibold">{t.title}</h3>
              <p className="mt-1 text-gray-600">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pro CTA */}
      <section className="bg-black text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src="/images/pro-cta.jpg"
              alt="A tradesman next to his work van"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Earn on your own schedule
            </h2>
            <p className="mt-4 text-gray-300">
              Set your own hourly rate, choose the jobs you want, and get
              booked by customers near you. Sign up, submit your licence,
              and start receiving requests once you're approved.
            </p>
            <Link
              href="/pro/signup"
              className="mt-8 inline-block rounded-md bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Join as a pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-sm text-gray-600">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <Image
            src="/brand/logo.png"
            alt="SERVORA"
            width={640}
            height={203}
            className="h-9 w-auto"
          />
          <span>© {new Date().getFullYear()} SERVORA. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}