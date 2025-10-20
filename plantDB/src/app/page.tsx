import Link from 'next/link'

export default function Home() {
  const features = [
    { icon: '🔐', title: 'QR Code Generation', color: 'from-purple-500 to-pink-500' },
    { icon: '🧬', title: 'Lineage Tracking', color: 'from-blue-500 to-cyan-500' },
    { icon: '📸', title: 'Photo Management', color: 'from-green-500 to-emerald-500' },
    { icon: '✨', title: 'AI/ML Ready', color: 'from-yellow-500 to-orange-500' },
    { icon: '🧪', title: 'Trait Prediction', color: 'from-indigo-500 to-purple-500' },
    { icon: '📈', title: 'Market Analysis', color: 'from-red-500 to-pink-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block animate-float">
            <span className="text-8xl mb-6 block">🌿</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6">
            <span className="gradient-text">Cladari</span>
            <br />
            <span className="text-gray-800">Plant Management</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional plant management for breeding and conservation
            <br />
            <span className="text-lg text-emerald-600 font-semibold">
              67 Elite Plants • $11,469 Collection • RA Lineages
            </span>
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {[
              { label: 'Total Plants', value: '67', icon: '🌱' },
              { label: 'Investment', value: '$11.5K', icon: '💎' },
              { label: 'Breeding Lines', value: '12', icon: '🧬' },
              { label: 'Vendors', value: '14', icon: '📦' },
            ].map((stat, i) => (
              <div
                key={i}
                className="glass rounded-2xl px-6 py-4 animate-float"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Link
            href="/dashboard"
            className="group relative glass rounded-3xl p-8 hover-lift overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl text-white">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-gray-600">Real-time analytics and collection insights</p>
            </div>
          </Link>

          <Link
            href="/plants"
            className="group relative glass rounded-3xl p-8 hover-lift overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl text-white">🌱</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plant Collection</h3>
              <p className="text-gray-600">Browse and manage your anthurium specimens</p>
            </div>
          </Link>

          <Link
            href="/breeding"
            className="group relative glass rounded-3xl p-8 hover-lift overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl text-white">🧬</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Breeding Planner</h3>
              <p className="text-gray-600">Plan crosses and predict offspring traits</p>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="glass rounded-3xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="gradient-text">Advanced Features</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-2xl p-6 bg-white/50 hover:bg-white/80 transition-all duration-300 cursor-pointer hover-lift"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-800">{feature.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Elite Genetics Showcase */}
        <div className="glass rounded-3xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="gradient-text">Elite Genetics Collection</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { code: 'RA8', name: 'Papillilaminum', value: '$2,200', color: 'from-purple-500 to-indigo-600' },
              { code: 'RA5', name: '40x40 Line', value: '$1,500', color: 'from-pink-500 to-rose-600' },
              { code: 'RA6', name: 'Carlablackiae', value: '$800', color: 'from-emerald-500 to-teal-600' },
              { code: 'OG5', name: 'Original Line', value: '$600', color: 'from-amber-500 to-orange-600' },
            ].map((genetic) => (
              <div
                key={genetic.code}
                className="relative overflow-hidden rounded-2xl p-6 bg-white/50 hover:bg-white/80 transition-all duration-300 hover-lift"
              >
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${genetic.color} opacity-10 rounded-full -mr-10 -mt-10`} />
                <div className="relative">
                  <div className="text-2xl font-black text-gray-800 mb-1">{genetic.code}</div>
                  <div className="text-sm text-gray-600 mb-2">{genetic.name}</div>
                  <div className="text-lg font-bold gradient-text">{genetic.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center pb-20">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-full hover:from-emerald-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-xl"
          >
            Enter System
            <span className="ml-2">✨</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
