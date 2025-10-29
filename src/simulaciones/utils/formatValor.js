export function formatValor(valor) {
  if (valor === null || valor === undefined) return '—'
  const numero = Number(valor)
  if (Number.isNaN(numero)) return '—'
  if (!Number.isFinite(numero)) return '—'
  if (Math.abs(numero) >= 1000) return numero.toFixed(0)
  if (Math.abs(numero) >= 1) return numero.toFixed(2)
  return numero.toPrecision(3)
}
