'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, Plus, GitBranch } from 'lucide-react'

export default function BreedingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Breeding Planner
            </span>
          </h1>
          <p className="text-gray-600">Plan crosses and predict offspring traits</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">New Cross</h2>
                <p className="text-sm text-gray-600">Plan a new breeding cross</p>
              </div>
            </div>
            <button className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700">
              <Plus className="w-5 h-5 inline mr-2" />
              Create New Cross
            </button>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Breeding History</h2>
                <p className="text-sm text-gray-600">View past crosses and results</p>
              </div>
            </div>
            <div className="text-center py-8 text-gray-500">
              <p>No breeding records yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}