export class ContenidoTematico {
  constructor({
    id = null,
    nombre = '',
    descripcion = '',
    icono = '',
    formulas = '',
    estado = null,
    creadoPor = null,
    creadoEn = null,
    actualizadoEn = null,
  } = {}) {
    this.id = normalizarNumero(id)
    this.nombre = nombre ?? ''
    this.descripcion = descripcion ?? ''
    this.icono = icono ?? ''
    this.formulas = formulas ?? ''
    this.estado = estado ?? null
    this.creadoPor = creadoPor ?? null
    this.creadoEn = creadoEn ?? null
    this.actualizadoEn = actualizadoEn ?? null
  }

  formulasClave() {
    if (!this.formulas) return []
    if (Array.isArray(this.formulas)) {
      return this.formulas.map((item) => String(item).trim()).filter(Boolean)
    }
    const texto = String(this.formulas).trim()
    if (!texto) return []
    try {
      const posibleJSON = JSON.parse(texto)
      if (Array.isArray(posibleJSON)) {
        return posibleJSON.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      // Ignorar texto que no sea JSON válido.
    }
    return texto.split(/\r?\n|\s*\|\s*/).map((item) => item.trim()).filter(Boolean)
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      icono: this.icono,
      formulas: this.formulas,
      estado: this.estado,
      creadoPor: this.creadoPor,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    }
  }

  clone() {
    return new ContenidoTematico(this.toJSON())
  }

  static desdeJSON(json = {}) {
    return new ContenidoTematico(json)
  }
}

function normalizarNumero(valor) {
  if (valor === null || valor === undefined) return null
  const numero = Number(valor)
  return Number.isNaN(numero) ? valor : numero
}
