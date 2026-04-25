import * as React from "react";
import { 
  Plus, 
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Utensils,
  FileDown,
  Save
} from "lucide-react";
import { Recipe, Ingredient, RecipeItem } from "../types";
import { formatCurrency, formatIDR, cn, generateId } from "@/lib/utils";
import { PriceInput } from "./PriceInput";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RecipeManagerProps {
  recipes: Recipe[];
  setRecipes?: React.Dispatch<React.SetStateAction<Recipe[]>>;
  ingredients: Ingredient[];
  handleExportRecipePDF: (recipe: Recipe) => void;
  isAddingRecipe?: boolean;
  setIsAddingRecipe?: (val: boolean) => void;
  hideHeader?: boolean;
  onAddRecipe?: (recipe: Recipe) => Promise<void>;
  onUpdateRecipe?: (recipe: Recipe) => Promise<void>;
  onDeleteRecipe?: (id: string) => Promise<void>;
  onModalToggle?: (isOpen: boolean) => void;
}

export const RecipeManager: React.FC<RecipeManagerProps> = ({
  recipes,
  setRecipes,
  ingredients,
  handleExportRecipePDF,
  isAddingRecipe: externalIsAddingRecipe,
  setIsAddingRecipe: externalSetIsAddingRecipe,
  hideHeader = false,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onModalToggle
}) => {
  const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);

  React.useEffect(() => {
    if (onModalToggle) {
      onModalToggle(selectedRecipe !== null);
    }
  }, [selectedRecipe, onModalToggle]);

  const [internalIsAddingRecipe, _setInternalIsAddingRecipe] = React.useState(false);

  const isAddingRecipe = externalIsAddingRecipe !== undefined ? externalIsAddingRecipe : internalIsAddingRecipe;

  const setIsAddingRecipe = (val: boolean) => {
    if (externalSetIsAddingRecipe) externalSetIsAddingRecipe(val);
    else _setInternalIsAddingRecipe(val);
    if (onModalToggle) onModalToggle(val);
  };

  const [newRecipeName, setNewRecipeName] = React.useState("");
  const [newRecipeCategory, setNewRecipeCategory] = React.useState<'Makanan' | 'Minuman' | 'Pelengkap'>('Makanan');
  const [isAddingIngredientToRecipe, _setIsAddingIngredientToRecipe] = React.useState(false);
  const [selectedIngredientForRecipe, setSelectedIngredientForRecipe] = React.useState("");
  const [quantityForRecipe, setQuantityForRecipe] = React.useState(0);
  const [isEditingIngredient, _setIsEditingIngredient] = React.useState(false);

  const setIsAddingIngredientToRecipe = (val: boolean) => {
    _setIsAddingIngredientToRecipe(val);
    if (onModalToggle) onModalToggle(val);
  };

  const setIsEditingIngredient = (val: boolean) => {
    _setIsEditingIngredient(val);
    if (onModalToggle) onModalToggle(val);
  };
  const [editingIngredientId, setEditingIngredientId] = React.useState("");
  const [editingQuantity, setEditingQuantity] = React.useState<number | "">("");
  const [boothCount, setBoothCount] = React.useState<number | "">("");
  const [ownerProfitTarget, setOwnerProfitTarget] = React.useState<number>(0);

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  const handleAddRecipe = async () => {
    if (!newRecipeName) return;
    const recipe: Recipe = {
      id: generateId(),
      name: toTitleCase(newRecipeName),
      category: newRecipeCategory,
      sellingPrice: 0,
      markupPercent: 0,
      laborCost: 0,
      overheadCost: 0,
      shrinkagePercent: 0,
      items: []
    };
    
    if (onAddRecipe) await onAddRecipe(recipe);
    else if (setRecipes) setRecipes([...recipes, recipe]);
    
    setNewRecipeName("");
    setIsAddingRecipe(false);
    setSelectedRecipe(recipe);
  };

  const handleAddIngredientToRecipe = async () => {
    if (!selectedRecipe || !selectedIngredientForRecipe || quantityForRecipe <= 0) return;
    
    const ingredient = ingredients.find(i => i.id === selectedIngredientForRecipe);
    if (!ingredient) return;

    const newItem: RecipeItem = {
      id: generateId(),
      ingredientId: selectedIngredientForRecipe,
      quantityNeeded: quantityForRecipe
    };

    const updatedRecipe = {
      ...selectedRecipe,
      items: [...(selectedRecipe.items || []), newItem]
    };

    if (onUpdateRecipe) await onUpdateRecipe(updatedRecipe);
    else if (setRecipes) setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
    
    setSelectedRecipe(updatedRecipe);
    setIsAddingIngredientToRecipe(false);
    setSelectedIngredientForRecipe("");
    setQuantityForRecipe(0);
  };

  const openEditIngredient = (id: string, quantity: number) => {
    setEditingIngredientId(id);
    setEditingQuantity(quantity);
    setIsEditingIngredient(true);
  };

  const handleEditIngredientInRecipe = async () => {
    if (!selectedRecipe || !editingIngredientId || !editingQuantity) return;
    const updatedRecipe = {
      ...selectedRecipe,
      items: (selectedRecipe.items || []).map(item => 
        item.ingredientId === editingIngredientId 
          ? { ...item, quantityNeeded: Number(editingQuantity) }
          : item
      )
    };
    
    if (onUpdateRecipe) await onUpdateRecipe(updatedRecipe);
    else if (setRecipes) setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
    
    setSelectedRecipe(updatedRecipe);
    setIsEditingIngredient(false);
    setEditingIngredientId("");
    setEditingQuantity("");
  };

  const removeIngredientFromRecipe = async (ingredientId: string) => {
    if (!selectedRecipe) return;
    const updatedRecipe = {
      ...selectedRecipe,
      items: (selectedRecipe.items || []).filter(item => item.ingredientId !== ingredientId)
    };
    
    if (onUpdateRecipe) await onUpdateRecipe(updatedRecipe);
    else if (setRecipes) setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
    
    setSelectedRecipe(updatedRecipe);
  };

  const deleteRecipe = async (id: string) => {
    if (onDeleteRecipe) await onDeleteRecipe(id);
    else if (setRecipes) setRecipes(recipes.filter(r => r.id !== id));
    
    if (selectedRecipe?.id === id) setSelectedRecipe(null);
  };

  const updateBreakdown = async (field: string, value: number) => {
    if (!selectedRecipe) return;
    
    const currentBreakdown = selectedRecipe.overheadBreakdown || {
      electricity: 0,
      gas: 0,
      gasDailyUsage: 0,
      gasPricePerCylinder: 0,
      water: 0,
      marketing: 0,
      internet: 0,
      trashFee: 0,
      wastePercent: 0,
      labor: 0,
      employeeCount: 1,
      salaryPerEmployee: 0,
      targetPortions: 1
    };

    let newBreakdown = {
      ...currentBreakdown,
      [field]: value
    };

    // Auto-calculate total labor if employee count or salary changes
    if (field === 'employeeCount' || field === 'salaryPerEmployee') {
      newBreakdown.labor = newBreakdown.employeeCount * newBreakdown.salaryPerEmployee;
    }

    // Auto-calculate total gas if daily usage or price per cylinder changes
    if (field === 'gasDailyUsage' || field === 'gasPricePerCylinder') {
      newBreakdown.gas = (newBreakdown.gasDailyUsage || 0) * (newBreakdown.gasPricePerCylinder || 0) * 30;
    }

    const portions = newBreakdown.targetPortions || 1;
    
    // Calculate per portion costs
    const perPortionLabor = newBreakdown.labor / portions;
    const perPortionOverhead = (newBreakdown.electricity + newBreakdown.gas + newBreakdown.water + newBreakdown.marketing + newBreakdown.internet + (newBreakdown.trashFee || 0)) / portions;

    const updatedRecipe = {
      ...selectedRecipe,
      overheadBreakdown: newBreakdown,
      laborCost: perPortionLabor,
      overheadCost: perPortionOverhead,
      shrinkagePercent: newBreakdown.wastePercent // Sync top-level shrinkage with monthly waste
    };

    if (onUpdateRecipe) await onUpdateRecipe(updatedRecipe);
    else if (setRecipes) setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
    
    setSelectedRecipe(updatedRecipe);
  };

  const { totalCost, safeTotalCost, foodCostPercent, marginAmount, marginPercent } = React.useMemo(() => {
    if (!selectedRecipe) return { totalCost: 0, safeTotalCost: 0, foodCostPercent: 0, marginAmount: 0, marginPercent: 0 };

    const ingMap = new Map(ingredients.map(i => [i.id, i]));

    const raw = (selectedRecipe.items || []).reduce((acc, item) => {
      const ing = ingMap.get(item.ingredientId);
      if (!ing || !ing.conversionValue || ing.conversionValue === 0) return acc;
      const pricePerUnit = ing.purchasePrice / ing.conversionValue;
      return acc + (item.quantityNeeded * pricePerUnit);
    }, 0);

    const waste = raw * ((selectedRecipe.shrinkagePercent || 0) / 100);
    const calculatedHpp = raw + waste;
    const total = calculatedHpp + (selectedRecipe.laborCost || 0) + (selectedRecipe.overheadCost || 0);
    const safeTotal = isNaN(total) ? 0 : total;
    const actualSellingPrice = selectedRecipe.roundedSellingPrice || selectedRecipe.sellingPrice || 0;
    const foodCostPct = actualSellingPrice > 0 ? Math.round((calculatedHpp / actualSellingPrice) * 100) : 0;
    const marginAmt = actualSellingPrice - safeTotal;
    const marginPct = actualSellingPrice > 0 ? Math.round((marginAmt / actualSellingPrice) * 100) : 0;

    return {
      totalCost: total,
      safeTotalCost: safeTotal,
      foodCostPercent: foodCostPct,
      marginAmount: marginAmt,
      marginPercent: marginPct
    };
  }, [selectedRecipe, ingredients]);

  if (selectedRecipe) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedRecipe(null)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">{selectedRecipe.name}</h2>
              <Badge
                variant="secondary"
                className={cn(
                  "font-bold uppercase tracking-widest text-[9px] px-2 py-0 border-none cursor-pointer h-5",
                  selectedRecipe.category === 'Makanan' ? "bg-emerald-100 text-emerald-700" :
                  selectedRecipe.category === 'Minuman' ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                )}
                onClick={async () => {
                  const categories: ('Makanan' | 'Minuman' | 'Pelengkap')[] = ['Makanan', 'Minuman', 'Pelengkap'];
                  const currentIndex = categories.indexOf(selectedRecipe.category as any);
                  const nextCat = categories[(currentIndex + 1) % categories.length];
                  const updated: Recipe = { ...selectedRecipe, category: nextCat };
                  if (onUpdateRecipe) await onUpdateRecipe(updated);
                  else if (setRecipes) setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updated : r));
                  setSelectedRecipe(updated);
                }}
              >
                {selectedRecipe.category || "Makanan"}
              </Badge>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Detail BOM & Kalkulasi HPP</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <Card className="border border-slate-100 shadow-none bg-white rounded-xl overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">Komposisi Bahan</h3>
                  <Dialog open={isAddingIngredientToRecipe} onOpenChange={setIsAddingIngredientToRecipe}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 gap-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold">
                        <Plus className="w-3.5 h-3.5" />
                        Tambah
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md mx-auto rounded-[2rem] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white animate-in zoom-in-95 duration-200">
                      {/* Premium Header with Gradient */}
                      <div className="relative p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <DialogTitle className="relative text-lg font-bold text-white tracking-tight flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-primary">
                            <Plus size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span>Tambah Bahan</span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Komposisi Resep</span>
                          </div>
                        </DialogTitle>
                      </div>

                      {/* Content Body */}
                      <div className="p-8 space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            Pilih Bahan Baku
                          </label>
                          <div className="relative group">
                            <select 
                              id="recipe-ingredient-select"
                              className="w-full h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-4 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all duration-200 appearance-none"
                              value={selectedIngredientForRecipe}
                              onChange={(e) => setSelectedIngredientForRecipe(e.target.value)}
                              aria-label="Pilih Bahan Baku"
                            >
                              <option value="">-- Pilih Bahan Baku --</option>
                              {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.useUnit})</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <ChevronDown size={18} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            Jumlah Pemakaian
                          </label>
                          <div className="relative group">
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              value={quantityForRecipe || ""}
                              onChange={(e) => setQuantityForRecipe(Number(e.target.value))}
                              className="h-14 pl-4 pr-16 rounded-2xl border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all duration-200"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-100 rounded-lg">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                {ingredients.find(i => i.id === selectedIngredientForRecipe)?.useUnit || "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-6 pt-2 bg-white flex gap-4">
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsAddingIngredientToRecipe(false)} 
                          className="flex-1 h-14 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                        >
                          Batal
                        </Button>
                        <Button 
                          onClick={handleAddIngredientToRecipe} 
                          className="flex-[1.5] h-14 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all duration-200"
                        >
                          Tambahkan
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  {(selectedRecipe.items || []).length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Belum ada bahan</p>
                    </div>
                  ) : (
                    (selectedRecipe.items || []).map((item, idx) => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      if (!ing) return null;
                      const cost = (ing.purchasePrice / ing.conversionValue) * item.quantityNeeded;
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{ing.name}</h4>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {item.quantityNeeded} {ing.useUnit} @ {formatIDR(ing.purchasePrice / ing.conversionValue)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HPP</p>
                              <p className="text-xs font-bold text-slate-900">{formatIDR(cost)}</p>
                            </div>
                            <button 
                              onClick={() => openEditIngredient(item.ingredientId, item.quantityNeeded)}
                              className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"
                              aria-label={`Edit takaran ${ing.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => removeIngredientFromRecipe(item.ingredientId)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                              aria-label={`Hapus ${ing.name} dari resep`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">Alokasi Biaya Bulanan</h3>
                    <Badge variant="outline" className="text-[9px] font-bold text-blue-600 border-blue-100">Monthly Targets</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target Porsi / Bulan</label>
                        <Input
                          type="number"
                          value={selectedRecipe.overheadBreakdown?.targetPortions || ""}
                          onChange={(e) => updateBreakdown('targetPortions', Number(e.target.value))}
                          className="h-10 rounded-lg border-slate-200 bg-slate-50 font-bold text-sm text-slate-900"
                          placeholder="0"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Biaya Tenaga Kerja</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-400">Jumlah Karyawan</p>
                            <Input 
                              type="number"
                              value={selectedRecipe.overheadBreakdown?.employeeCount || ""}
                              onChange={(e) => updateBreakdown('employeeCount', Number(e.target.value))}
                              className="h-8 rounded-lg border-slate-200 font-bold text-xs bg-white text-slate-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-400">Gaji / Orang</p>
                            <PriceInput 
                              value={selectedRecipe.overheadBreakdown?.salaryPerEmployee || 0}
                              onChange={(val) => updateBreakdown('salaryPerEmployee', val)}
                              className="h-8 rounded-lg border-slate-200 font-bold text-xs bg-white text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Listrik / Bulan</label>
                        <PriceInput
                          value={selectedRecipe.overheadBreakdown?.electricity || 0}
                          onChange={(val) => updateBreakdown('electricity', val)}
                          className="h-10 rounded-lg border-slate-200 font-bold bg-slate-50 text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Konsumsi Gas</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-400">Jumlah Tabung</p>
                            <Input
                              type="number"
                              value={selectedRecipe.overheadBreakdown?.gasDailyUsage || ""}
                              onChange={(e) => updateBreakdown('gasDailyUsage', Number(e.target.value))}
                              className="h-8 rounded-lg border-slate-200 font-bold text-xs bg-white text-slate-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-400">Harga / Tabung</p>
                            <PriceInput 
                              value={selectedRecipe.overheadBreakdown?.gasPricePerCylinder || 0}
                              onChange={(val) => updateBreakdown('gasPricePerCylinder', val)}
                              className="h-8 rounded-lg border-slate-200 font-bold text-xs bg-white text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Air / Bulan</label>
                          <PriceInput
                            value={selectedRecipe.overheadBreakdown?.water || 0}
                            onChange={(val) => updateBreakdown('water', val)}
                            className="h-10 rounded-lg border-slate-200 font-bold text-xs bg-slate-50 text-slate-900"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Iklan / Bulan</label>
                          <PriceInput
                            value={selectedRecipe.overheadBreakdown?.marketing || 0}
                            onChange={(val) => updateBreakdown('marketing', val)}
                            className="h-10 rounded-lg border-slate-200 font-bold text-xs bg-slate-50 text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Waste %</label>
                          <Input
                            type="number"
                            value={selectedRecipe.overheadBreakdown?.wastePercent || ""}
                            onChange={(e) => updateBreakdown('wastePercent', Number(e.target.value))}
                            className="h-10 rounded-lg border-slate-200 font-bold text-xs bg-slate-50 text-slate-900"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Internet / Bulan</label>
                          <PriceInput
                            value={selectedRecipe.overheadBreakdown?.internet || 0}
                            onChange={(val) => updateBreakdown('internet', val)}
                            className="h-10 rounded-lg border-slate-200 font-bold text-xs bg-slate-50 text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                    <div className="p-4 bg-primary rounded-xl grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[6.5px] font-bold text-primary-foreground/60 uppercase tracking-tight">Total Gaji / Hari</p>
                      <p className="text-lg font-bold text-primary-foreground leading-none">
                        {formatIDR((selectedRecipe.overheadBreakdown?.labor || 0) / 26)}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[6.5px] font-bold text-primary-foreground/60 uppercase tracking-tight">Alokasi / Porsi</p>
                      <p className="text-lg font-bold text-primary-foreground leading-none">
                        {formatIDR((selectedRecipe.laborCost || 0) + (selectedRecipe.overheadCost || 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card className="border border-slate-100 shadow-none bg-white rounded-xl overflow-hidden">
              <div className="p-4 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cost</p>
                    <p className="text-lg font-bold text-slate-900 tracking-tight">{formatIDR(totalCost)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Food Cost %</p>
                    <p className="text-lg font-bold text-emerald-600 tracking-tight">{foodCostPercent}%</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Markup Target</label>
                      <span className="text-xs font-bold text-emerald-600">{selectedRecipe.markupPercent || 0}%</span>
                    </div>
                    <Slider 
                      value={[selectedRecipe.markupPercent || 0]} 
                      min={0}
                      max={95} 
                      step={1}
                      className="[&_[data-slot=slider-track]]:bg-slate-100 [&_[data-slot=slider-range]]:bg-blue-600 h-6"
                      onValueChange={async (vals) => {
                        const targetMargin = Array.isArray(vals) ? vals[0] : vals;
                        const newSellingPrice = safeTotalCost > 0 
                          ? Math.round(safeTotalCost / (1 - targetMargin / 100))
                          : selectedRecipe.sellingPrice;
                        
                        const updatedRecipe = {
                          ...selectedRecipe,
                          markupPercent: targetMargin,
                          sellingPrice: newSellingPrice,
                          roundedSellingPrice: undefined
                        };
                        if (onUpdateRecipe) await onUpdateRecipe(updatedRecipe);
                        else if (setRecipes) setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
                        setSelectedRecipe(updatedRecipe);
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rekomendasi Jual</label>
                      <PriceInput
                        value={selectedRecipe.sellingPrice || 0}
                        onChange={async (val) => {
                          const newMargin = val > safeTotalCost && val > 0 ? Math.round(((val - safeTotalCost) / val) * 100) : 0;
                          const updatedRecipe = {
                            ...selectedRecipe,
                            sellingPrice: val,
                            markupPercent: newMargin,
                            roundedSellingPrice: undefined
                          };
                          if (onUpdateRecipe) await onUpdateRecipe(updatedRecipe);
                          else if (setRecipes) setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
                          setSelectedRecipe(updatedRecipe);
                        }}
                        className="h-10 rounded-lg border-slate-100 text-base font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Harga Final</label>
                      <PriceInput
                        value={selectedRecipe.roundedSellingPrice !== undefined ? selectedRecipe.roundedSellingPrice : (selectedRecipe.sellingPrice || 0)}
                        onChange={async (val) => {
                          const updatedRecipe = {
                            ...selectedRecipe,
                            roundedSellingPrice: val
                          };
                          if (onUpdateRecipe) await onUpdateRecipe(updatedRecipe);
                          else if (setRecipes) setRecipes(recipes.map(r => r.id === selectedRecipe.id ? updatedRecipe : r));
                          setSelectedRecipe(updatedRecipe);
                        }}
                        className="h-12 rounded-lg border-emerald-100 bg-emerald-50 text-xl font-bold text-emerald-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                      <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest mb-1">Margin</p>
                      <p className={cn("text-sm font-bold", marginPercent <= 0 ? "text-rose-600" : "text-amber-700")}>{marginPercent}%</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100/50">
                      <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mb-1">Laba/Porsi</p>
                      <p className={cn("text-sm font-bold", marginAmount <= 0 ? "text-rose-600" : "text-blue-700")}>{formatIDR(marginAmount)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    onClick={async () => {
                      if (onUpdateRecipe) {
                        await onUpdateRecipe(selectedRecipe);
                        alert('Data HPP berhasil disimpan ke Cloud!');
                      }
                    }}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    SIMPAN HPP KE CLOUD
                  </Button>
                  <Button
                    onClick={() => handleExportRecipePDF(selectedRecipe)}
                    className="w-full h-10 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-[10px] uppercase tracking-wider text-slate-700"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => deleteRecipe(selectedRecipe.id)}
                    className="w-full h-10 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-[10px] uppercase tracking-wider"
                  >
                    Hapus Resep
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-100 shadow-none bg-white rounded-xl overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">Sewa Lapak</h3>
                  <p className="text-[9px] font-medium text-slate-400">Estimasi iuran sewa per unit.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase">Jumlah Unit</label>
                    <Input
                      type="number"
                      value={boothCount}
                      onChange={(e) => setBoothCount(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                      className="h-8 rounded-lg border-slate-200 font-bold text-xs bg-white text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase">Target Laba</label>
                    <PriceInput
                      value={ownerProfitTarget || 0}
                      onChange={(val) => setOwnerProfitTarget(val)}
                      className="h-8 rounded-lg border-slate-200 font-bold text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rekomendasi Sewa / Unit</p>
                  <p className="text-base font-bold text-blue-600">
                    {formatIDR(
                      ((selectedRecipe.overheadBreakdown?.labor || 0) +
                      (selectedRecipe.overheadBreakdown?.electricity || 0) +
                      (selectedRecipe.overheadBreakdown?.gas || 0) +
                      (selectedRecipe.overheadBreakdown?.water || 0) +
                      (selectedRecipe.overheadBreakdown?.marketing || 0) +
                      (selectedRecipe.overheadBreakdown?.internet || 0) +
                      (selectedRecipe.overheadBreakdown?.trashFee || 0) +
                      ownerProfitTarget) / (boothCount || 1)
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Katalog HPP</h2>
            <p className="text-slate-500 font-medium text-xs">Menu & Standar Porsi</p>
          </div>
          <Dialog open={isAddingRecipe} onOpenChange={setIsAddingRecipe}>
            <DialogTrigger asChild>
              <Button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Buat HPP Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-4rem)] sm:max-w-sm mx-auto rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white animate-in zoom-in-95 duration-200">
              <div className="relative p-6 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <DialogTitle className="relative text-base font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-primary">
                    <Utensils size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span>Menu Baru</span>
                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Sistem Katalog POSGO</span>
                  </div>
                </DialogTitle>
              </div>

              <div className="p-6 space-y-5 bg-white">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Menu</label>
                  <Input
                    placeholder="Contoh: Kopi Susu Gula Aren"
                    value={newRecipeName}
                    onChange={(e) => setNewRecipeName(toTitleCase(e.target.value))}
                    className="h-12 pl-4 rounded-xl border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:bg-white transition-all duration-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Menu</label>
                  <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-100 h-12">
                    <button
                      onClick={() => setNewRecipeCategory('Makanan')}
                      className={cn(
                        "flex-1 rounded-lg font-black text-[10px] uppercase transition-all duration-300",
                        newRecipeCategory === 'Makanan' 
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Makanan
                    </button>
                    <button
                      onClick={() => setNewRecipeCategory('Minuman')}
                      className={cn(
                        "flex-1 rounded-lg font-black text-[10px] uppercase transition-all duration-300",
                        newRecipeCategory === 'Minuman' 
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Minuman
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-2 bg-white flex gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsAddingRecipe(false)} 
                  className="flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleAddRecipe} 
                  className="flex-[1.5] h-12 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Buat Menu
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Adding HPP Dialog for External Trigger */}
      {hideHeader && (
        <Dialog open={isAddingRecipe} onOpenChange={setIsAddingRecipe}>
          <DialogContent className="w-[calc(100%-4rem)] sm:max-w-sm mx-auto rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white animate-in zoom-in-95 duration-200">
            {/* Premium Header with Gradient */}
            <div className="relative p-6 bg-gradient-to-br from-slate-900 to-slate-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <DialogTitle className="relative text-base font-bold text-white tracking-tight flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-primary">
                  <Utensils size={18} />
                </div>
                <div className="flex flex-col">
                  <span>Menu Baru</span>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Sistem Katalog POSGO</span>
                </div>
              </DialogTitle>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 bg-white">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Menu</label>
                <div className="relative group">
                  <Input
                    placeholder="Contoh: Kopi Susu"
                    value={newRecipeName}
                    onChange={(e) => setNewRecipeName(toTitleCase(e.target.value))}
                    className="h-11 pl-4 rounded-xl border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Menu</label>
                <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-100 h-11">
                  {['Makanan', 'Minuman', 'Pelengkap'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewRecipeCategory(cat as any)}
                      className={cn(
                        "flex-1 rounded-lg font-black text-[10px] uppercase transition-all duration-300",
                        newRecipeCategory === cat
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              </div>

            {/* Footer with Floating Action Style */}
            <div className="p-6 pt-0 bg-white flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setIsAddingRecipe(false)} 
                className="flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
              >
                Batal
              </Button>
              <Button 
                onClick={handleAddRecipe} 
                className="flex-[1.5] h-12 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Buat Menu
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-col gap-3">
        {recipes.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Belum ada resep</p>
          </div>
        ) : (
          <RecipeList
            recipes={recipes}
            ingredients={ingredients}
            setSelectedRecipe={setSelectedRecipe}
            deleteRecipe={deleteRecipe}
          />
        )}
      </div>
    </div>
  );
};

interface RecipeListProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  setSelectedRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
}

const RecipeList = React.memo(({ recipes, ingredients, setSelectedRecipe, deleteRecipe }: RecipeListProps) => {
  const ingMap = React.useMemo(() => new Map(ingredients.map(i => [i.id, i])), [ingredients]);

  return (
    <>
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          ingMap={ingMap}
          setSelectedRecipe={setSelectedRecipe}
          deleteRecipe={deleteRecipe}
        />
      ))}
    </>
  );
});

RecipeList.displayName = 'RecipeList';

interface RecipeCardProps {
  recipe: Recipe;
  ingMap: Map<string, Ingredient>;
  setSelectedRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
}

const RecipeCard = React.memo(({ recipe, ingMap, setSelectedRecipe, deleteRecipe }: RecipeCardProps) => {
  const { totalHpp, sellingPrice } = React.useMemo(() => {
    const hpp = (recipe.items || []).reduce((acc, item) => {
      const ing = ingMap.get(item.ingredientId);
      if (!ing || !ing.conversionValue) return acc;
      const pricePerUnit = ing.purchasePrice / ing.conversionValue;
      return acc + (item.quantityNeeded * pricePerUnit);
    }, 0);

    const waste = hpp * ((recipe.shrinkagePercent || 0) / 100);
    const total = hpp + waste + (recipe.laborCost || 0) + (recipe.overheadCost || 0);
    const selling = recipe.roundedSellingPrice || recipe.sellingPrice || 0;

    return { totalHpp: total, sellingPrice: selling };
  }, [recipe, ingMap]);

  return (
    <div
      className="group bg-white rounded-2xl border border-slate-100 p-4 space-y-3 hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer active:scale-[0.98]"
      onClick={() => setSelectedRecipe(recipe)}
    >
      {/* Baris 1: Nama Menu (kiri) & Kategori (kanan) */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">
          {recipe.name.toUpperCase()}
        </h3>
        <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 border-blue-500/20 text-blue-600 uppercase">
          {recipe.category || "Makanan"}
        </Badge>
      </div>

      {/* Baris 2: HPP Total, Harga Jual, Ikon Pensil, Ikon Delete */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-8 sm:gap-16">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">HPP Total</p>
            <p className="text-[11px] font-black text-rose-500">
              {formatIDR(totalHpp)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Harga Jual</p>
            <p className="text-[11px] font-black text-emerald-600">
              {formatIDR(sellingPrice)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRecipe(recipe);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-xl"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if(window.confirm('Hapus resep ini?')) deleteRecipe(recipe.id);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

RecipeCard.displayName = 'RecipeCard';
