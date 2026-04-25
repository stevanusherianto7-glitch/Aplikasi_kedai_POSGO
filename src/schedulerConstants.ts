import { ShiftType } from './types';

export const SHIFT_DETAILS: Record<string, { label: string; timeRange: string; color: string; code: string }> = {
  [ShiftType.Pagi]: {
    label: 'Pagi Shift',
    timeRange: '08:00 - 16:00',
    color: 'from-blue-500 to-blue-700',
    code: 'P'
  },
  [ShiftType.Middle]: {
    label: 'Middle Shift',
    timeRange: '12:00 - 20:00',
    color: 'from-emerald-500 to-emerald-700',
    code: 'M'
  },
  [ShiftType.Libur]: {
    label: 'Libur',
    timeRange: '-',
    color: 'from-rose-500 to-rose-700',
    code: 'O'
  }
};

export const SHIFT_CONFIGS = SHIFT_DETAILS;

export const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 
  'bg-fuchsia-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500'
];

export function getEmployeeInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateMonthDates(year: number, month: number) {
  const dates = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

export function generateShiftsFromPattern(year: number, month: number, employees: any[], pattern: Record<string, ShiftType[]>) {
  const shifts: Record<string, Record<string, ShiftType>> = {};
  const dates = generateMonthDates(year, month);
  
  employees.forEach(emp => {
    shifts[emp.id] = {};
    const empPattern = pattern[emp.id] || Array(7).fill(ShiftType.Libur);

    dates.forEach(dateStr => {
      const parts = dateStr.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const dayIndex = (date.getDay() + 6) % 7;
      shifts[emp.id][dateStr] = empPattern[dayIndex];
    });
  });

  return shifts;
}
