export class Pista {
  constructor({
    rutaImagen = '',
    posX = 0,
    posY = 0,
    ancho = 0,
    alto = 0,
  } = {}) {
    this.rutaImagen = rutaImagen || ''
    this.posX = Number(posX) || 0
    this.posY = Number(posY) || 0
    this.ancho = Math.max(0, Number(ancho) || 0)
    this.alto = Math.max(0, Number(alto) || 0)
    this.tipo = 'pista'
  }
}
