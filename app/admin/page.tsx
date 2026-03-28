'use client'

import { useState, useEffect, useCallback } from 'react'
import { Apartment } from '@/lib/supabase'
import Link from 'next/link'

type PairRow = {
  id: string
  date: string
  apartment_a: Apartment
  apartment_b: Apartment
  votes_a: number
  votes_b: number
}

export default function AdminPage() {
  const [pairs, setPairs] = useState<PairRow[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  // Apartment form state
  const [aptForm, setAptForm] = useState({
    city: '',
    neighborhood: '',
    address_label: '',
    rent_monthly: '',
    beds: '',
    baths: '',
    sqft: '',
    photo_url: '',
  })

  // Pair form state
  const [pairForm, setPairForm] = useState({
    date: '',
    apartment_a_id: '',
    apartment_b_id: '',
  })

  const fetchData = useCallback(async () => {
    const [pairsRes, aptsRes] = await Promise.all([
      fetch('/api/pairs'),
      fetch('/api/apartments'),
    ])
    const pairsData = await pairsRes.json()
    const aptsData = await aptsRes.json()
    setPairs(pairsData)
    setApartments(aptsData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddApartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Adding apartment...')
    const res = await fetch('/api/apartments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...aptForm,
        rent_monthly: parseInt(aptForm.rent_monthly),
        beds: parseFloat(aptForm.beds),
        baths: parseFloat(aptForm.baths),
        sqft: parseInt(aptForm.sqft),
      }),
    })
    if (res.ok) {
      setStatus('Apartment added!')
      setAptForm({ city: '', neighborhood: '', address_label: '', rent_monthly: '', beds: '', baths: '', sqft: '', photo_url: '' })
      fetchData()
    } else {
      const err = await res.json()
      setStatus('Error: ' + err.error)
    }
  }

  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Scheduling pair...')
    const res = await fetch('/api/pairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pairForm),
    })
    if (res.ok) {
      setStatus('Pair scheduled!')
      setPairForm({ date: '', apartment_a_id: '', apartment_b_id: '' })
      fetchData()
    } else {
      const err = await res.json()
      setStatus('Error: ' + err.error)
    }
  }

  const inputClass = "w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-teal-500 transition-colors"
  const labelClass = "block text-white/60 text-xs mb-1 font-medium"

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-teal-400 font-black text-xl">Rentle</Link>
          <span className="text-white/30 text-sm">/ Admin</span>
        </div>
        {status && (
          <p className={`text-sm ${status.startsWith('Error') ? 'text-red-400' : 'text-teal-400'}`}>
            {status}
          </p>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Pairs List */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">Daily Pairs</h2>
          {loading ? (
            <p className="text-white/40 text-sm">Loading...</p>
          ) : pairs.length === 0 ? (
            <p className="text-white/40 text-sm">No pairs yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="text-left text-white/50 font-medium px-4 py-3">Date</th>
                    <th className="text-left text-white/50 font-medium px-4 py-3">Apartment A</th>
                    <th className="text-left text-white/50 font-medium px-4 py-3">Apartment B</th>
                    <th className="text-right text-white/50 font-medium px-4 py-3">Votes A</th>
                    <th className="text-right text-white/50 font-medium px-4 py-3">Votes B</th>
                  </tr>
                </thead>
                <tbody>
                  {pairs.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-white font-mono">{p.date}</td>
                      <td className="px-4 py-3 text-white/70">
                        {p.apartment_a ? `${p.apartment_a.city} — ${p.apartment_a.neighborhood} ($${p.apartment_a.rent_monthly.toLocaleString()})` : '—'}
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {p.apartment_b ? `${p.apartment_b.city} — ${p.apartment_b.neighborhood} ($${p.apartment_b.rent_monthly.toLocaleString()})` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-teal-400 font-medium">{p.votes_a}</td>
                      <td className="px-4 py-3 text-right text-teal-400 font-medium">{p.votes_b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Apartment */}
          <section>
            <h2 className="text-white font-bold text-lg mb-4">Add Apartment</h2>
            <form onSubmit={handleAddApartment} className="space-y-3 bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
              <div>
                <label className={labelClass}>City</label>
                <input className={inputClass} placeholder="New York" value={aptForm.city}
                  onChange={e => setAptForm(f => ({ ...f, city: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>Neighborhood</label>
                <input className={inputClass} placeholder="Brooklyn Heights" value={aptForm.neighborhood}
                  onChange={e => setAptForm(f => ({ ...f, neighborhood: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>Address Label</label>
                <input className={inputClass} placeholder="123 Main St, Apt 4B" value={aptForm.address_label}
                  onChange={e => setAptForm(f => ({ ...f, address_label: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Monthly Rent ($)</label>
                  <input className={inputClass} type="number" placeholder="3500" value={aptForm.rent_monthly}
                    onChange={e => setAptForm(f => ({ ...f, rent_monthly: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelClass}>Sq Ft</label>
                  <input className={inputClass} type="number" placeholder="750" value={aptForm.sqft}
                    onChange={e => setAptForm(f => ({ ...f, sqft: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Beds</label>
                  <input className={inputClass} type="number" step="0.5" placeholder="2" value={aptForm.beds}
                    onChange={e => setAptForm(f => ({ ...f, beds: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelClass}>Baths</label>
                  <input className={inputClass} type="number" step="0.5" placeholder="1" value={aptForm.baths}
                    onChange={e => setAptForm(f => ({ ...f, baths: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className={labelClass}>Photo URL</label>
                <input className={inputClass} type="url" placeholder="https://..." value={aptForm.photo_url}
                  onChange={e => setAptForm(f => ({ ...f, photo_url: e.target.value }))} required />
              </div>
              <button type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm transition-colors">
                Add Apartment
              </button>
            </form>
          </section>

          {/* Schedule Pair */}
          <section>
            <h2 className="text-white font-bold text-lg mb-4">Schedule Daily Pair</h2>
            <form onSubmit={handleAddPair} className="space-y-3 bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
              <div>
                <label className={labelClass}>Date</label>
                <input className={inputClass} type="date" value={pairForm.date}
                  onChange={e => setPairForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>Apartment A</label>
                <select className={inputClass} value={pairForm.apartment_a_id}
                  onChange={e => setPairForm(f => ({ ...f, apartment_a_id: e.target.value }))} required>
                  <option value="">Select apartment...</option>
                  {apartments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.city} — {a.neighborhood} (${a.rent_monthly.toLocaleString()}/mo)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Apartment B</label>
                <select className={inputClass} value={pairForm.apartment_b_id}
                  onChange={e => setPairForm(f => ({ ...f, apartment_b_id: e.target.value }))} required>
                  <option value="">Select apartment...</option>
                  {apartments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.city} — {a.neighborhood} (${a.rent_monthly.toLocaleString()}/mo)
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm transition-colors">
                Schedule Pair
              </button>

              {apartments.length === 0 && (
                <p className="text-white/30 text-xs text-center">Add apartments first before scheduling a pair.</p>
              )}
            </form>

            {/* Apartment list preview */}
            {apartments.length > 0 && (
              <div className="mt-4">
                <p className="text-white/40 text-xs mb-2">{apartments.length} apartment(s) in database</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {apartments.map(a => (
                    <div key={a.id} className="bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                      <div>
                        <span className="text-white/80 text-xs font-medium">{a.city} — {a.neighborhood}</span>
                        <span className="text-white/40 text-xs ml-2">{a.beds}bd/{a.baths}ba · {a.sqft} sqft</span>
                      </div>
                      <span className="text-teal-400 text-xs font-semibold">${a.rent_monthly.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
