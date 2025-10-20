'use client'

import Link from 'next/link'
import { ArrowLeft, Dna, Activity, TrendingUp, BarChart3 } from 'lucide-react'

export default function GeneticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Genetics Analysis
            </span>
          </h1>
          <p className="text-gray-600">Analyze genetic traits and lineages</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Dna className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Genetic Lines</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Elite Genetics</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Trait Success</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Lineage Distribution</h2>
          </div>
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl mb-2">Genetics analysis coming soon</p>
            <p className="text-sm">Track trait inheritance and predict outcomes</p>
          </div>
        </div>
      </div>
    </div>
  )
}