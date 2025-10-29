export class Suelo {
  constructor({
    alturaReferencia = 0,
    rutaImagen = '',
  } = {}) {
    this.alturaReferencia = Math.max(0, Number(alturaReferencia) || 0)
    this.rutaImagen = rutaImagen || ''
  }

  obtenerAltura() {
    return this.alturaReferencia
  }

  snapshot(extra = {}) {
    return {
      alturaReferencia: this.alturaReferencia,
      rutaImagen: this.rutaImagen,
      ...extra,
    }
  }
}
