import { Leaf, Dna, BarChart3, Camera, Thermometer, QrCode } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Clean and restrained */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4 tracking-tight">
            Cladari
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-xl leading-relaxed">
            Plant management software for breeding programs. Track lineage, log care, monitor environments, and document provenance.
          </p>
          <a
            href="mailto:dave@cladari.ai?subject=Cladari%20Inquiry"
            className="inline-block px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
          >
            Request Access
          </a>
        </div>
      </div>

      {/* Features - Simple list, not flashy cards */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-8">
          Capabilities
        </h2>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Dna className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-900">Breeding Pipeline</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-7">
              Track crosses from pollination through harvest, germination, and selection. Full lineage documentation for every accession.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <Camera className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-900">Photo Analysis</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-7">
              AI-assisted health assessment from plant photos. Identify issues, track morphology changes, and document growth over time.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <Thermometer className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-900">Environmental Monitoring</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-7">
              SensorPush integration for temperature, humidity, and VPD tracking. Correlate growing conditions with plant performance.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-900">Substrate Analytics</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-7">
              EC and pH tracking for inputs and runoff. Detect acidification trends and nutrient buildup before problems emerge.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <QrCode className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-900">QR Labeling</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-7">
              Generate and print QR labels. Scan to log care, view plant history, or batch-update entire growing areas.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <Leaf className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-900">Complete History</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-7">
              Unified timeline of care logs, measurements, morphology notes, and observations. The full biography of each plant.
            </p>
          </div>
        </div>
      </div>

      {/* Use Cases - Understated */}
      <div className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-8">
            Built For
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Breeders</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Documented crosses, selection tracking, and lineage verification for serious breeding programs.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Specialty Nurseries</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Inventory management, propagation tracking, and provenance documentation for high-value plants.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Conservation</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ex-situ collection management, wild origin documentation, and genetic diversity preservation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
            Currently in private development, built for production use with a specialty Anthurium collection.
            Interested in early access for your breeding program or nursery?
            <a href="mailto:dave@cladari.ai" className="text-gray-900 hover:underline ml-1">Get in touch.</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>&copy; 2025 Cladari</span>
            <span>Fort Lauderdale, FL</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
