import * as React from "react";
import { Ingredient, Recipe, Employee, Transaction, Expense, Unit, RecipeItem, ShiftType, Attendance, RestaurantAsset } from "../types";
import { supabase } from "../lib/supabase";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DEFAULT_USER_ID = 'e57a0505-1234-5678-90ab-c0de57f17ac1';

export function useAppState() {
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [attendances, setAttendances] = React.useState<Attendance[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [dailyIncomes, setDailyIncomes] = React.useState<Expense[]>([]);
  const [restaurantAssets, setRestaurantAssets] = React.useState<RestaurantAsset[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = React.useState<any[]>([]);
  const [pettyCash, setPettyCash] = React.useState<number>(0);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [shifts, setShifts] = React.useState<Record<string, Record<string, ShiftType>>>({});
  const [weeklyPattern, setWeeklyPattern] = React.useState<Record<string, ShiftType[]>>({});
  const [isLoaded, setIsLoaded] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setIsSyncing(true);
      if (supabase) {
        // WORLD-CLASS DEFENSIVE FETCHING
        const fetchTable = async (table: string) => {
           const { data, error } = await supabase.from(table).select('*');
           if (error) { console.warn(`[SUPABASE] Error ${table}:`, error.message); return []; }
           return data || [];
        };

        const [ingD, recD, recItemsD, empD, txD, expD, assetD, logsD, attD, confD, incD, shiftD] = await Promise.all([
          fetchTable('ingredients'),
          fetchTable('hpp_recipes'),
          fetchTable('recipe_items'),
          fetchTable('employees'),
          fetchTable('transactions'),
          fetchTable('expenses'),
          fetchTable('assets'),
          fetchTable('maintenance_logs'),
          fetchTable('absensi'),
          fetchTable('app_config'),
          fetchTable('incomes'),
          fetchTable('shifts')
        ]);

        if (confD && Array.isArray(confD)) {
          const t = confD.find((s: any) => s.id === 'theme');
          if (t) setTheme(t.value as any);
          const p = confD.find((s: any) => s.id === 'petty_cash');
          if (p) setPettyCash(Number(p.value));
        }

        setIngredients((ingD || []).map((i: any) => ({
          id: i.id, name: i.name || 'Unnamed', category: i.category || 'General', purchasePrice: Number(i.purchase_price || 0),
          purchaseUnit: i.purchase_unit || 'kg', useUnit: (i.use_unit as Unit) || 'gr', conversionValue: Number(i.conversion_value || 1),
          stockQuantity: Number(i.stock_quantity || 0), lowStockThreshold: Number(i.low_stock_threshold || 0)
        })));

        setRecipes((recD || []).map((r: any) => ({
          id: r.id, name: r.name || 'Unnamed Recipe', category: r.category || 'Makanan',
          sellingPrice: Number(r.selling_price || 0),
          markupPercent: Number(r.markup_percent || 0), laborCost: Number(r.labor_cost || 0), overheadCost: Number(r.overhead_cost || 0),
          shrinkagePercent: Number(r.shrinkage_percent || 0), roundedSellingPrice: r.rounded_selling_price ? Number(r.rounded_selling_price) : undefined,
          items: (recItemsD || []).filter((ri: any) => ri.recipe_id === r.id).map((ri: any) => ({ id: ri.id, ingredientId: ri.ingredient_id, quantityNeeded: Number(ri.quantity_needed || 0) })),
          overheadBreakdown: r.overhead_breakdown || {}
        })));

        setEmployees((empD || []).map((e: any) => ({ id: e.id, name: e.name, role: e.role, salary: Number(e.salary || 0), avatarColor: e.avatar_color, initials: e.initials })));

        setTransactions((txD || []).map((t: any) => ({
           id: t.id,
           date: t.timestamp,
           totalPrice: Number(t.total_price || 0),
           totalHpp: 0,
           paymentMethod: t.payment_method || 'Tunai',
           timestamp: new Date(t.timestamp || Date.now()),
           orderNumber: t.order_number,
           sequenceNumber: t.sequence_number || 1,
           items: Array.isArray(t.items) ? t.items : []
        })));

        setExpenses((expD || []).map((e: any) => ({ id: e.id, date: e.date, description: e.description, amount: Number(e.amount || 0), category: e.category })));
        setRestaurantAssets((assetD || []).map((a: any) => ({ id: a.id, name: a.name, category: a.category, quantity: Number(a.quantity || 0), price: Number(a.price || 0) })));
        setMaintenanceLogs(logsD || []);
        setAttendances((attD || []).map((a: any) => ({ id: a.id, employeeId: a.employee_id, date: a.date, status: a.status as any })));

        const ms: Record<string, Record<string, ShiftType>> = {};
        if (Array.isArray(shiftD)) {
           shiftD.forEach((s: any) => { if (!ms[s.employee_id]) ms[s.employee_id] = {}; ms[s.employee_id][s.date] = s.type as ShiftType; });
        }
        setShifts(ms);

        setDailyIncomes((incD || []).map((i: any) => ({ id: i.id, date: i.date, description: i.description, amount: Number(i.amount || 0), category: i.category as any })));
      }
    } catch (e) { console.error("System Exception during State Load:", e); }
    finally { setIsLoaded(true); setIsSyncing(false); }
  }, []);

  React.useEffect(() => {
    loadData();
    if (supabase) {
      const c1 = supabase.channel('assets-real').on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => loadData()).subscribe();
      const c2 = supabase.channel('absensi-real').on('postgres_changes', { event: '*', schema: 'public', table: 'absensi' }, () => loadData()).subscribe();
      const c3 = supabase.channel('recipe-real').on('postgres_changes', { event: '*', schema: 'public', table: 'hpp_recipes' }, () => loadData()).subscribe();
      return () => { supabase.removeChannel(c1); supabase.removeChannel(c2); supabase.removeChannel(c3); };
    }
  }, [loadData]);

  const toggleTheme = () => {
    const n = theme === 'light' ? 'dark' : 'light';
    setTheme(n);
    if (supabase) supabase.from('app_config').upsert({ id: 'theme', value: n });
  };

  const handleAddIngredient = async (i: Partial<Ingredient>, cb?: (v: boolean) => void) => {
    if (!i.name || (i.purchasePrice || 0) <= 0) return;
    const ing: Ingredient = { ...i as Ingredient, name: i.name.trim(), id: generateId() };
    setIngredients(prev => [...prev, ing]);
    if (cb) cb(false);
    if (supabase) await supabase.from('ingredients').insert([{ ...ing, purchase_price: ing.purchasePrice, purchase_unit: ing.purchaseUnit, use_unit: ing.useUnit, conversion_value: ing.conversionValue, stock_quantity: ing.stockQuantity, low_stock_threshold: ing.lowStockThreshold, user_id: DEFAULT_USER_ID }]);
  };

  const deleteIngredient = async (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
    if (supabase) await supabase.from('ingredients').delete().eq('id', id);
  };

  const handleUpdateIngredient = async (i: Ingredient) => {
    setIngredients(prev => prev.map(old => old.id === i.id ? i : old));
    if (supabase) await supabase.from('ingredients').update({ name: i.name, category: i.category, purchase_price: i.purchasePrice, purchase_unit: i.purchase_unit, use_unit: i.use_unit, conversion_value: i.conversionValue, stock_quantity: i.stockQuantity, low_stock_threshold: i.lowStockThreshold }).eq('id', i.id);
  };

  const handleAddRecipe = async (r: Recipe) => {
    if (supabase) {
      try {
        const recipeData = {
          name: r.name,
          category: r.category || 'Makanan',
          selling_price: r.sellingPrice,
          user_id: DEFAULT_USER_ID
        };

        const [res1, res2] = await Promise.all([
          supabase.from('hpp_recipes').insert([recipeData]).select(),
          supabase.from('products').insert([{ name: r.name, category: r.category, price: r.sellingPrice }])
        ]);

        if (res1.data?.[0]) {
          const nr = { ...r, id: res1.data[0].id };
          setRecipes(prev => [...prev, nr]);
          return nr;
        }
      } catch (e) { console.error(e); }
    }
    setRecipes(prev => [...prev, r]);
  };

  const handleUpdateRecipe = async (r: Recipe) => {
    setRecipes(prev => prev.map(old => old.id === r.id ? r : old));
    if (supabase) {
      const price = r.roundedSellingPrice || r.sellingPrice || 0;
      await Promise.all([
        supabase.from('hpp_recipes').update({ name: r.name, category: r.category, selling_price: r.sellingPrice, markup_percent: r.markupPercent, labor_cost: r.laborCost, overhead_cost: r.overhead_cost, shrinkage_percent: r.shrinkage_percent, rounded_selling_price: r.roundedSellingPrice, overhead_breakdown: r.overheadBreakdown }).eq('id', r.id),
        supabase.from('products').update({ name: r.name, category: r.category, price: price }).eq('name', r.name)
      ]);
      await supabase.from('recipe_items').delete().eq('recipe_id', r.id);
      if (r.items.length > 0) await supabase.from('recipe_items').insert(r.items.map(it => ({ id: generateId(), recipe_id: r.id, ingredient_id: it.ingredientId, quantity_needed: it.quantityNeeded })));
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    const r = recipes.find(x => x.id === id);
    setRecipes(prev => prev.filter(x => x.id !== id));
    if (supabase) {
      await Promise.all([
        supabase.from('hpp_recipes').delete().eq('id', id),
        r ? supabase.from('products').delete().eq('name', r.name) : Promise.resolve()
      ]);
    }
  };

  const handleProcessTransaction = async (t: Transaction) => {
    const ft: Transaction = { ...t, date: new Date().toISOString() };
    setTransactions(prev => [ft, ...prev]);
    if (supabase) {
      try {
        await supabase.from('transactions').insert([{
           id: ft.id,
           total_price: ft.totalPrice,
           payment_method: ft.paymentMethod || 'Tunai',
           items: ft.items,
           timestamp: ft.date
        }]);
        loadData();
      } catch (e) {}
    }
    return ft;
  };

  const handleVoidTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (supabase) { await supabase.from('transactions').delete().eq('id', id); loadData(); }
  };

  const handleSaveEmployee = async (e: Partial<Employee>, eid: string | null) => {
    if (!e.name) return;
    if (eid) {
      setEmployees(prev => prev.map(old => old.id === eid ? { ...old, ...e as Employee } : old));
      if (supabase) await supabase.from('employees').update({ name: e.name, role: e.role, salary: e.salary, avatar_color: (e as any).avatarColor, initials: (e as any).initials }).eq('id', eid);
    } else {
      const ne: Employee = { ...e as Employee, id: generateId() };
      setEmployees(prev => [...prev, ne]);
      if (supabase) await supabase.from('employees').insert([{ ...ne, user_id: DEFAULT_USER_ID }]);
    }
  };

  const deleteEmployee = async (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (supabase) await supabase.from('employees').delete().eq('id', id);
  };

  const handleAddExpense = async (e: Partial<Expense>) => {
    if (!e.description || !e.amount) return;
    const ex: Expense = { id: generateId(), date: new Date().toISOString(), description: e.description, amount: Number(e.amount), category: e.category as any };
    setExpenses(prev => [ex, ...prev]);
    if (supabase) await supabase.from('expenses').insert([{ id: ex.id, date: ex.date, description: ex.description, amount: ex.amount, category: ex.category, user_id: DEFAULT_USER_ID }]);
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (supabase) await supabase.from('expenses').delete().eq('id', id);
  };

  const handleUpdateDailyIncome = async (i: Partial<Expense>) => {
    if (!i.description || !i.amount) return;
    const inc: Expense = { id: generateId(), date: new Date().toISOString(), description: i.description, amount: Number(i.amount), category: 'Pemasukan' as any };
    setDailyIncomes(prev => [inc, ...prev]);
    if (supabase) await supabase.from('incomes').insert([{ id: inc.id, description: inc.description, amount: inc.amount, date: inc.date, user_id: DEFAULT_USER_ID }]);
  };

  const handleDeleteDailyIncome = async (id: string) => {
    setDailyIncomes(prev => prev.filter(inc => inc.id !== id));
    if (supabase) await supabase.from('incomes').delete().eq('id', id);
  };

  const toggleAttendance = async (eid: string, d: string, s: Attendance['status']) => {
    const ex = attendances.find(a => a.employeeId === eid && a.date === d);
    if (ex) {
      if (ex.status === s) {
        setAttendances(prev => prev.filter(a => a.id !== ex.id));
        if (supabase) await supabase.from('absensi').delete().eq('id', ex.id);
      } else {
        setAttendances(prev => prev.map(a => a.id === ex.id ? { ...a, status: s } : a));
        if (supabase) await supabase.from('absensi').update({ status: s }).eq('id', ex.id);
      }
    } else {
      const na: Attendance = { id: generateId(), employeeId: eid, date: d, status: s };
      setAttendances(prev => [...prev, na]);
      if (supabase) await supabase.from('absensi').insert([{ id: na.id, employee_id: eid, date: d, status: s, user_id: DEFAULT_USER_ID }]);
    }
  };

  const handleUpdateShift = async (eid: string, d: string, t: ShiftType) => {
    setShifts(prev => ({ ...prev, [eid]: { ...(prev[eid] || {}), [d]: t } }));
    if (supabase) await supabase.from('shifts').upsert({ employee_id: eid, date: d, type: t, user_id: DEFAULT_USER_ID }, { onConflict: 'employee_id,date' });
  };

  const handleSaveAsset = async (a: Partial<RestaurantAsset>, eid: string | null) => {
    if (eid) {
      setRestaurantAssets(prev => prev.map(old => old.id === eid ? { ...old, ...a as RestaurantAsset } : old));
      if (supabase) await supabase.from('assets').update({ name: a.name, category: a.category, quantity: a.quantity, price: a.price }).eq('id', eid);
    } else {
      const na = { ...a as RestaurantAsset, id: generateId() };
      setRestaurantAssets(prev => [...prev, na]);
      if (supabase) await supabase.from('assets').insert([{
         id: na.id,
         name: na.name,
         category: na.category,
         quantity: na.quantity,
         price: na.price,
         user_id: DEFAULT_USER_ID
      }]);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    setRestaurantAssets(prev => prev.filter(a => a.id !== id));
    if (supabase) await supabase.from('assets').delete().eq('id', id);
  };

  const handleAddMaintenance = async (l: any, a: RestaurantAsset) => {
    if (supabase) {
      const { error } = await supabase.from('maintenance_logs').insert([l]);
      if (!error) {
        setMaintenanceLogs(prev => [l, ...prev]);
      }
    }
  };

  const handleBackup = () => {
    const d = { ingredients, recipes, employees, transactions, expenses, pettyCash, shifts: {}, weeklyPattern: {}, attendances };
    const b = new Blob([JSON.stringify(d)], {type: 'application/json'});
    const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = `posgo_backup_${new Date().toISOString()}.json`; a.click();
  };

  const handleRestore = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const d = JSON.parse(e.target?.result as string);
        setIngredients(d.ingredients || []); setRecipes(d.recipes || []); setEmployees(d.employees || []); setTransactions(d.transactions || []); alert("Data berhasil dipulihkan!");
      } catch (err) { alert("Gagal memulihkan data. Pastikan file backup valid."); }
    };
    r.readAsText(f);
  };

  return {
    ingredients, setIngredients, recipes, setRecipes, employees, setEmployees, transactions, setTransactions, expenses, setExpenses, pettyCash, setPettyCash,
    isLoaded, loadData, deleteIngredient, deleteEmployee, handleBackup, handleRestore, handleAddIngredient, handleUpdateIngredient, handleAddExpense, handleDeleteExpense, handleSaveEmployee, handleProcessTransaction,
    handleAddRecipe, handleUpdateRecipe, handleDeleteRecipe, handleUpdateDailyIncome, handleDeleteDailyIncome, handleVoidTransaction, shifts, setShifts, handleUpdateShift, weeklyPattern, setWeeklyPattern, attendances, setAttendances,
    toggleAttendance, theme, toggleTheme, isSyncing, dailyIncomes, restaurantAssets, setRestaurantAssets, maintenanceLogs, handleSaveAsset, handleDeleteAsset, handleAddMaintenance, isModalOpen, setIsModalOpen
  };
}
