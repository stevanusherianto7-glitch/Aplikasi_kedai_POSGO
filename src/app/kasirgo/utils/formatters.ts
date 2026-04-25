export const formatIDR = (amount: number | string | undefined) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num).replace('Rp', 'Rp\u00A0');
};

export const formatDate = (dateInput: Date | string | undefined) => {
  if (!dateInput) return '00/00/0000, 00:00:00';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '00/00/0000, 00:00:00';
    const formatter = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
    return `${getPart('day')}/${getPart('month')}/${getPart('year')}, ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
  } catch (e) {
    return '00/00/0000, 00:00:00';
  }
};
