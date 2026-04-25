import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search, 
  Filter, 
  FileText, 
  Trash2, 
  Pencil,
  FileDown,
  ArrowRight,
  ArrowLeft,
  Save,
  HelpCircle,
  ChevronLeft,
  ChevronDown
} from "lucide-react";
import { Ingredient, Unit, Recipe } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { RecipeManager } from "./RecipeManager";

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES, UNITS } from "../constants";
import { PriceInput } from "./PriceInput";
import { VarianceReport } from "./VarianceReport";

interface BahanManagerProps {
  ingredients: Ingredient[];
  setIngredients?: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  recipes: Recipe[];
  setRecipes?: React.Dispatch<React.SetStateAction<Recipe[]>>;
  deleteIngredient?: (id: string) => void;
  handleExportInventoryPDF: () => void;
  handleExportRecipePDF: (recipe: Recipe) => void;
  onAddIngredient?: (ingredient: Partial<Ingredient>) => Promise<void>;
  onUpdateIngredient?: (ingredient: Ingredient) => Promise<void>;
  onDeleteIngredient?: (id: string) => Promise<void>;
  onAddRecipe?: (recipe: Recipe) => Promise<void>;
  onUpdateRecipe?: (recipe: Recipe) => Promise<void>;
  onDeleteRecipe?: (id: string) => Promise<void>;
  theme?: 'light' | 'dark';
  onBackToDashboard?: () => void;
  onModalToggle?: (isOpen: boolean) => void;
}

