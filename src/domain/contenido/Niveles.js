export class Nivel {
  constructor({
    id = null,
    numero = '',
    nombre = '',
    descripcion = '',
    tema = null,
    estado = 'ACTIVO',
    formulas = [],
    creadoEn = null,
  } = {}) {
    this.id = normalizarNumero(id)
    this.numero = numero ?? ''
    this.nombre = nombre ?? ''
    this.descripcion = descripcion ?? ''
    this.tema = tema ?? null
    this.estado = estado ?? 'ACTIVO'
    this.formulas = Array.isArray(formulas) ? formulas.slice() : normalizarFormulas(formulas)
    this.creadoEn = creadoEn ?? null
  }

  get desc() {
    return this.descripcion
  }

  estaActivo() {
    return this.estado !== 'INACTIVO'
  }

  formulasClave() {
    return this.formulas.map((item) => String(item).trim()).filter(Boolean)
  }

  toJSON() {
    return {
      id: this.id,
      numero: this.numero,
      nombre: this.nombre,
      descripcion: this.descripcion,
      tema: this.tema,
      estado: this.estado,
      formulas: this.formulas.slice(),
      creadoEn: this.creadoEn,
      desc: this.descripcion,
    }
  }

  clone() {
    return new Nivel(this.toJSON())
  }

  static desdeJSON(json = {}) {
    return new Nivel(json)
  }
}




export class Niveles {
  static niveles = [
    new Nivel({
      id: 1,
      numero: '1',
      nombre: 'Trabajo: fuerza constante',
      tema: 'trabajo-constante',
      descripcion: 'Trabajo mecánico con fuerzas constantes',
      formulas: ['W = F·d', 'W_net = W_aplicado + W_fric'],
    }),
    new Nivel({
      id: 2,
      numero: '2',
      nombre: 'Trabajo: fuerza variable',
      tema: 'trabajo-variable',
      descripcion: 'Trabajo con fuerzas dependientes de la distancia',
      formulas: ['W = ∫ F(x) dx'],
    }),
    new Nivel({
      id: 3,
      numero: '3',
      nombre: 'Energía Cinética',
      tema: 'energia-cinetica',
      descripcion: 'Relación trabajo–energía',
      formulas: ['K = ½ m v²', 'W_net = ΔK'],
    }),
    new Nivel({
      id: 4,
      numero: '4',
      nombre: 'Potencia',
      tema: 'potencia',
      descripcion: 'Tasa de trabajo',
      formulas: ['P = dW/dt', 'P = F·v'],
    }),
    new Nivel({
      id: 5,
      numero: '5',
      nombre: 'Fuerzas Conservativas',
      tema: 'conservativas',
      descripcion: 'E_m se conserva',
      formulas: ['W_conserv = -ΔU', 'E_m = cte'],
    }),
  ]

  static list() {
    return this.niveles.map((nivel) => nivel.clone())
  }

  static findById(id) {
    if (id === null || id === undefined) return null
    const numero = normalizarNumero(id)
    const encontrado = this.niveles.find((nivel) => String(nivel.id) === String(numero))
    return encontrado ? encontrado.clone() : null
  }
}

function normalizarNumero(valor) {
  if (valor === null || valor === undefined) return null
  const numero = Number(valor)
  return Number.isNaN(numero) ? valor : numero
}

function normalizarFormulas(formulas) {
  if (!formulas) return []
  if (Array.isArray(formulas)) return formulas.slice()
  const texto = String(formulas).trim()
  if (!texto) return []
  try {
    const posibleJSON = JSON.parse(texto)
    if (Array.isArray(posibleJSON)) {
      return posibleJSON
    }
  } catch {
    // Ignorar si no es JSON válido.
  }
  return texto.split(/\r?\n|\s*\|\s*/).map((item) => item.trim()).filter(Boolean)
}
