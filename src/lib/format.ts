export function formatKWD(amount: number): string {
  return (
    'KD ' +
    new Intl.NumberFormat('en-KW', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount)
  )
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