export const BahanManager: React.FC<BahanManagerProps> = ({
  ingredients,
  setIngredients,
  recipes,
  setRecipes,
  deleteIngredient,
  handleExportInventoryPDF,
  handleExportRecipePDF,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  theme = 'light',
  onBackToDashboard,
  onModalToggle
}) => {
  const [activeManagerTab, setActiveManagerTab] = React.useState<'main' | 'bahan' | 'hpp' | 'resep'>('main');
  const [viewMode, setViewMode] = React.useState<'menu-list' | 'ingredient-list' | 'stock-opname'>('ingredient-list');
  const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null);

  // Sync isHppDetailOpen to parent via onModalToggle
  React.useEffect(() => {
    if (onModalToggle) {
      onModalToggle(selectedRecipeId !== null);
    }
  }, [selectedRecipeId, onModalToggle]);

  const [isAddingIngredient, _setIsAddingIngredient] = React.useState(false);
  const [isAddingRecipe, setIsAddingRecipe] = React.useState(false);
  const [newIngredient, setNewIngredient] = React.useState<Partial<Ingredient>>({
    name: "",
    category: CATEGORIES[0],
    purchasePrice: 0,
    purchaseUnit: "kg",
    useUnit: "gr",
    conversionValue: 1000,
    stockQuantity: 0,
    lowStockThreshold: 0
  });

  const [isStockIn, _setIsStockIn] = React.useState(false);
  const [isEditingIngredient, _setIsEditingIngredient] = React.useState(false);
  const [selectedIngredientForStock, setSelectedIngredientForStock] = React.useState<Ingredient | null>(null);
  const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
  const [stockInAmount, setStockInAmount] = React.useState(0);
  const [recipeToDelete, _setRecipeToDelete] = React.useState<Recipe | null>(null);
  const [ingredientToDelete, _setIngredientToDelete] = React.useState<{ing: Ingredient, recipeId?: string} | null>(null);

  const setIsAddingIngredient = (val: boolean) => {
    _setIsAddingIngredient(val);
    if (onModalToggle) onModalToggle(val);
  };

  const setIsEditingIngredient = (val: boolean) => {
    _setIsEditingIngredient(val);
    if (onModalToggle) onModalToggle(val);
  };

  const setIsStockIn = (val: boolean) => {
    _setIsStockIn(val);
    if (onModalToggle) onModalToggle(val);
  };

  const setRecipeToDelete = (val: Recipe | null) => {
    _setRecipeToDelete(val);
    if (onModalToggle) onModalToggle(!!val);
  };

  const setIngredientToDelete = (val: {ing: Ingredient, recipeId?: string} | null) => {
    _setIngredientToDelete(val);
    if (onModalToggle) onModalToggle(!!val);
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name) return;
    
    if (onAddIngredient) {
      await onAddIngredient({
        ...newIngredient,
        name: toTitleCase(newIngredient.name || "")
      });
    } else if (setIngredients) {
      const ingredient: Ingredient = {
        ...newIngredient as Ingredient,
        name: toTitleCase(newIngredient.name || ""),
        id: crypto.randomUUID(),
      };
      setIngredients([...ingredients, ingredient]);
    }

    setIsAddingIngredient(false);
    setNewIngredient({
      name: "",
      category: CATEGORIES[0],
      purchasePrice: 0,
      purchaseUnit: "kg",
      useUnit: "gr",
      conversionValue: 1000,
      stockQuantity: 0,
      lowStockThreshold: 0
    });
  };

  const handleStockIn = async () => {
    if (!selectedIngredientForStock || stockInAmount <= 0) return;
    const updatedIng = { 
      ...selectedIngredientForStock, 
      stockQuantity: selectedIngredientForStock.stockQuantity + (stockInAmount * selectedIngredientForStock.conversionValue) 
    };

    if (onUpdateIngredient) await onUpdateIngredient(updatedIng);
    else if (setIngredients) setIngredients(ingredients.map(ing => ing.id === updatedIng.id ? updatedIng : ing));
    
    setIsStockIn(false);
    setSelectedIngredientForStock(null);
    setStockInAmount(0);
  };

  const handleEditIngredient = async () => {
    if (!editingIngredient || !editingIngredient.name) return;
    
    if (onUpdateIngredient) await onUpdateIngredient(editingIngredient);
    else if (setIngredients) setIngredients(ingredients.map(ing => ing.id === editingIngredient.id ? editingIngredient : ing));
    
    setIsEditingIngredient(false);
    setEditingIngredient(null);
  };

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
  
  const filteredIngredients = selectedRecipeId 
    ? ingredients.filter(ing => (selectedRecipe?.items || []).some(item => item.ingredientId === ing.id))
    : ingredients;

  return (
    <div className={cn(
      "space-y-6 font-sans pb-10 px-0 min-h-screen transition-colors duration-500",
      "bg-transparent"
    )}>
      {/* FIXED DASHBOARD HEADER */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 pt-10 pb-4 text-center px-4 backdrop-blur-xl border-b rounded-b-[3.5rem]",
        "bg-white/80 border-slate-200 shadow-sm"
      )}>
        <h2 className={cn(
          "text-sm font-black tracking-widest uppercase",
          "text-slate-900"
        )}>
          STOK & HPP DASHBOARD
        </h2>
        <p className={cn(
          "font-black text-[9px] uppercase tracking-[0.2em] opacity-60",
          "text-blue-600"
        )}>
          Manajemen Food Cost
        </p>
      </div>

      <div className="pt-24 px-6 h-full">
        {/* Top Navigation Cards (CENTRAL HUB MODE) */}
        {activeManagerTab === 'main' ? (
          <div className="flex flex-col justify-center min-h-[60vh] gap-4">
            {/* Card 1: DATABASE BAHAN BAKU */}
            <div
              onClick={() => {
                setActiveManagerTab('bahan');
                setViewMode('ingredient-list');
                setSelectedRecipeId(null);
              }}
              className={cn(
                "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] p-6 border h-28 flex flex-col justify-center shadow-sm",
                "bg-white border-slate-100 hover:bg-blue-50 hover:shadow-lg shadow-slate-200/50"
              )}
            >
              <div className="relative z-10 space-y-1">
                <h3 className={cn(
                  "text-sm font-black uppercase tracking-tight leading-none whitespace-nowrap",
                  "text-slate-800"
                )}>
                  DATABASE BAHAN BAKU
                </h3>
                <p className={cn(
                  "text-[8px] font-bold uppercase tracking-widest mt-1",
                  "text-blue-500"
                )}>
                  {ingredients.length} MATERIAL TERDATA
                </p>
              </div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
            </div>

            {/* Card 3: RESEP MENU & HPP */}
            <div
              onClick={() => {
                setActiveManagerTab('resep');
              }}
              className={cn(
                "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] p-6 border h-28 flex flex-col justify-center shadow-sm",
                "bg-white border-slate-100 hover:bg-cyan-50 hover:shadow-lg shadow-slate-200/50"
              )}
            >
              <div className="relative z-10 space-y-1">
                <h3 className={cn(
                  "text-sm font-black uppercase tracking-tight leading-none whitespace-nowrap",
                  "text-slate-800"
                )}>
                  RESEP MENU & HPP
                </h3>
                <p className={cn(
                  "text-[8px] font-bold uppercase tracking-widest mt-1",
                  "text-cyan-600"
                )}>
                  {recipes.length} MENU TERSEDIA
                </p>
              </div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-colors" />
            </div>
          </div>
        ) : (
        <div className="flex items-center gap-3 mb-6 bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
          <Button
            variant="ghost"
            onClick={() => setActiveManagerTab('main')}
            className="h-12 w-12 p-0 rounded-xl bg-background border border-border shadow-sm text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-base font-black uppercase tracking-tight text-blue-600 leading-none">
              {activeManagerTab === 'bahan' ? "Database Bahan Baku" : "Resep Menu & HPP"}
            </h2>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Manajemen Data Operasional
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons for Active Mode */}
      <AnimatePresence mode="wait">
        {activeManagerTab === 'bahan' && (
          <div className="flex flex-col gap-2 mb-4">
            <Dialog open={isAddingIngredient} onOpenChange={setIsAddingIngredient}>
              <DialogTrigger asChild>
                <Button className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-blue-500/20">
                  TAMBAH BAHAN BAKU
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-4rem)] sm:max-w-sm mx-auto rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white animate-in zoom-in-95 duration-200">
                {/* Premium Header with Gradient */}
                <div className="relative p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-[2.5rem]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <DialogTitle className="relative text-base font-bold text-white tracking-tight flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-primary">
                      <Plus size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span>Bahan Baru</span>
                      <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Master Database</span>
                    </div>
                  </DialogTitle>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-4 bg-white max-h-[60vh] overflow-y-auto no-scrollbar">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Bahan</label>
                    <Input
                      placeholder="Contoh: Ayam Karkas"
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient({ ...newIngredient, name: toTitleCase(e.target.value) })}
                      className="h-11 pl-4 rounded-xl border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Beli (Rp)</label>
                      <PriceInput
                        value={newIngredient.purchasePrice || 0}
                        onChange={(val) => setNewIngredient({ ...newIngredient, purchasePrice: val })}
                        className="h-11 rounded-xl border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Satuan Beli</label>
                      <select
                        title="Pilih Satuan Beli"
                        className="w-full h-11 rounded-xl border-slate-100 bg-slate-50/50 px-3 text-sm font-semibold text-slate-900 outline-none appearance-none"
                        value={newIngredient.purchaseUnit}
                        onChange={(e) => setNewIngredient({ ...newIngredient, purchaseUnit: e.target.value })}
                      >
                        {UNITS.map(unit => <option key={unit} value={unit}>{unit.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Satuan Resep</label>
                      <select
                        title="Pilih Satuan Resep"
                        className="w-full h-11 rounded-xl border-slate-100 bg-slate-50/50 px-3 text-sm font-semibold text-slate-900 outline-none appearance-none"
                        value={newIngredient.useUnit}
                        onChange={(e) => setNewIngredient({ ...newIngredient, useUnit: e.target.value as Unit })}
                      >
                        {UNITS.map(unit => <option key={unit} value={unit}>{unit.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Konversi</label>
                      <Input
                        type="number"
                        value={newIngredient.conversionValue}
                        onChange={(e) => setNewIngredient({ ...newIngredient, conversionValue: Number(e.target.value) })}
                        className="h-11 rounded-xl border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 bg-white flex gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsAddingIngredient(false)} 
                    className="flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (onAddIngredient) await onAddIngredient(newIngredient);
                      setIsAddingIngredient(false);
                    }} 
                    className="flex-[1.5] h-12 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Simpan Bahan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={() => handleExportInventoryPDF()}
              className="h-12 w-full border-border bg-background hover:bg-muted rounded-xl font-black uppercase tracking-widest text-xs shadow-sm"
            >
              EXPORT PDF
            </Button>
          </div>
        )}
        {activeManagerTab === 'resep' && (
          <div className="flex flex-col gap-2 mb-4">
            <Button
              onClick={() => setIsAddingRecipe(true)}
              className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md shadow-blue-500/20"
            >
              BUAT MENU BARU
            </Button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeManagerTab === 'bahan' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <IngredientList
              ingredients={ingredients}
              setEditingIngredient={setEditingIngredient}
              setIsEditingIngredient={setIsEditingIngredient}
              setSelectedIngredientForStock={setSelectedIngredientForStock}
              setIsStockIn={setIsStockIn}
              setIngredientToDelete={setIngredientToDelete}
            />
          </motion.div>
        )}

        {activeManagerTab === 'resep' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RecipeManager
              recipes={recipes}
              ingredients={ingredients}
              handleExportRecipePDF={handleExportRecipePDF}
              isAddingRecipe={isAddingRecipe}
              setIsAddingRecipe={setIsAddingRecipe}
              hideHeader={true}
              onAddRecipe={onAddRecipe}
              onUpdateRecipe={onUpdateRecipe}
              onDeleteRecipe={onDeleteRecipe}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!recipeToDelete} onOpenChange={(open) => !open && setRecipeToDelete(null)}>
        <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl">
          <DialogHeader className="p-6">
            <DialogTitle className="text-xl font-bold text-slate-900">Konfirmasi Hapus Resep</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2">
              Apakah Anda yakin ingin menghapus resep <span className="font-bold text-slate-900">"{recipeToDelete?.name}"</span>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 grid grid-cols-2">
            <Button 
              variant="outline" 
              onClick={() => setRecipeToDelete(null)}
              className="w-full h-14 rounded-full font-bold border-2 border-slate-200 text-slate-600 hover:bg-white text-sm"
            >
              Batal
            </Button>
            <Button 
              onClick={async () => {
                if (recipeToDelete) {
                  if (onDeleteRecipe) await onDeleteRecipe(recipeToDelete.id);
                  else if (setRecipes) setRecipes(recipes.filter(r => r.id !== recipeToDelete.id));
                  setRecipeToDelete(null);
                }
              }}
              className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold shadow-lg shadow-rose-600/20 text-sm"
            >
              Hapus Resep
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ingredientToDelete} onOpenChange={(open) => !open && setIngredientToDelete(null)}>
        <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl">
          <DialogHeader className="p-6">
            <DialogTitle className="text-xl font-bold text-slate-900">Konfirmasi Hapus Bahan</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2">
              {ingredientToDelete?.recipeId 
                ? `Apakah Anda yakin ingin menghapus "${ingredientToDelete.ing.name}" dari resep ini?`
                : `Apakah Anda yakin ingin menghapus "${ingredientToDelete?.ing.name}" dari database master?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 grid grid-cols-2">
            <Button 
              variant="outline" 
              onClick={() => setIngredientToDelete(null)}
              className="w-full h-14 rounded-full font-bold border-2 border-slate-200 text-slate-600 hover:bg-white text-sm"
            >
              Batal
            </Button>
            <Button 
              onClick={async () => {
                if (ingredientToDelete) {
                  if (ingredientToDelete.recipeId) {
                    const targetRecipe = recipes.find(r => r.id === ingredientToDelete.recipeId);
                    if (targetRecipe) {
                      const updated = { ...targetRecipe, items: targetRecipe.items.filter(item => item.ingredientId !== ingredientToDelete.ing.id) };
                      if (onUpdateRecipe) await onUpdateRecipe(updated);
                      else if (setRecipes) setRecipes(recipes.map(r => r.id === targetRecipe.id ? updated : r));
                    }
                  } else {
                    if (onDeleteIngredient) await onDeleteIngredient(ingredientToDelete.ing.id);
                    else if (deleteIngredient) deleteIngredient(ingredientToDelete.ing.id);
                  }
                  setIngredientToDelete(null);
                }
              }}
              className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold shadow-lg shadow-rose-600/20 text-sm"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingIngredient} onOpenChange={setIsEditingIngredient}>
        <DialogContent 
          showCloseButton={false}
          className="w-[calc(100%-4rem)] sm:max-w-sm mx-auto rounded-[2.5rem] p-0 overflow-visible border-none shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-white animate-in zoom-in-95 duration-200"
        >
          {/* Premium Header with Gradient */}
          <div className="relative p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-[2.5rem]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="relative flex items-center justify-center">
              <DialogTitle className="text-base font-bold text-white tracking-tight flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-primary">
                  <Pencil size={18} />
                </div>
                <div className="flex flex-col">
                  <span>Edit Bahan Baku</span>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Update Inventori</span>
                </div>
              </DialogTitle>
            </div>
          </div>

          {editingIngredient && (
            <div className="p-6 pt-4 space-y-4 bg-white overflow-visible">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Bahan Baku</label>
                <Input
                  placeholder="Contoh: Daging Sapi Sirloin"
                  value={editingIngredient.name}
                  onChange={(e) => setEditingIngredient({...editingIngredient, name: toTitleCase(e.target.value)})}
                  className="h-11 rounded-xl border-slate-200 bg-white font-bold focus:bg-white focus:border-primary transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <select
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold outline-none focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
                    value={editingIngredient.category}
                    onChange={(e) => setEditingIngredient({...editingIngredient, category: e.target.value})}
                    title="Edit Kategori"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Satuan Beli</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold outline-none focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
                    value={editingIngredient.purchaseUnit}
                    onChange={(e) => setEditingIngredient({...editingIngredient, purchaseUnit: e.target.value as Unit})}
                    title="Edit Satuan Beli"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Beli (Rp)</label>
                  <PriceInput 
                    value={editingIngredient.purchasePrice || 0}
                    onChange={(val) => setEditingIngredient({...editingIngredient, purchasePrice: val})}
                    className="h-11 rounded-xl border-slate-200 bg-white font-black text-blue-600 focus:border-primary shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Konversi (Gr/Ml)</label>
                  <Input 
                    type="number" 
                    value={editingIngredient.conversionValue || ""}
                    onChange={(e) => setEditingIngredient({...editingIngredient, conversionValue: Number(e.target.value)})}
                    className="h-11 rounded-xl border-slate-200 bg-white font-black focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Safety Stock (Min)</label>
                <Input 
                  type="number" 
                  value={editingIngredient.lowStockThreshold || ""}
                  onChange={(e) => setEditingIngredient({...editingIngredient, lowStockThreshold: Number(e.target.value)})}
                  className="h-11 rounded-xl border-slate-200 bg-white font-black focus:border-primary shadow-sm"
                />
              </div>

              {/* Integrated Guideline (Cheat Sheet) */}
              <div className="mt-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <HelpCircle className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Guideline Pengisian</span>
                </div>
                <p className="text-[9px] leading-relaxed text-slate-500 font-medium">
                  Gunakan nama spesifik (Contoh: Ayam Karkas). Harga Beli adalah harga per Satuan Beli. Nilai Konversi adalah jumlah Satuan Pakai dalam 1 Satuan Beli.
                </p>
              </div>
            </div>
          )}

          {/* FLUSH FOOTER - No DialogFooter to avoid margin issues */}
          <div className="px-6 pb-6 pt-3 bg-white gap-3 flex flex-row shrink-0 rounded-b-[2.5rem] border-t border-slate-50">
            <Button onClick={handleEditIngredient} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
              SIMPAN
            </Button>
            <Button variant="ghost" onClick={() => setIsEditingIngredient(false)} className="flex-1 h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all">
              BATAL
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockIn} onOpenChange={setIsStockIn}>
        <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-3xl">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-xl font-bold text-slate-900">Input Stok Masuk</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Update jumlah stok untuk {selectedIngredientForStock?.name}.</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah Masuk ({selectedIngredientForStock?.purchaseUnit})</label>
                <Input 
                  type="number" 
                  value={stockInAmount || ""}
                  onChange={(e) => setStockInAmount(Number(e.target.value))}
                  className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm px-6"
                />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-50 gap-3 grid grid-cols-2">
            <Button onClick={handleStockIn} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black uppercase text-sm tracking-wider shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
              Update Stok
            </Button>
            <button onClick={() => setIsStockIn(false)} className="w-full h-14 rounded-full font-black uppercase text-sm tracking-wider bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
              Batal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

interface IngredientListProps {
  ingredients: Ingredient[];
  setEditingIngredient: (ing: Ingredient) => void;
  setIsEditingIngredient: (val: boolean) => void;
  setSelectedIngredientForStock: (ing: Ingredient) => void;
  setIsStockIn: (val: boolean) => void;
  setIngredientToDelete: (val: {ing: Ingredient}) => void;
}

const IngredientList = React.memo(({
  ingredients,
  setEditingIngredient,
  setIsEditingIngredient,
  setSelectedIngredientForStock,
  setIsStockIn,
  setIngredientToDelete
}: IngredientListProps) => {
  return (
    <div className="flex flex-col gap-2">
      {ingredients.map(ing => (
        <IngredientCard
          key={ing.id}
          ing={ing}
          setEditingIngredient={setEditingIngredient}
          setIsEditingIngredient={setIsEditingIngredient}
          setSelectedIngredientForStock={setSelectedIngredientForStock}
          setIsStockIn={setIsStockIn}
          setIngredientToDelete={setIngredientToDelete}
        />
      ))}
    </div>
  );
});

IngredientList.displayName = 'IngredientList';

interface IngredientCardProps {
  ing: Ingredient;
  setEditingIngredient: (ing: Ingredient) => void;
  setIsEditingIngredient: (val: boolean) => void;
  setSelectedIngredientForStock: (ing: Ingredient) => void;
  setIsStockIn: (val: boolean) => void;
  setIngredientToDelete: (val: {ing: Ingredient}) => void;
}

const IngredientCard = React.memo(({
  ing,
  setEditingIngredient,
  setIsEditingIngredient,
  setSelectedIngredientForStock,
  setIsStockIn,
  setIngredientToDelete
}: IngredientCardProps) => {
  return (
    <div
      className="group bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-3 space-y-2 hover:shadow-lg hover:shadow-blue-200/50 transition-all cursor-pointer active:scale-[0.98]"
      onClick={() => { setEditingIngredient({...ing}); setIsEditingIngredient(true); }}
    >
      {/* Baris 1: Nama Bahan (kiri) & Kategori (kanan) */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
          {ing.name.toUpperCase()}
        </h3>
        <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 border-blue-500/20 text-blue-600 uppercase">
          {ing.category}
        </Badge>
      </div>

      {/* Baris 2: Stok, Harga/Unit, Aksi */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-8 sm:gap-16">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Stok</p>
            <p className="text-[11px] font-black text-emerald-600">
              {ing.stockQuantity / (ing.conversionValue || 1)} {ing.purchaseUnit}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Harga/Unit</p>
            <p className="text-[11px] font-black text-rose-500">
              {formatCurrency(ing.purchasePrice / (ing.conversionValue || 1))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIngredientForStock(ing);
              setIsStockIn(true);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors bg-slate-50 rounded-xl"
            title="Tambah Stok"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingIngredient({...ing});
              setIsEditingIngredient(true);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-xl"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIngredientToDelete({ ing });
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

IngredientCard.displayName = 'IngredientCard';
