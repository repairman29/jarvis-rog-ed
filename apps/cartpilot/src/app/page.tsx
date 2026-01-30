'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(70%_60%_at_50%_0%,_#f1f5ec_0%,_#fdfcf9_60%)]">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Nav */}
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#9caf88] rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🫒</span>
            </div>
            <span className="text-xl font-medium text-[#3a4529]">Olive</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline-flex items-center gap-2 text-[#87a05a]">
              <span className="w-2 h-2 bg-[#9caf88] rounded-full"></span>
              Friends & family beta
            </span>
            <Link
              href="/login"
              className="text-[#6b8245] hover:text-[#536538] transition font-medium"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-10 items-center mb-20">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-[#eef2e6] px-3 py-1.5 rounded-full text-[#6b8245] text-xs mb-6 shadow-sm">
              <span className="w-2 h-2 bg-[#9caf88] rounded-full"></span>
              Private beta • Invite-only
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-[#2d3a1f] mb-6 leading-tight">
              Taking the &lsquo;chore&rsquo; out of the grocery store
            </h1>
            <p className="text-lg text-[#536538] mb-8 leading-relaxed">
              Tell Olive what you need throughout the week. She&apos;ll find your favorites,
              clip the coupons, and have your Kroger cart ready when you are.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[#9caf88] text-white text-lg px-8 py-4 rounded-full hover:bg-[#87a05a] transition shadow-sm"
              >
                <span>Join the Beta</span>
                <span>→</span>
              </Link>
              <Link
                href="/login?then=connect"
                className="inline-flex items-center gap-2 border border-[#dce5cc] text-[#536538] text-lg px-7 py-4 rounded-full hover:bg-[#f8faf5] transition"
              >
                <span>🛒</span>
                <span>Continue with Kroger</span>
              </Link>
              <a
                href="https://www.kroger.com/shopping/cart"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-[#dce5cc] text-[#536538] text-lg px-7 py-4 rounded-full hover:bg-white transition"
              >
                View Kroger Cart
              </a>
            </div>
            <p className="text-xs text-[#87a05a] mt-4">
              Olive never checks out for you. You stay in control of every order.
            </p>
          </div>

          <div className="bg-white rounded-[32px] p-6 border border-[#eef2e6] shadow-sm">
            <div className="bg-[#f8faf5] rounded-3xl p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#9caf88] rounded-full flex items-center justify-center olive-pulse">
                  <span className="text-white">🫒</span>
                </div>
                <div>
                  <p className="text-[#2d3a1f] font-medium">Olive</p>
                  <p className="text-[#87a05a] text-xs">Kitchen companion</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-white rounded-2xl px-4 py-3 border border-[#eef2e6]">
                  &ldquo;Olive, we need sourdough and green apples.&rdquo;
                </div>
                <div className="bg-[#eef2e6] rounded-2xl px-4 py-3 text-[#3a4529]">
                  Added your usual sourdough. Fuji apples are on sale — want those?
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 border border-[#eef2e6]">
                  &ldquo;Yes, perfect.&rdquo;
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5 text-center text-xs text-[#6b8245]">
              <div className="bg-[#f8faf5] rounded-2xl py-3">
                <div className="text-lg">🏷️</div>
                Coupons
              </div>
              <div className="bg-[#f8faf5] rounded-2xl py-3">
                <div className="text-lg">⛽</div>
                Fuel points
              </div>
              <div className="bg-[#f8faf5] rounded-2xl py-3">
                <div className="text-lg">🛒</div>
                Ready cart
              </div>
            </div>
          </div>
        </div>

        {/* How it Works - Bento Style */}
        <div className="grid md:grid-cols-2 gap-4 mb-16">
          {/* Main Card */}
          <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-[#eef2e6] shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#eef2e6] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                💬
              </div>
              <div>
                <h3 className="text-xl font-medium text-[#2d3a1f] mb-2">Just tell her</h3>
                <p className="text-[#536538]">
                  &ldquo;Olive, we need milk&rdquo; — that&apos;s it. She finds your usual brand,
                  adds it to your cart, and keeps a running list as you go.
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Cards */}
          <div className="bg-white rounded-3xl p-6 border border-[#eef2e6] shadow-sm">
            <div className="text-3xl mb-3">🏷️</div>
            <h3 className="text-lg font-medium text-[#2d3a1f] mb-1">Coupons Clipped</h3>
            <p className="text-[#536538] text-sm">
              Olive finds digital deals on items you actually buy and applies them automatically.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#eef2e6] shadow-sm">
            <div className="text-3xl mb-3">⛽</div>
            <h3 className="text-lg font-medium text-[#2d3a1f] mb-1">Fuel Points Tracked</h3>
            <p className="text-[#536538] text-sm">
              She&apos;ll let you know when you&apos;re close to the next discount at the pump.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#eef2e6] shadow-sm">
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="text-lg font-medium text-[#2d3a1f] mb-1">Never Run Out</h3>
            <p className="text-[#536538] text-sm">
              Olive remembers your rhythm. She&apos;ll nudge you before the milk carton goes empty.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#eef2e6] shadow-sm">
            <div className="text-3xl mb-3">🛒</div>
            <h3 className="text-lg font-medium text-[#2d3a1f] mb-1">Ready for Checkout</h3>
            <p className="text-[#536538] text-sm">
              When you&apos;re ready, review your cart and head to Kroger for pickup. Easy.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {[
            { step: '1', title: 'Connect Kroger', text: 'Link your account once so Olive can build your cart.' },
            { step: '2', title: 'Add as you go', text: 'Drop items in whenever you think of them.' },
            { step: '3', title: 'Checkout anytime', text: 'Review and place the order when it suits you.' },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-3xl p-6 border border-[#eef2e6] shadow-sm">
              <div className="w-8 h-8 bg-[#eef2e6] rounded-full flex items-center justify-center text-sm font-medium text-[#536538] mb-3">
                {item.step}
              </div>
              <h3 className="text-[#2d3a1f] font-medium mb-2">{item.title}</h3>
              <p className="text-[#536538] text-sm">{item.text}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl p-8 border border-[#eef2e6] shadow-sm mb-12">
          <h3 className="text-xl font-medium text-[#2d3a1f] mb-4">Questions</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-[#536538]">
            <div>
              <p className="font-medium text-[#2d3a1f] mb-1">Does Olive place the order?</p>
              <p>No. Olive builds your cart, you review and checkout in Kroger.</p>
            </div>
            <div>
              <p className="font-medium text-[#2d3a1f] mb-1">Is this only for Kroger?</p>
              <p>For now, yes. It works across the Kroger family of stores.</p>
            </div>
            <div>
              <p className="font-medium text-[#2d3a1f] mb-1">What about substitutions?</p>
              <p>Olive will ask before swapping anything unless you say otherwise.</p>
            </div>
            <div>
              <p className="font-medium text-[#2d3a1f] mb-1">Is this free?</p>
              <p>During beta, yes. We just want feedback and real-world use.</p>
            </div>
          </div>
        </div>

        {/* Supported Stores */}
        <div className="text-center py-8 border-t border-[#eef2e6]">
          <p className="text-[#87a05a] text-sm mb-3">Works with the Kroger family</p>
          <div className="flex flex-wrap justify-center gap-6 text-[#536538] opacity-60">
            <span>Kroger</span>
            <span>King Soopers</span>
            <span>Fry&apos;s</span>
            <span>Ralphs</span>
            <span>Fred Meyer</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#eef2e6] py-6 bg-white/50">
        <div className="max-w-4xl mx-auto px-6 text-center text-[#87a05a] text-sm">
          <p>Made with care • Olive never places orders for you • Not affiliated with Kroger</p>
        </div>
      </footer>
    </main>
  )
}
