function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function toWhatsAppUrl(phone: string): string {
  return `https://wa.me/${digitsOnly(phone)}`
}

export function toTelUrl(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`
}

export function toMailtoUrl(email: string): string {
  return `mailto:${email.trim()}`
}
