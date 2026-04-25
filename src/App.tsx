import * as React from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { EngineDashboard } from "./components/EngineDashboard";
import { BahanManager } from "./components/BahanManager";
import { RecipeManager } from "./components/RecipeManager";
import { JobdeskManager } from "./components/JobdeskManager";
import { HistoryManager } from "./components/HistoryManager";
import { PettyCashManager } from "./components/PettyCashManager";
import { StorageManager } from "./components/StorageManager";
import { useAppState } from "./hooks/useAppState";
import { Ingredient, Recipe, Employee, Transaction, Expense } from "./types";
import { CATEGORIES, JOBDESK_MARKDOWN } from "./constants";
import { formatCurrency, cn } from "@/lib/utils";
import * as pdfService from "./services/pdfService";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

// Import New Modules
import KasirGoPage from "./app/kasirgo/page";
import RestaurantAssetsPage from "./app/restaurant-assets/page";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("ErrorBoundary caught an error", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">Ups! Terjadi kesalahan.</h1>
            <p className="text-slate-500">Silakan muat ulang halaman atau hubungi pengembang.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">Muat Ulang</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// v1.0.3 - Absolute Path Fix
export default function App() {
  React.useEffect(() => {
    // Inject Aggressive Global Scrollbar Hide Styles
    const style = document.createElement('style');
    style.innerHTML = `
      /* Hide scrollbar for Chrome, Safari and Opera */
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
      }

      /* Hide scrollbar for IE, Edge and Firefox */
      * {
        -ms-overflow-style: none !important;  /* IE and Edge */
        scrollbar-width: none !important;      /* Firefox */
      }

      html, body, #root {
        overflow: hidden !important;
        height: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: var(--background) !important;
      }

      /* Target every possible scrollable container */
      [class*="overflow-y-auto"], [class*="overflow-auto"], main, section, div {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }

      [class*="overflow-y-auto"]::-webkit-scrollbar,
      [class*="overflow-auto"]::-webkit-scrollbar,
      main::-webkit-scrollbar {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    window.onerror = (msg, url, line, col, error) => {
      console.error("Global Error (Caught by App):", { msg, url, line, col, error });
      return false;
    };
    window.onunhandledrejection = (event) => {
      console.error("Unhandled Rejection (Caught by App):", event.reason);
    };
  }, []);

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = React.useState("home");
  const [transaksiTab, setTransaksiTab] = React.useState<'petty' | 'riwayat'>('petty');
  const [karyawanTab, setKaryawanTab] = React.useState<'data' | 'jobdesk' | 'slip' | 'jadwal' | 'absensi'>('data');
  
  const state = useAppState();
  const {
    ingredients,
    setIngredients,
    recipes,
    setRecipes,
    employees,
    setEmployees,
    transactions,
    setTransactions,
    expenses,
    setExpenses,
    pettyCash,
    setPettyCash,
    isLoaded,
    dailyIncomes,
    setDailyIncomes,
    deleteIngredient,
    deleteEmployee,
    handleBackup,
    handleRestore,
    handleAddIngredient,
    handleAddExpense,
    handleSaveEmployee,
    shifts,
    setShifts,
    weeklyPattern,
    setWeeklyPattern,
    attendances,
    toggleAttendance,
    maintenanceLogs,
    handleSaveAsset,
    handleDeleteAsset,
    handleAddMaintenance,
    restaurantAssets,
    isModalOpen,
    setIsModalOpen
  } = state;


  const [isAddingEmployee, setIsAddingEmployee] = React.useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = React.useState<string | null>(null);
  const [newEmployee, setNewEmployee] = React.useState<Partial<Employee>>({
    name: "",
    role: "",
    salary: 0
  });

  const [selectedTasks, setSelectedTasks] = React.useState<string[]>([]);
  const [reportTitle, setReportTitle] = React.useState("STANDAR OPERASIONAL PROSEDUR (SOP)");
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = React.useState<Employee | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  const toggleTask = (task: string) => {
    setSelectedTasks(prev => 
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const generateFilteredMarkdown = () => {
    if (selectedTasks.length === 0) return JOBDESK_MARKDOWN;
    
    let filtered = JOBDESK_MARKDOWN;
    const allTasks = JOBDESK_MARKDOWN.split('\n')
      .filter(line => line.includes('* [ ]'))
      .map(line => line.replace('* [ ]', '').trim());
    
    allTasks.forEach(task => {
      if (!selectedTasks.includes(task)) {
        filtered = filtered.replace(`* [ ] ${task}`, '');
      } else {
        filtered = filtered.replace(`* [ ] ${task}`, `* [x] ${task}`);
      }
    });
    
    return filtered.split('\n').filter(line => line.trim() !== '').join('\n');
  };

  const handleClosing = () => {
    const today = new Date().toLocaleDateString('id-ID');
    const todayTransactions = transactions.filter(t => new Date(t.date).toLocaleDateString('id-ID') === today);
    const todayExpenses = expenses.filter(e => new Date(e.date).toLocaleDateString('id-ID') === today);
    
    const totalSales = todayTransactions.reduce((acc, t) => acc + t.totalPrice, 0);
    const totalExp = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalSales - totalExp;

    alert(`Laporan Closing Hari Ini (${today}):\n\nTotal Penjualan: ${formatCurrency(totalSales)}\nTotal Pengeluaran: ${formatCurrency(totalExp)}\nLaba Bersih: ${formatCurrency(netProfit)}\n\nSaldo Petty Cash Akhir: ${formatCurrency(pettyCash)}`);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange} theme={state.theme} toggleTheme={state.toggleTheme} isModalOpen={isModalOpen}>
      <div className={cn(
        "mx-auto transition-all duration-500 w-full p-0 max-w-none"
      )}>
        {activeTab === "home" && (
          <EngineDashboard 
            transactions={transactions}
            recipes={recipes}
            ingredients={ingredients}
            onTabChange={handleTabChange}
            onProcessTransaction={state.handleProcessTransaction}
            theme={state.theme}
            toggleTheme={state.theme === 'light' ? state.toggleTheme : state.toggleTheme}
            isSyncing={state.isSyncing}
          />
        )}

        {activeTab === "kasirgo" && (
          <div className="min-h-full">
            <KasirGoPage 
              recipes={recipes}
              transactions={transactions}
              expenses={expenses}
              dailyIncomes={dailyIncomes}
              pettyCash={pettyCash}
              onProcessTransaction={state.handleProcessTransaction}
              onAddExpense={state.handleAddExpense}
              onDeleteExpense={state.handleDeleteExpense}
              onAddDailyIncome={state.handleUpdateDailyIncome}
              onDeleteDailyIncome={state.handleDeleteDailyIncome}
              onAddRecipe={state.handleAddRecipe}
              onUpdateRecipe={state.handleUpdateRecipe}
              onDeleteRecipe={state.handleDeleteRecipe}
              onVoidTransaction={state.handleVoidTransaction}
              onBack={() => setActiveTab('home')}
              onModalToggle={setIsModalOpen}
            />
          </div>
        )}

        {activeTab === "restaurant-assets" && (
          <div className="min-h-full">
            <RestaurantAssetsPage
              theme={state.theme}
              assets={restaurantAssets}
              maintenanceLogs={maintenanceLogs}
              onSaveAsset={handleSaveAsset}
              onDeleteAsset={handleDeleteAsset}
              onAddMaintenance={handleAddMaintenance}
              isLoaded={isLoaded}
              onModalToggle={setIsModalOpen}
            />
          </div>
        )}

        {activeTab === "bahan" && (
          <div className={cn(
            "min-h-full",
            state.theme === 'dark' ? "bg-[#0a0a0c]" : "bg-[var(--background)]"
          )}>
            <BahanManager
                ingredients={ingredients}
                recipes={recipes}
                handleExportInventoryPDF={() => pdfService.handleExportInventoryPDF(ingredients)}
                handleExportRecipePDF={(recipe) => pdfService.handleExportRecipePDF(recipe, ingredients)}
                onAddIngredient={state.handleAddIngredient}
                onUpdateIngredient={state.handleUpdateIngredient}
                onDeleteIngredient={state.deleteIngredient}
                onUpdateRecipe={state.handleUpdateRecipe}
                onDeleteRecipe={state.handleDeleteRecipe}
                theme={state.theme}
                onBackToDashboard={() => handleTabChange('home')}
                onModalToggle={setIsModalOpen}
              />
          </div>
        )}

        {activeTab === "resep" && (
          <RecipeManager 
            recipes={recipes}
            ingredients={ingredients}
            handleExportRecipePDF={(recipe) => pdfService.handleExportRecipePDF(recipe, ingredients)}
            onAddRecipe={state.handleAddRecipe}
            onUpdateRecipe={state.handleUpdateRecipe}
            onDeleteRecipe={state.handleDeleteRecipe}
            onModalToggle={setIsModalOpen}
          />
        )}

        {activeTab === "storage" && (
          <StorageManager onModalToggle={setIsModalOpen} />
        )}

        {activeTab === "karyawan" && (
          <div className="min-h-full">
            <JobdeskManager 
              employees={employees}
              karyawanTab={karyawanTab}
              setKaryawanTab={setKaryawanTab}
              isAddingEmployee={isAddingEmployee}
              setIsAddingEmployee={setIsAddingEmployee}
              newEmployee={newEmployee}
              setNewEmployee={setNewEmployee}
              setEditingEmployeeId={setEditingEmployeeId}
              handleSaveEmployee={async () => {
                await state.handleSaveEmployee(newEmployee, editingEmployeeId);
                setIsAddingEmployee(false);
                setEditingEmployeeId(null);
                setNewEmployee({ name: "", role: "", salary: 0 });
              }}
              deleteEmployee={deleteEmployee}
              selectedTasks={selectedTasks}
              toggleTask={toggleTask}
              reportTitle={reportTitle}
              setReportTitle={setReportTitle}
              handleExportJobdeskPDF={() => pdfService.handleExportJobdeskPDF(selectedTasks, reportTitle)}
              generateFilteredMarkdown={generateFilteredMarkdown}
              selectedEmployeeForSlip={selectedEmployeeForSlip}
              setSelectedEmployeeForSlip={setSelectedEmployeeForSlip}
              shifts={shifts}
              setShifts={setShifts}
              handleUpdateShift={state.handleUpdateShift}
              weeklyPattern={weeklyPattern}
              setWeeklyPattern={setWeeklyPattern}
              attendances={attendances}
              toggleAttendance={toggleAttendance}
              theme={state.theme}
              onModalToggle={setIsModalOpen}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
