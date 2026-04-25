import * as React from "react";
import { Ingredient, Recipe, Employee, Transaction, Expense, Unit, RecipeItem, ShiftType, Attendance, RestaurantAsset } from "../types";
import { supabase } from "../lib/supabase";
import { ERP_ENGINE } from "../services/erpEngine";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DEFAULT_USER_ID = 'e57a0505-1234-5678-90ab-c0de57f17ac1'; // Admin tenant ID

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

  // Load data - Hybrid (Supabase + Local Fallback)
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsSyncing(true);
        // Load data from Supabase only
        if (supabase) {
          const [
            { data: ingData },
            { data: recData },
            { data: empData },
            { data: txData },
            { data: expData },
            { data: assetData },
            { data: attData },
            { data: shiftData },
            { data: incomeData },
            { data: settingsData }
          ] = await Promise.all([
            supabase.from('ingredients').select('*'),
            supabase.from('recipes').select('*, recipe_items(*)'),
            supabase.from('employees').select('*'),
            supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(100),
            supabase.from('expenses').select('*').order('created_at', { ascending: false }),
            supabase.from('restaurant_assets').select('*'),
            supabase.from('asset_maintenance_logs').select('*').order('date', { ascending: false }),
            supabase.from('attendances').select('*'),
            supabase.from('shifts').select('*'),
            supabase.from('daily_incomes').select('*'),
            supabase.from('app_config').select('*')
          ]);

          if (settingsData) {
            const themeCfg = settingsData.find(s => s.id === 'theme');
            if (themeCfg) setTheme(themeCfg.value as 'light' | 'dark');
            
            const shiftCfg = settingsData.find(s => s.id === 'shifts');
            if (shiftCfg && shiftCfg.value) {
              try { setShifts(JSON.parse(shiftCfg.value)); } catch (e) { console.error("Shift parse error", e); }
            }
            
            const patternCfg = settingsData.find(s => s.id === 'weekly_pattern');
            if (patternCfg && patternCfg.value) {
              try { setWeeklyPattern(JSON.parse(patternCfg.value)); } catch (e) { console.error("Pattern parse error", e); }
            }

            const pettyCashCfg = settingsData.find(s => s.id === 'petty_cash');
            if (pettyCashCfg) setPettyCash(Number(pettyCashCfg.value));
          }

          if (ingData) {
            const mappedIngs = ingData.map(i => ({
              id: i.id,
              name: i.name,
              category: i.category,
              purchasePrice: Number(i.purchase_price),
              purchaseUnit: i.purchase_unit,
              useUnit: i.use_unit as Unit,
              conversionValue: Number(i.conversion_value),
              stockQuantity: Number(i.stock_quantity),
              lowStockThreshold: Number(i.low_stock_threshold)
            }));
            setIngredients(mappedIngs);
          }

          if (recData) {
            const mappedRecs = recData.map(r => ({
              id: r.id,
              name: r.name,
              category: r.category || 'Makanan',
              sellingPrice: Number(r.selling_price),
              markupPercent: Number(r.markup_percent),
              laborCost: Number(r.labor_cost),
              overheadCost: Number(r.overhead_cost),
              shrinkagePercent: Number(r.shrinkage_percent),
              roundedSellingPrice: r.rounded_selling_price ? Number(r.rounded_selling_price) : undefined,
              items: (r.recipe_items || []).map((ri: any) => ({
                id: ri.id,
                ingredientId: ri.ingredient_id,
                quantityNeeded: Number(ri.quantity_needed)
              }))
            }));
            setRecipes(mappedRecs);
          }

          if (empData) {
            setEmployees(empData.map(e => ({
              id: e.id,
              name: e.name,
              role: e.role,
              salary: Number(e.salary),
              avatarColor: e.avatar_color,
              initials: e.initials
            })));
          }

          if (txData) {
            setTransactions(txData.map(t => ({
              id: t.id,
              date: t.created_at,
              totalPrice: Number(t.total_amount),
              totalHpp: 0, // Need adjustment if tracking HPP per order
              paymentMethod: t.payment_method || 'Tunai',
              items: (t.order_items || []).map((oi: any) => ({
                recipeId: oi.recipe_id,
                quantity: oi.quantity,
                price: Number(oi.subtotal) / oi.quantity
              })),
              timestamp: new Date(t.created_at),
              orderNumber: t.order_number
            })));
          }

          if (expData) {
            setExpenses(expData.map(e => ({
              id: e.id,
              date: e.created_at,
              description: e.description,
              amount: Number(e.amount),
              category: e.category
            })));
          }

          if (assetData) {
            setRestaurantAssets(assetData.map(a => ({
              id: a.id,
              name: a.name,
              category: a.category,
              quantity: Number(a.quantity),
              price: Number(a.price),
              condition: a.condition,
              location: a.location
            })));
          }

          if (logsData) {
            setMaintenanceLogs(logsData);
          }

          if (attData) {
            setAttendances(attData.map(a => ({
              id: a.id,
              employeeId: a.employee_id,
              date: a.date,
              status: a.status as any
            })));
          }

          if (shiftData) {
            const mappedShifts: Record<string, Record<string, ShiftType>> = {};
            shiftData.forEach(s => {
              if (!mappedShifts[s.employee_id]) mappedShifts[s.employee_id] = {};
              mappedShifts[s.employee_id][s.date] = s.type as ShiftType;
            });
            setShifts(mappedShifts);
          }

          if (incomeData) {
            setDailyIncomes(incomeData.map(i => ({
              id: i.id,
              date: i.timestamp,
              description: i.description,
              amount: Number(i.amount),
              category: 'Pemasukan' as any
            })));
          }
        }
      } catch (e) {
        console.error("Data load error:", e);
      } finally {
        setIsLoaded(true);
        setIsSyncing(false);
      }
    };

    loadData();
  }, []);

  // Sync to LocalStorage removed - Using Supabase as Single Source of Truth
  React.useEffect(() => {
    // No-op - removed localStorage sync
  }, [ingredients, recipes, transactions, employees, expenses, pettyCash, isLoaded]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (supabase) {
      supabase.from('app_config').upsert({ id: 'theme', value: newTheme });
    }
  };

  // Sync Patterns to Supabase (Shifts now synced individually)
  React.useEffect(() => {
    if (isLoaded && supabase) {
      const sync = async () => {
        await supabase.from('app_config').upsert([
          { id: 'weekly_pattern', value: JSON.stringify(weeklyPattern) }
        ]);
      };
      const timeoutId = setTimeout(sync, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [weeklyPattern, isLoaded]);

  // --- INGREDIENTS ---
  const handleAddIngredient = async (newIngredient: Partial<Ingredient>, setIsAddingIngredient?: (val: boolean) => void) => {
    if (!newIngredient.name || (newIngredient.purchasePrice || 0) <= 0 || (newIngredient.conversionValue || 0) <= 0) {
      alert("Mohon lengkapi data bahan baku dengan benar!");
      return;
    }
    
    const ingredient: Ingredient = {
      ...newIngredient as Ingredient,
      name: newIngredient.name.trim(),
      id: generateId(),
    };
    
    setIngredients(prev => [...prev, ingredient]);
    if (setIsAddingIngredient) setIsAddingIngredient(false);
    
    if (supabase) {
      await supabase.from('ingredients').insert([{
        id: ingredient.id,
        name: ingredient.name,
        category: ingredient.category,
        purchase_price: ingredient.purchasePrice,
        purchase_unit: ingredient.purchaseUnit,
        use_unit: ingredient.useUnit,
        conversion_value: ingredient.conversionValue,
        stock_quantity: ingredient.stockQuantity,
        low_stock_threshold: ingredient.lowStockThreshold,
        user_id: DEFAULT_USER_ID
      }]);
    }
  };

  const deleteIngredient = async (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
    if (supabase) {
      try {
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error("Error deleting ingredient from Supabase:", e);
      }
    }
  };

  const handleUpdateIngredient = async (updatedIngredient: Ingredient) => {
    setIngredients(prev => prev.map(ing => ing.id === updatedIngredient.id ? updatedIngredient : ing));
    if (supabase) {
      await supabase.from('ingredients').update({
        name: updatedIngredient.name,
        category: updatedIngredient.category,
        purchase_price: updatedIngredient.purchasePrice,
        purchase_unit: updatedIngredient.purchaseUnit,
        use_unit: updatedIngredient.useUnit,
        conversion_value: updatedIngredient.conversionValue,
        stock_quantity: updatedIngredient.stockQuantity,
        low_stock_threshold: updatedIngredient.lowStockThreshold
      }).eq('id', updatedIngredient.id);
    }
  };

  // --- RECIPES ---
  const handleAddRecipe = async (recipe: Recipe) => {
    if (supabase) {
      try {
        const insertData: any = {
          name: recipe.name,
          selling_price: recipe.sellingPrice,
          markup_percent: 0,
          labor_cost: 0,
          overhead_cost: 0,
          shrinkage_percent: 0,
          user_id: DEFAULT_USER_ID
        };

        const { data, error } = await supabase.from('recipes').insert([insertData]).select();

        if (error) {
           console.error("Supabase insert error:", error);
           throw error;
        }

        if (data && data.length > 0) {
          const newRecipe = {
            ...recipe,
            id: data[0].id,
            category: recipe.category || 'Makanan'
          };
          setRecipes(prev => [...prev, newRecipe]);
          alert("Menu berhasil disimpan ke Cloud!");
          return newRecipe;
        }
      } catch (e: any) {
        console.error("Error adding recipe to Supabase:", e);
        setRecipes(prev => [...prev, recipe]);
      }
    } else {
      setRecipes(prev => [...prev, recipe]);
    }
  };

  const handleUpdateRecipe = async (updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
    if (supabase) {
      // Update main recipe
      await supabase.from('recipes').update({
        name: updatedRecipe.name,
        category: updatedRecipe.category,
        selling_price: updatedRecipe.sellingPrice,
        markup_percent: updatedRecipe.markupPercent,
        labor_cost: updatedRecipe.laborCost,
        overhead_cost: updatedRecipe.overheadCost,
        shrinkage_percent: updatedRecipe.shrinkagePercent,
        rounded_selling_price: updatedRecipe.roundedSellingPrice
      }).eq('id', updatedRecipe.id);

      // Sync recipe items (Simple delete and re-insert for God Mode consistency)
      await supabase.from('recipe_items').delete().eq('recipe_id', updatedRecipe.id);
      if (updatedRecipe.items.length > 0) {
        await supabase.from('recipe_items').insert(
          updatedRecipe.items.map(item => ({
            id: generateId(),
            recipe_id: updatedRecipe.id,
            ingredient_id: item.ingredientId,
            quantity_needed: item.quantityNeeded
          }))
        );
      }
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    if (supabase) await supabase.from('recipes').delete().eq('id', id);
  };

  // --- TRANSACTIONS (ORDERS) ---
  const handleProcessTransaction = async (transaction: Transaction) => {
    const finalTransaction: Transaction = {
      ...transaction,
      date: new Date().toISOString()
    };

    setTransactions(prev => [finalTransaction, ...prev]);

    if (supabase) {
      try {
        // 1. Insert Order
        const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
          id: finalTransaction.id,
          total_amount: finalTransaction.totalPrice,
          payment_method: finalTransaction.paymentMethod || 'Tunai',
          user_id: DEFAULT_USER_ID
        }]).select();

        if (orderError) throw orderError;

        // 2. Insert Order Items (This will trigger stock reduction in DB)
        if (orderData && orderData.length > 0) {
          const orderId = orderData[0].id;
          const { error: itemsError } = await supabase.from('order_items').insert(
            finalTransaction.items.map(item => ({
              id: generateId(),
              order_id: orderId,
              recipe_id: item.recipeId,
              quantity: item.quantity,
              subtotal: item.price * item.quantity,
              user_id: DEFAULT_USER_ID
            }))
          );
          if (itemsError) throw itemsError;
        }

        // 3. Update local ingredients state after DB trigger would have run
        // In a real scenario, we might want to re-fetch ingredients
        const { data: freshIngs } = await supabase.from('ingredients').select('*');
        if (freshIngs) {
          setIngredients(freshIngs.map(i => ({
            id: i.id,
            name: i.name,
            category: i.category,
            purchasePrice: Number(i.purchase_price),
            purchaseUnit: i.purchase_unit,
            useUnit: i.use_unit as Unit,
            conversionValue: Number(i.conversion_value),
            stockQuantity: Number(i.stock_quantity),
            lowStockThreshold: Number(i.low_stock_threshold)
          })));
        }

      } catch (e) {
        console.error("Supabase Order Sync Error:", e);
      }
    }

    return finalTransaction;
  };

  const handleVoidTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));

    if (supabase) {
      try {
        // Delete Order (Cascades to order_items)
        const { error: txError } = await supabase.from('orders').delete().eq('id', id);
        if (txError) throw txError;

        // Re-fetch ingredients to sync restored stock from DB
        const { data: freshIngs } = await supabase.from('ingredients').select('*');
        if (freshIngs) {
          setIngredients(freshIngs.map(i => ({
            id: i.id,
            name: i.name,
            category: i.category,
            purchasePrice: Number(i.purchase_price),
            purchaseUnit: i.purchase_unit,
            useUnit: i.use_unit as Unit,
            conversionValue: Number(i.conversion_value),
            stockQuantity: Number(i.stock_quantity),
            low_stock_threshold: Number(i.low_stock_threshold)
          })));
        }
      } catch (e) {
        console.error("Supabase Void Order Sync Error:", e);
      }
    }
  };

  // --- EMPLOYEES ---
  const handleSaveEmployee = async (newEmployee: Partial<Employee>, editingEmployeeId: string | null) => {
    if (!newEmployee.name) return;
    
    if (editingEmployeeId) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployeeId ? { ...emp, ...newEmployee as Employee } : emp));
      if (supabase) {
        await supabase.from('employees').update({
          name: newEmployee.name,
          role: newEmployee.role,
          salary: newEmployee.salary,
          avatar_color: (newEmployee as any).avatarColor,
          initials: (newEmployee as any).initials
        }).eq('id', editingEmployeeId);
      }
    } else {
      const employee: Employee = { ...newEmployee as Employee, id: generateId() };
      setEmployees(prev => [...prev, employee]);
      if (supabase) {
        await supabase.from('employees').insert([{
          id: employee.id,
          name: employee.name,
          role: employee.role,
          salary: employee.salary,
          avatar_color: (employee as any).avatarColor,
          initials: (employee as any).initials,
          user_id: DEFAULT_USER_ID
        }]);
      }
    }
  };

  const deleteEmployee = async (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    if (supabase) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error("Error deleting employee from Supabase:", e);
      }
    }
  };

  // --- EXPENSES ---
  const handleAddExpense = async (expenseData: Partial<Expense>) => {
    if (!expenseData.description || !expenseData.amount) return;
    const expense: Expense = {
      id: generateId(),
      date: new Date().toISOString(),
      description: expenseData.description,
      amount: Number(expenseData.amount),
      category: expenseData.category as any
    };
    setExpenses(prev => [expense, ...prev]);
    if (supabase) {
      await supabase.from('expenses').insert([{
        id: expense.id,
        date: expense.date,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        user_id: DEFAULT_USER_ID
      }]);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (supabase) {
      await supabase.from('expenses').delete().eq('id', id);
    }
  };

  // --- DAILY INCOMES ---
  const handleUpdateDailyIncome = async (incomeData: Partial<Expense>) => {
    if (!incomeData.description || !incomeData.amount) return;
    const income: Expense = {
      id: generateId(),
      date: new Date().toISOString(),
      description: incomeData.description,
      amount: Number(incomeData.amount),
      category: 'Pemasukan' as any
    };
    setDailyIncomes(prev => [income, ...prev]);
    if (supabase) {
      await supabase.from('daily_incomes').insert([{
        id: income.id,
        description: income.description,
        amount: income.amount,
        timestamp: income.date,
        user_id: DEFAULT_USER_ID
      }]);
    }
  };

  const handleDeleteDailyIncome = async (id: string) => {
    setDailyIncomes(prev => prev.filter(i => i.id !== id));
    if (supabase) {
      await supabase.from('daily_incomes').delete().eq('id', id);
    }
  };

  // --- ATTENDANCE ---
  const toggleAttendance = async (employeeId: string, date: string, status: Attendance['status']) => {
    const existing = attendances.find(a => a.employeeId === employeeId && a.date === date);
    
    if (existing) {
      if (existing.status === status) {
        // Delete if same status (toggle off)
        setAttendances(prev => prev.filter(a => a.id !== existing.id));
        if (supabase) await supabase.from('attendances').delete().eq('id', existing.id);
      } else {
        // Update if different status
        setAttendances(prev => prev.map(a => a.id === existing.id ? { ...a, status } : a));
        if (supabase) await supabase.from('attendances').update({ status }).eq('id', existing.id);
      }
    } else {
      // Insert new
      const newAtt: Attendance = { id: generateId(), employeeId, date, status };
      setAttendances(prev => [...prev, newAtt]);
      if (supabase) {
        await supabase.from('attendances').insert([{
          id: newAtt.id,
          employee_id: employeeId,
          date,
          status,
          user_id: DEFAULT_USER_ID
        }]);
      }
    }
  };

  const handleUpdateShift = async (employeeId: string, date: string, type: ShiftType) => {
    setShifts(prev => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] || {}),
        [date]: type
      }
    }));

    if (supabase) {
      await supabase.from('shifts').upsert({
        employee_id: employeeId,
        date,
        type,
        user_id: DEFAULT_USER_ID
      }, { onConflict: 'employee_id,date' });
    }
  };

  // --- RESTAURANT ASSETS ---
  const handleSaveAsset = async (asset: Partial<RestaurantAsset>, editingId: string | null) => {
    if (editingId) {
      setRestaurantAssets(prev => prev.map(a => a.id === editingId ? { ...a, ...asset as RestaurantAsset } : a));
      if (supabase) {
        await supabase.from('restaurant_assets').update({
          name: asset.name,
          category: asset.category,
          quantity: asset.quantity,
          price: asset.price,
          condition: asset.condition,
          location: asset.location
        }).eq('id', editingId);
      }
    } else {
      const newAsset = { ...asset as RestaurantAsset, id: generateId() };
      setRestaurantAssets(prev => [...prev, newAsset]);
      if (supabase) {
        await supabase.from('restaurant_assets').insert([{
          ...newAsset,
          user_id: DEFAULT_USER_ID
        }]);
      }
    }
  };

  const handleDeleteAsset = async (id: string) => {
    setRestaurantAssets(prev => prev.filter(a => a.id !== id));
    if (supabase) await supabase.from('restaurant_assets').delete().eq('id', id);
  };

  const handleAddMaintenance = async (log: any, asset: RestaurantAsset) => {
    if (supabase) {
      const { error } = await supabase.from('asset_maintenance_logs').insert([log]);
      if (!error) {
        setMaintenanceLogs(prev => [log, ...prev]);
        if (asset.condition === 'Servis') {
          await handleSaveAsset({ condition: 'Bagus' }, asset.id);
        }
      }
    }
  };

  const handleBackup = () => {
    const data = { ingredients, recipes, employees, transactions, expenses, pettyCash, shifts: {}, weeklyPattern: {}, attendances };
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `posgo_backup_${new Date().toISOString()}.json`;
    a.click();
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setIngredients(data.ingredients || []);
        setRecipes(data.recipes || []);
        setEmployees(data.employees || []);
        setTransactions(data.transactions || []);
        alert("Data berhasil dipulihkan!");
      } catch (err) {
        alert("Gagal memulihkan data. Pastikan file backup valid.");
      }
    };
    reader.readAsText(file);
  };

  return {
    ingredients, setIngredients, recipes, setRecipes, employees, setEmployees,
    transactions, setTransactions, expenses, setExpenses, pettyCash, setPettyCash,
    isLoaded, deleteIngredient, deleteEmployee, handleBackup, handleRestore,
    handleAddIngredient, handleUpdateIngredient, handleAddExpense, handleDeleteExpense, handleSaveEmployee, handleProcessTransaction,
    handleAddRecipe, handleUpdateRecipe, handleDeleteRecipe, handleUpdateDailyIncome, handleDeleteDailyIncome, handleVoidTransaction,
    shifts, setShifts, handleUpdateShift, weeklyPattern, setWeeklyPattern, attendances, setAttendances,
    toggleAttendance, theme, toggleTheme, isSyncing, dailyIncomes, restaurantAssets, setRestaurantAssets,
    maintenanceLogs, handleSaveAsset, handleDeleteAsset, handleAddMaintenance,
    isModalOpen, setIsModalOpen
  };
}

