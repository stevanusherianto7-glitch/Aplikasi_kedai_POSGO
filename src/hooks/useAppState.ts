import * as React from "react";
import { Ingredient, Recipe, Employee, Transaction, Expense, Unit, RecipeItem, ShiftType, Attendance, RestaurantAsset } from "../types";
import { supabase } from "../lib/supabase";
import { ERP_ENGINE } from "../services/erpEngine";

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
        const results = await Promise.all([
          supabase.from('ingredients').select('*'),
          supabase.from('hpp_recipes').select('*, recipe_items(*)'),
          supabase.from('employees').select('*'),
          supabase.from('riwayat_transaksi').select('*, order_items(*)').order('created_at', { ascending: false }).limit(100),
          supabase.from('catatan pengeluaran harian').select('*').order('created_at', { ascending: false }),
          supabase.from('kedai_assets').select('*'),
          supabase.from('kedai_maintenance_logs').select('*').order('date', { ascending: false }),
          supabase.from('absensi').select('*'),
          supabase.from('app_config').select('*'),
          supabase.from('pemasukan_harian').select('*'),
          supabase.from('shift_patterns').select('*'),
          supabase.from('katalog _menu_baru').select('*')
        ]);

        const [ingD, recD, empD, txD, expD, assetD, logsD, attD, confD, incD, pattD, catalogD] = results.map(r => r.data || []);

        // ─── DATA PARITY CHECK: HPP vs Catalog ───
        if (recD.length > 0 && catalogD) {
          const catalogNames = new Set(catalogD.map((c: any) => c.name));
          const missingInCatalog = recD.filter((r: any) => !catalogNames.has(r.name));

          if (missingInCatalog.length > 0) {
            console.log(`Syncing ${missingInCatalog.length} missing recipes to catalog...`);
            await supabase.from('katalog _menu_baru').insert(missingInCatalog.map((r: any) => ({
              name: r.name,
              menu_kasir: r.category || 'Makanan',
              price: r.rounded_selling_price || r.selling_price || 0,
              user_id: DEFAULT_USER_ID
            })));
          }
        }

        if (confD) {
          const t = confD.find((s: any) => s.id === 'theme');
          if (t) setTheme(t.value as any);
          const p = confD.find((s: any) => s.id === 'petty_cash');
          if (p) setPettyCash(Number(p.value));
        }

        if (pattD.length > 0) {
          const m: Record<string, ShiftType[]> = {};
          pattD.forEach((p: any) => {
            try { m[p.employee_id] = typeof p.pattern === 'string' ? JSON.parse(p.pattern) : p.pattern; } catch (e) {}
          });
          setWeeklyPattern(m);
        }

        if (ingD) setIngredients(ingD.map((i: any) => ({
          id: i.id, name: i.name, category: i.category, purchasePrice: Number(i.purchase_price),
          purchaseUnit: i.purchase_unit, useUnit: i.use_unit as Unit, conversionValue: Number(i.conversion_value),
          stockQuantity: Number(i.stock_quantity), lowStockThreshold: Number(i.low_stock_threshold)
        })));

        if (recD) setRecipes(recD.map((r: any) => ({
          id: r.id, name: r.name, category: r.category || 'Makanan', sellingPrice: Number(r.selling_price),
          markupPercent: Number(r.markup_percent), laborCost: Number(r.labor_cost), overheadCost: Number(r.overhead_cost),
          shrinkagePercent: Number(r.shrinkage_percent), roundedSellingPrice: r.rounded_selling_price ? Number(r.rounded_selling_price) : undefined,
          items: (r.recipe_items || []).map((ri: any) => ({ id: ri.id, ingredientId: ri.ingredient_id, quantityNeeded: Number(ri.quantity_needed) }))
        })));

        if (empD) setEmployees(empD.map((e: any) => ({ id: e.id, name: e.name, role: e.role, salary: Number(e.salary), avatarColor: e.avatar_color, initials: e.initials })));

        if (txD) setTransactions(txD.map((t: any) => ({
          id: t.id, date: t.created_at, totalPrice: Number(t.total_amount), totalHpp: 0,
          paymentMethod: t.payment_method || 'Tunai', timestamp: new Date(t.created_at), orderNumber: t.order_number,
          items: (t.order_items || []).map((oi: any) => ({ recipeId: oi.recipe_id, quantity: oi.quantity, price: Number(oi.subtotal) / (oi.quantity || 1) }))
        })));

        if (expD) setExpenses(expD.map((e: any) => ({ id: e.id, date: e.created_at, description: e.description, amount: Number(e.amount), category: e.category })));
        if (assetD) setRestaurantAssets(assetD.map((a: any) => ({ id: a.id, name: a.name, category: a.category, quantity: Number(a.quantity), price: Number(a.price), condition: a.condition, location: a.location })));
        if (logsD) setMaintenanceLogs(logsD);
        if (attD) setAttendances(attD.map((a: any) => ({ id: a.id, employeeId: a.employee_id, date: a.date, status: a.status as any })));

        if (shiftD) {
          const ms: Record<string, Record<string, ShiftType>> = {};
          shiftD.forEach((s: any) => {
            if (!ms[s.employee_id]) ms[s.employee_id] = {};
            ms[s.employee_id][s.date] = s.type as ShiftType;
          });
          setShifts(ms);
        }

        if (incD) setDailyIncomes(incD.map((i: any) => ({ id: i.id, date: i.timestamp, description: i.description, amount: Number(i.amount), category: 'Pemasukan' as any })));
      }
    } catch (e) { console.error("Data load error:", e); }
    finally { setIsLoaded(true); setIsSyncing(false); }
  }, []);

  React.useEffect(() => {
    loadData();
    if (supabase) {
      const c1 = supabase.channel('assets-real').on('postgres_changes', { event: '*', schema: 'public', table: 'kedai_assets' }, () => loadData()).subscribe();
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

  React.useEffect(() => {
    if (isLoaded && supabase) {
      const sync = async () => {
        for (const [id, p] of Object.entries(weeklyPattern)) {
          await supabase.from('shift_patterns').upsert({ employee_id: id, pattern: JSON.stringify(p) }, { onConflict: 'employee_id' });
        }
      };
      const tid = setTimeout(sync, 2000);
      return () => clearTimeout(tid);
    }
  }, [weeklyPattern, isLoaded]);

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

        // Dual sync: hpp_recipes AND katalog _menu_baru
        const [res1, res2] = await Promise.all([
          supabase.from('hpp_recipes').insert([recipeData]).select(),
          supabase.from('katalog _menu_baru').insert([{ name: r.name, menu_kasir: r.category, price: r.sellingPrice, user_id: DEFAULT_USER_ID }])
        ]);

        if (res1.data?.[0]) {
          const nr = { ...r, id: res1.data[0].id };
          setRecipes(prev => [...prev, nr]);
          return nr;
        }
      } catch (e) {}
    }
    setRecipes(prev => [...prev, r]);
  };

  const handleUpdateRecipe = async (r: Recipe) => {
    setRecipes(prev => prev.map(old => old.id === r.id ? r : old));
    if (supabase) {
      const price = r.roundedSellingPrice || r.sellingPrice || 0;
      await Promise.all([
        supabase.from('hpp_recipes').update({ name: r.name, category: r.category, selling_price: r.sellingPrice, markup_percent: r.markupPercent, labor_cost: r.laborCost, overhead_cost: r.overhead_cost, shrinkage_percent: r.shrinkage_percent, rounded_selling_price: r.roundedSellingPrice }).eq('id', r.id),
        supabase.from('katalog _menu_baru').update({ name: r.name, menu_kasir: r.category, price: price }).eq('name', r.name)
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
        r ? supabase.from('katalog _menu_baru').delete().eq('name', r.name) : Promise.resolve()
      ]);
    }
  };

  const handleProcessTransaction = async (t: Transaction) => {
    const ft: Transaction = { ...t, date: new Date().toISOString() };
    setTransactions(prev => [ft, ...prev]);
    if (supabase) {
      try {
        const { data } = await supabase.from('riwayat_transaksi').insert([{ id: ft.id, total_amount: ft.totalPrice, payment_method: ft.paymentMethod || 'Tunai', user_id: DEFAULT_USER_ID }]).select();
        if (data?.[0]) await supabase.from('order_items').insert(ft.items.map(it => ({ id: generateId(), order_id: data[0].id, recipe_id: it.recipeId, quantity: it.quantity, subtotal: it.price * it.quantity, user_id: DEFAULT_USER_ID })));
        loadData();
      } catch (e) {}
    }
    return ft;
  };

  const handleVoidTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (supabase) { await supabase.from('riwayat_transaksi').delete().eq('id', id); loadData(); }
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
    if (supabase) await supabase.from('catatan pengeluaran harian').insert([{ id: ex.id, date: ex.date, description: ex.description, amount: ex.amount, category: ex.category, user_id: DEFAULT_USER_ID }]);
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (supabase) await supabase.from('catatan pengeluaran harian').delete().eq('id', id);
  };

  const handleUpdateDailyIncome = async (i: Partial<Expense>) => {
    if (!i.description || !i.amount) return;
    const inc: Expense = { id: generateId(), date: new Date().toISOString(), description: i.description, amount: Number(i.amount), category: 'Pemasukan' as any };
    setDailyIncomes(prev => [inc, ...prev]);
    if (supabase) await supabase.from('pemasukan_harian').insert([{ id: inc.id, description: inc.description, amount: inc.amount, timestamp: inc.date, user_id: DEFAULT_USER_ID }]);
  };

  const handleDeleteDailyIncome = async (id: string) => {
    setDailyIncomes(prev => prev.filter(inc => inc.id !== id));
    if (supabase) await supabase.from('pemasukan_harian').delete().eq('id', id);
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
      if (supabase) await supabase.from('kedai_assets').update({ name: a.name, category: a.category, quantity: a.quantity, price: a.price, condition: a.condition, location: a.location }).eq('id', eid);
    } else {
      const na = { ...a as RestaurantAsset, id: generateId() };
      setRestaurantAssets(prev => [...prev, na]);
      if (supabase) await supabase.from('kedai_assets').insert([{ ...na, user_id: DEFAULT_USER_ID }]);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    setRestaurantAssets(prev => prev.filter(a => a.id !== id));
    if (supabase) await supabase.from('kedai_assets').delete().eq('id', id);
  };

  const handleAddMaintenance = async (l: any, a: RestaurantAsset) => {
    if (supabase) {
      const { error } = await supabase.from('kedai_maintenance_logs').insert([l]);
      if (!error) {
        setMaintenanceLogs(prev => [l, ...prev]);
        if (a.condition === 'Servis') await handleSaveAsset({ condition: 'Bagus' }, a.id);
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
