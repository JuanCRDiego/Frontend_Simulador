import React from 'react'

export function NumeroInput({ label, valor, onChange, min, max }) {
  return (
    <label className="text-sm text-slate-700">
      {label}
      <input
        className="mt-1 w-full border rounded-lg px-3 py-2"
        type="number"
        value={valor ?? ''}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
