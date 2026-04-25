/** [LOCKED] FINAL PRODUCTION BUILD - NO AGENT MODIFICATIONS ALLOWED **/
import * as React from "react";
import { useRef } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Trash2, 
  Edit2,
  ChevronRight,
  ChevronLeft,
  FileDown,
  Save,
  Package,
  UtensilsCrossed,
  Receipt,
  Download,
  CalendarDays,
  Layers,
  Users,
  CheckCircle2,
  Printer,
  Zap,
  Wallet,
  History,
  Calculator,
  ClipboardCheck,
  Clock
} from "lucide-react";
import { Employee, ShiftType, EditModalState, Attendance } from "../types";
import { formatCurrency, cn, toTitleCase } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JOBDESK_MARKDOWN } from "../constants";
import { generateMonthDates, generateShiftsFromPattern, AVATAR_COLORS, getEmployeeInitials } from "../schedulerConstants";
import SchedulerHeader from "./scheduler/SchedulerHeader";
import ScheduleGrid from "./scheduler/ScheduleGrid";
import PatternManager from "./scheduler/PatternManager";
import * as pdfService from "../services/pdfService";
import { AttendanceGrid } from "./sdm/AttendanceGrid";
import { ShiftCheatSheet } from "./sdm/ShiftCheatSheet";

interface JobdeskManagerProps {
  employees: Employee[];
  karyawanTab: 'data' | 'jobdesk' | 'slip' | 'jadwal' | 'absensi';
  setKaryawanTab: (val: 'data' | 'jobdesk' | 'slip' | 'jadwal' | 'absensi') => void;
  isAddingEmployee: boolean;
  setIsAddingEmployee: (val: boolean) => void;
  newEmployee: Partial<Employee>;
  setNewEmployee: (val: Partial<Employee>) => void;
  setEditingEmployeeId: (id: string | null) => void;
  handleSaveEmployee: () => void;
  deleteEmployee: (id: string) => void;
  selectedTasks: string[];
  toggleTask: (task: string) => void;
  reportTitle: string;
  setReportTitle: (val: string) => void;
  handleExportJobdeskPDF: () => void;
  generateFilteredMarkdown: () => string;
  selectedEmployeeForSlip: Employee | null;
  setSelectedEmployeeForSlip: (val: Employee | null) => void;
  // Shift related props
  shifts: Record<string, Record<string, ShiftType>>;
  setShifts: React.Dispatch<React.SetStateAction<Record<string, Record<string, ShiftType>>>>;
  handleUpdateShift: (employeeId: string, date: string, type: ShiftType) => Promise<void>;
  weeklyPattern: Record<string, ShiftType[]>;
  setWeeklyPattern: React.Dispatch<React.SetStateAction<Record<string, ShiftType[]>>>;
  attendances: Attendance[];
  toggleAttendance: (employeeId: string, date: string, status: Attendance['status']) => void;
  theme?: 'light' | 'dark';
  onModalToggle?: (isOpen: boolean) => void;
}

export const JobdeskManager: React.FC<JobdeskManagerProps> = ({
  employees,
  karyawanTab,
  setKaryawanTab,
  isAddingEmployee,
  setIsAddingEmployee,
  newEmployee,
  setNewEmployee,
  setEditingEmployeeId,
  handleSaveEmployee,
  deleteEmployee,
  selectedTasks,
  toggleTask,
  reportTitle,
  setReportTitle,
  handleExportJobdeskPDF,
  generateFilteredMarkdown,
  selectedEmployeeForSlip,
  setSelectedEmployeeForSlip,
  shifts,
  setShifts,
  handleUpdateShift,
  weeklyPattern,
  setWeeklyPattern,
  attendances,
  toggleAttendance,
  theme = 'dark',
  onModalToggle
}) => {
  const [schedulerView, setSchedulerView] = React.useState<'grid' | 'pattern'>('grid');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = React.useState(true);
  const [isCheatSheetOpen, _setIsCheatSheetOpen] = React.useState(false);

  // LOCAL STATE FOR PAYSLIP FORM
  const [slipData, setSlipData] = React.useState<Record<string, {
    baseSalary: number;
    allowance: number;
    overtime: number;
    thr: number;
    alphaDeduction: number;
    hrdNotes: string;
  }>>({});

  const handleUpdateSlipData = (empId: string, field: string, value: any) => {
    setSlipData(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || { baseSalary: 0, allowance: 0, overtime: 0, thr: 0, alphaDeduction: 0, hrdNotes: "" }),
        [field]: value
      }
    }));
  };

  // Initialize form with employee's stored base salary when employee is selected
  React.useEffect(() => {
    if (selectedEmployeeForSlip && !slipData[selectedEmployeeForSlip.id]) {
      handleUpdateSlipData(selectedEmployeeForSlip.id, 'baseSalary', selectedEmployeeForSlip.salary);
    }
  }, [selectedEmployeeForSlip]);

  const setIsCheatSheetOpen = (val: boolean) => {
    _setIsCheatSheetOpen(val);
    if (onModalToggle) onModalToggle(val);
  };
  
  const gridRef = useRef<HTMLDivElement>(null);
  const patternRef = useRef<HTMLDivElement>(null);

  const monthDates = React.useMemo(() => 
    generateMonthDates(currentDate.getFullYear(), currentDate.getMonth()), 
    [currentDate]
  );

  const handleCycleShift = (employeeId: string, dateStr: string, currentType: ShiftType) => {
    const SHIFT_ORDER: ShiftType[] = [ShiftType.PAGI, ShiftType.MIDDLE, ShiftType.LIBUR];
    const currentIndex = SHIFT_ORDER.indexOf(currentType);
    const nextType = SHIFT_ORDER[(currentIndex + 1) % SHIFT_ORDER.length];
    
    handleUpdateShift(employeeId, dateStr, nextType);
  };

  const [inlineEditId, setInlineEditId] = React.useState<string | null>(null);
  const [inlineData, setInlineData] = React.useState<Partial<Employee>>({});

  const handleSaveInline = (id: string) => {
    setNewEmployee(inlineData);
    setEditingEmployeeId(id);
    handleSaveEmployee();
    setInlineEditId(null);
  };

  const laborProgressBarRef = React.useRef<HTMLDivElement>(null);

  const totalMonthlyPayroll = React.useMemo(() => 
    employees.reduce((sum, emp) => sum + (emp.salary || 0), 0),
    [employees]
  );
  
  const laborCostPercentage = 15.5; // Placeholder target

  React.useEffect(() => {
    if (laborProgressBarRef.current) {
      laborProgressBarRef.current.style.width = `${Math.min(laborCostPercentage, 100)}%`;
    }
  }, [laborCostPercentage]);

  const handleApplyPattern = (patternToApply: Record<string, ShiftType[]>) => {
    const newShiftsForMonth = generateShiftsFromPattern(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        employees,
        patternToApply
    );

    setShifts(prevShifts => {
        const updatedShifts = { ...prevShifts };
        Object.keys(newShiftsForMonth).forEach(empId => {
            updatedShifts[empId] = {
                ...(updatedShifts[empId] || {}),
                ...newShiftsForMonth[empId]
            };
        });
        
        // Sync to Supabase
        Object.keys(newShiftsForMonth).forEach(empId => {
          Object.entries(newShiftsForMonth[empId]).forEach(([date, type]) => {
            handleUpdateShift(empId, date, type as ShiftType);
          });
        });

        return updatedShifts;
    });
  };

  const navigateTo = (tab: 'data' | 'jobdesk' | 'slip' | 'jadwal' | 'absensi') => {
    setKaryawanTab(tab);
    setIsMenuOpen(false);
    if (tab === 'jadwal' && onModalToggle) onModalToggle(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToMenu = () => {
    if (karyawanTab === 'jadwal' && onModalToggle) onModalToggle(false);
    setIsMenuOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isMenuOpen) {
    return (
      <div className={cn(
        "py-0 px-0 min-h-full animate-in fade-in duration-700",
        theme === 'dark' ? "bg-[#0a0a0c]" : "bg-transparent"
      )}>
        <div className={cn(
          "fixed top-0 left-0 right-0 z-50 pt-10 pb-4 text-center px-4 backdrop-blur-xl border-b rounded-b-[3.5rem]",
          theme === 'dark' ? "bg-[#0a0a0c]/80 border-white/5" : "bg-white/80 border-slate-200 shadow-sm"
        )}>
          <h2 className={cn(
            "text-sm font-black tracking-widest uppercase",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>SDM Dashboard</h2>
          <p className={cn(
            "font-black text-[9px] uppercase tracking-[0.2em] opacity-60",
            theme === 'dark' ? "text-slate-400" : "text-slate-500"
          )}>Manajemen Tim & Operasional</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-20 pt-24 px-6">
          <div
            onClick={() => navigateTo('data')}
            className={cn(
              "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] p-5 border h-24 flex flex-col justify-center items-start text-left active:scale-95 shadow-sm",
              theme === 'dark'
                ? "bg-blue-500/20 backdrop-blur-xl border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20"
                : "bg-white border-slate-100 hover:bg-slate-50 hover:shadow-md"
            )}
          >
            <div className="relative z-10 space-y-1">
              <h3 className={cn(
                "text-sm font-black uppercase tracking-tight leading-none",
                theme === 'dark' ? "text-white" : "text-slate-800"
              )}>Data Karyawan</h3>
              <p className={cn(
                "text-[8px] font-black uppercase tracking-widest mt-1.5",
                theme === 'dark' ? "text-blue-100/80" : "text-slate-500"
              )}>Profil lengkap & manajemen tim operasional.</p>
            </div>
            {theme === 'dark' && <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all" />}
          </div>

          <div
            onClick={() => navigateTo('absensi')}
            className={cn(
              "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] p-5 border h-24 flex flex-col justify-center items-start text-left active:scale-95 shadow-sm",
              theme === 'dark'
                ? "bg-blue-500/20 backdrop-blur-xl border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20"
                : "bg-white border-slate-100 hover:bg-slate-50 hover:shadow-md"
            )}
          >
            <div className="relative z-10 space-y-1">
              <h3 className={cn(
                "text-sm font-black uppercase tracking-tight leading-none",
                theme === 'dark' ? "text-white" : "text-slate-800"
              )}>Absensi Karyawan</h3>
              <p className={cn(
                "text-[8px] font-black uppercase tracking-widest mt-1.5",
                theme === 'dark' ? "text-blue-100/80" : "text-slate-500"
              )}>Pencatatan kehadiran harian tim.</p>
            </div>
            {theme === 'dark' && <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all" />}
          </div>

          <div
            onClick={() => navigateTo('jobdesk')}
            className={cn(
              "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] p-5 border h-24 flex flex-col justify-center items-start text-left active:scale-95 shadow-sm",
              theme === 'dark'
                ? "bg-blue-500/20 backdrop-blur-xl border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20"
                : "bg-white border-slate-100 hover:bg-slate-50 hover:shadow-md"
            )}
          >
            <div className="relative z-10 space-y-1">
              <h3 className={cn(
                "text-sm font-black uppercase tracking-tight leading-none",
                theme === 'dark' ? "text-white" : "text-slate-800"
              )}>Jobdesk (SPO)</h3>
              <p className={cn(
                "text-[8px] font-black uppercase tracking-widest mt-1.5",
                theme === 'dark' ? "text-blue-100/80" : "text-slate-500"
              )}>Standar Prosedur Operasional & tanggung jawab.</p>
            </div>
            {theme === 'dark' && <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all" />}
          </div>

          <div
            onClick={() => navigateTo('slip')}
            className={cn(
              "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] p-5 border h-24 flex flex-col justify-center items-start text-left active:scale-95 shadow-sm",
              theme === 'dark'
                ? "bg-blue-500/20 backdrop-blur-xl border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20"
                : "bg-white border-slate-100 hover:bg-slate-50 hover:shadow-md"
            )}
          >
            <div className="relative z-10 space-y-1">
              <h3 className={cn(
                "text-sm font-black uppercase tracking-tight leading-none",
                theme === 'dark' ? "text-white" : "text-slate-800"
              )}>Slip Gaji</h3>
              <p className={cn(
                "text-[8px] font-black uppercase tracking-widest mt-1.5",
                theme === 'dark' ? "text-blue-100/80" : "text-slate-500"
              )}>Penghitungan gaji & pencetakan slip resmi.</p>
            </div>
            {theme === 'dark' && <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all" />}
          </div>

          <div
            onClick={() => navigateTo('jadwal')}
            className={cn(
              "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] p-5 border h-24 flex flex-col justify-center items-start text-left active:scale-95 shadow-sm",
              theme === 'dark'
                ? "bg-blue-500/20 backdrop-blur-xl border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20"
                : "bg-white border-slate-100 hover:bg-slate-50 hover:shadow-md"
            )}
          >
            <div className="relative z-10 space-y-1">
              <h3 className={cn(
                "text-sm font-black uppercase tracking-tight leading-none",
                theme === 'dark' ? "text-white" : "text-slate-800"
              )}>Jadwal Shift</h3>
              <p className={cn(
                "text-[8px] font-black uppercase tracking-widest mt-1.5",
                theme === 'dark' ? "text-blue-100/80" : "text-slate-500"
              )}>Penjadwalan visual dengan sistem cycle.</p>
            </div>
            {theme === 'dark' && <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all" />}
          </div>

          <Dialog open={isAddingEmployee} onOpenChange={setIsAddingEmployee}>
            <DialogTrigger asChild>
              <div className={cn(
                "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] p-5 border h-24 flex flex-col justify-center items-start text-left shadow-xl active:scale-95",
                theme === 'dark'
                  ? "bg-blue-600/20 backdrop-blur-xl border-blue-400/30 hover:bg-blue-600/30 hover:border-blue-400/50 shadow-blue-500/10"
                  : "bg-blue-500 border-blue-600 hover:bg-blue-400"
              )}>
                <div className="relative z-10 space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">Tambah Karyawan</h3>
                  <p className={cn(
                    "text-[8px] font-black uppercase tracking-widest mt-1.5",
                    theme === 'dark' ? "text-blue-100/80" : "text-white/80"
                  )}>Rekrutmen anggota tim baru.</p>
                </div>
                <div className={cn(
                  "absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-all",
                  theme === 'dark' ? "bg-blue-400/20 group-hover:bg-blue-400/30" : "bg-white/10"
                )} />
              </div>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-4rem)] sm:max-w-md mx-auto rounded-[2rem] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white animate-in zoom-in-95 duration-200">
              <div className="relative p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <DialogTitle className="relative text-lg font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-primary">
                    <Users size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span>Rekrutmen Baru</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Sistem SDM Terpusat</span>
                  </div>
                </DialogTitle>
              </div>

              <div className="p-8 space-y-6 bg-white">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <div className="w-1 h-1 bg-primary rounded-full" />
                    Nama Lengkap
                  </label>
                  <Input 
                    placeholder="Budi Santoso"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: toTitleCase(e.target.value)})}
                    className="h-14 pl-4 rounded-2xl border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      Jabatan
                    </label>
                    <Input 
                      placeholder="Cook / Server"
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({...newEmployee, role: toTitleCase(e.target.value)})}
                      className="h-14 pl-4 rounded-2xl border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      Gaji Pokok
                    </label>
                    <Input 
                      placeholder="Rp 0"
                      value={newEmployee.salary ? newEmployee.salary.toLocaleString('id-ID') : ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNewEmployee({...newEmployee, salary: val ? Number(val) : 0});
                      }}
                      className="h-14 pl-4 rounded-2xl border-slate-100 bg-slate-50/50 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 pt-2 bg-white flex gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsAddingEmployee(false)} 
                  className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleSaveEmployee} 
                  className="flex-[1.5] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Simpan Data
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative pb-40 px-0 min-h-full animate-in slide-in-from-right duration-500",
      theme === 'dark' ? "bg-[#0a0a0c]" : "bg-transparent"
    )}>
      {/* Header Navigasi - NOW STICKY */}
      {karyawanTab !== 'jadwal' && (
        <div className={cn(
          "sticky top-0 z-50 flex items-center gap-4 mb-6 pt-10 pb-4 px-6 backdrop-blur-xl border-b transition-all duration-300 rounded-b-[3.5rem]",
          theme === 'dark' ? "bg-[#0a0a0c]/80 border-white/5 shadow-2xl shadow-black/20" : "bg-white/80 border-slate-200 shadow-sm"
        )}>
          <Button
            variant="ghost"
            onClick={backToMenu}
            className={cn(
              "h-12 w-12 p-0 rounded-xl border shadow-sm transition-all active:scale-90",
              theme === 'dark'
                ? "bg-slate-900 border-white/10 text-blue-400 hover:bg-blue-500 hover:text-white"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <div className="flex flex-col">
            <h2 className={cn(
              "text-base font-black uppercase tracking-tight leading-none",
              theme === 'dark' ? "text-white" : "text-slate-900"
            )}>
              {karyawanTab === 'data' && "Data Karyawan"}
              {karyawanTab === 'jobdesk' && "Jobdesk (SPO)"}
              {karyawanTab === 'slip' && "Slip Gaji"}
              {karyawanTab === 'absensi' && "Absensi"}
            </h2>
            <p className={cn(
              "text-[8px] font-bold uppercase tracking-[0.2em] mt-1 opacity-60",
              theme === 'dark' ? "text-blue-200" : "text-slate-500"
            )}>
              Manajemen Tim & Operasional
            </p>
          </div>
        </div>
      )}

      <div className="px-6">
        <div className="lg:col-span-12">
          {karyawanTab === 'data' && (
            <div className="space-y-4 animate-in fade-in duration-700">
              <div className="flex flex-col gap-3">
                {employees.map(emp => (
                  <div
                    key={emp.id} 
                    className={cn(
                      "group bg-white/60 backdrop-blur-sm rounded-2xl border p-4 space-y-3 transition-all",
                      inlineEditId === emp.id ? "border-blue-500 shadow-lg ring-1 ring-blue-500/20" : "border-slate-200/50 hover:shadow-lg hover:shadow-blue-200/50 cursor-pointer active:scale-[0.98]"
                    )}
                    onClick={() => {
                      if (inlineEditId !== emp.id) {
                        setNewEmployee({
                          name: emp.name,
                          role: emp.role,
                          salary: emp.salary
                        });
                        setEditingEmployeeId(emp.id);
                        setIsAddingEmployee(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {inlineEditId === emp.id ? (
                        <Input
                          value={inlineData.name || ""}
                          onChange={(e) => setInlineData({...inlineData, name: e.target.value.toUpperCase()})}
                          className="h-8 text-[11px] font-black uppercase rounded-lg border-primary/30"
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">
                          {emp.name.toUpperCase()}
                        </h3>
                      )}

                      {inlineEditId === emp.id ? (
                        <Input
                          value={inlineData.role || ""}
                          onChange={(e) => setInlineData({...inlineData, role: e.target.value.toUpperCase()})}
                          className="h-7 text-[9px] font-black uppercase rounded-lg border-primary/20 text-primary w-24"
                        />
                      ) : (
                        <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 border-blue-500/20 text-blue-600 uppercase">
                          {emp.role.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gaji Bulanan</p>
                        {inlineEditId === emp.id ? (
                          <Input
                            placeholder="Rp 0"
                            value={inlineData.salary ? inlineData.salary.toLocaleString('id-ID') : ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setInlineData({...inlineData, salary: val ? Number(val) : 0});
                            }}
                            className="h-8 text-[11px] font-black rounded-lg border-primary/30 w-32"
                          />
                        ) : (
                          <p className="text-[11px] font-black text-emerald-600">
                            {formatCurrency(emp.salary)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {inlineEditId === emp.id ? (
                          <button
                            onClick={() => handleSaveInline(emp.id)}
                            className="p-2 text-emerald-500 hover:text-emerald-600 transition-colors bg-slate-50 rounded-xl"
                            title="Simpan"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInlineEditId(emp.id);
                              setInlineData({ name: emp.name, role: emp.role, salary: emp.salary });
                            }}
                            className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-xl"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (inlineEditId === emp.id) {
                              setInlineEditId(null);
                            } else if (window.confirm('Hapus karyawan ini?')) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl"
                          title={inlineEditId === emp.id ? "Batal" : "Hapus"}
                        >
                          {inlineEditId === emp.id ? "✕" : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {karyawanTab === 'jobdesk' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Judul Laporan SPO</label>
                  <Input 
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="h-14 rounded-2xl border-slate-100 font-bold bg-slate-50/50 focus:bg-white text-slate-900"
                    placeholder="Masukkan Judul Laporan..."
                  />
                </div>
                <div className="flex justify-center w-full">
                   <Button 
                    onClick={handleExportJobdeskPDF}
                    className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black tracking-widest shadow-xl active:scale-95 transition-all min-w-[200px]"
                  >
                    <FileDown className="w-6 h-6 mr-3" />
                    EXPORT PDF
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-10">
                <div className="prose prose-sm sm:prose-base prose-slate max-w-none
                  prose-headings:text-primary prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                  prose-p:text-slate-400 prose-p:font-bold prose-p:uppercase prose-p:text-[8px] prose-p:tracking-[0.2em]
                  prose-li:text-slate-700 prose-li:font-black prose-li:uppercase prose-li:text-[10px] prose-li:tracking-tight
                  prose-li:list-none prose-li:relative prose-li:pl-0 prose-li:mb-3
                  prose-h1:text-xl prose-h2:text-lg prose-h3:text-sm prose-h3:mb-6
                  no-scrollbar bg-white">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      li: ({children, ...props}) => {
                        return (
                          <li {...props} className="relative pl-0 mb-3 break-words list-none -ml-4">
                            {children}
                          </li>
                        );
                      }
                    }}
                  >
                    {generateFilteredMarkdown()}
                  </Markdown>
                </div>
              </div>
            </div>
          )}

          {karyawanTab === 'slip' && (
            <div className="space-y-6">
              {/* ULTRA COMPACT PAYROLL CONTROL PANEL */}
              <div className={cn(
                "p-4 rounded-[2rem] border transition-all duration-300",
                theme === 'dark' ? "bg-slate-900 border-white/5" : "bg-white border-slate-100 shadow-sm"
              )}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 border-b border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                       <Users size={14} />
                    </div>
                    {employees.map((emp, idx) => {
                      const isSelected = selectedEmployeeForSlip?.id === emp.id;
                      const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                      return (
                        <button
                          key={emp.id}
                          onClick={() => setSelectedEmployeeForSlip(emp)}
                          className={cn(
                            "flex items-center gap-2 py-1.5 px-3 rounded-full transition-all duration-300 border shrink-0",
                            isSelected 
                              ? "bg-pink-500 border-pink-600 text-white shadow-lg shadow-pink-500/30 scale-105"
                              : "bg-slate-50 border-slate-100 text-slate-500"
                          )}
                        >
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0", avatarColor)}>
                             {getEmployeeInitials(emp.name)}
                          </div>
                          <span className="text-[9px] font-black uppercase whitespace-nowrap">{emp.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedEmployeeForSlip ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1 animate-in slide-in-from-top-2 duration-300">
                       <div className="space-y-1">
                          <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Gaji Pokok</label>
                          <Input
                            value={(slipData[selectedEmployeeForSlip.id]?.baseSalary || 0).toLocaleString('id-ID')}
                            onChange={(e) => handleUpdateSlipData(selectedEmployeeForSlip.id, 'baseSalary', Number(e.target.value.replace(/\D/g, '')))}
                            className="h-9 text-[10px] rounded-lg bg-slate-50/50 border-slate-100 font-bold px-3 focus:bg-white transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Tunjangan</label>
                          <Input
                            value={(slipData[selectedEmployeeForSlip.id]?.allowance || 0).toLocaleString('id-ID')}
                            onChange={(e) => handleUpdateSlipData(selectedEmployeeForSlip.id, 'allowance', Number(e.target.value.replace(/\D/g, '')))}
                            className="h-9 text-[10px] rounded-lg bg-slate-50/50 border-slate-100 font-bold px-3 focus:bg-white transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Lembur</label>
                          <Input
                            value={(slipData[selectedEmployeeForSlip.id]?.overtime || 0).toLocaleString('id-ID')}
                            onChange={(e) => handleUpdateSlipData(selectedEmployeeForSlip.id, 'overtime', Number(e.target.value.replace(/\D/g, '')))}
                            className="h-9 text-[10px] rounded-lg bg-slate-50/50 border-slate-100 font-bold px-3 focus:bg-white transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">THR/Bonus</label>
                          <Input
                            value={(slipData[selectedEmployeeForSlip.id]?.thr || 0).toLocaleString('id-ID')}
                            onChange={(e) => handleUpdateSlipData(selectedEmployeeForSlip.id, 'thr', Number(e.target.value.replace(/\D/g, '')))}
                            className="h-9 text-[10px] rounded-lg bg-slate-50/50 border-slate-100 font-bold px-3 focus:bg-white transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[7px] font-black text-rose-400 uppercase tracking-widest ml-1">Potongan (-)</label>
                          <Input
                            value={(slipData[selectedEmployeeForSlip.id]?.alphaDeduction || 0).toLocaleString('id-ID')}
                            onChange={(e) => handleUpdateSlipData(selectedEmployeeForSlip.id, 'alphaDeduction', Number(e.target.value.replace(/\D/g, '')))}
                            className="h-9 text-[10px] rounded-lg bg-rose-50/30 border-rose-100 font-bold text-rose-600 px-3 focus:bg-white transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[7px] font-black text-indigo-400 uppercase tracking-widest ml-1">Catatan HRD</label>
                          <Input
                            value={slipData[selectedEmployeeForSlip.id]?.hrdNotes || ""}
                            onChange={(e) => handleUpdateSlipData(selectedEmployeeForSlip.id, 'hrdNotes', e.target.value)}
                            placeholder="..."
                            className="h-9 text-[10px] rounded-lg bg-indigo-50/10 border-indigo-100 font-bold px-3 focus:bg-white transition-all"
                          />
                       </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Geser & Pilih Karyawan untuk Input Gaji</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                {selectedEmployeeForSlip ? (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="w-full overflow-x-auto no-scrollbar pb-10">
                      <div className="min-w-[210mm] flex justify-center p-6">
                        <Card className="w-[210mm] h-auto min-h-[200mm] border-none bg-white rounded-none overflow-hidden relative font-sans text-slate-900 p-0 shadow-none">

                        {/* Boxed Header (PRECISION ALIGNMENT) */}
                        <div className="pt-12 px-[25mm]">
                          <div className="border-2 border-slate-900 rounded-xl p-6 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-6">
                              <img
                                src="https://mrrfmrzhumcmhmqjceul.supabase.co/storage/v1/object/sign/public-images/IMG-20260425-WA0010.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNGYxMmNiMy01YWU4LTRjYjQtYTgwZS00ZWEwMTlhOWE3YTciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwdWJsaWMtaW1hZ2VzL0lNRy0yMDI2MDQyNS1XQTAwMTAucG5nIiwiaWF0IjoxNzc3MTUwMDg1LCJleHAiOjE3Nzc3NTQ4ODV9.-7eC44SPNDU5Gw4gI8tOXxjgYU7gM-32VaSiPU_fjYA"
                                className="h-16 w-auto object-contain"
                                alt="Logo"
                              />
                              <div className="h-12 w-[1px] bg-slate-300" />
                            </div>
                            <div className="flex-1 text-center pr-10">
                              <p className="text-2xl font-black tracking-[0.4em] uppercase">
                                KEDAI <span className="text-blue-600">ELVERA</span> 57
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1 italic">DOKUMEN RESMI PENGGAJIAN</p>
                            </div>
                          </div>
                        </div>

                        <div className="px-[25mm] space-y-12 pt-10">
                            {/* Title Section (TANPA GARIS BAWAH) */}
                            <div className="text-center">
                              <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">SLIP GAJI</h1>
                            </div>

                            {/* Metadata Section (ALIGNED WITH TABLE) */}
                            <div className="space-y-1.5 max-w-sm">
                              <div className="flex text-sm">
                                <span className="w-24 text-left">Tanggal</span>
                                <span className="mx-2">:</span>
                                <span className="flex-1 border-b border-dotted border-slate-400 font-medium">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                              <div className="flex text-sm">
                                <span className="w-24 text-left">Nama</span>
                                <span className="mx-2">:</span>
                                <span className="flex-1 border-b border-dotted border-slate-400 font-bold uppercase">{selectedEmployeeForSlip.name}</span>
                              </div>
                              <div className="flex text-sm">
                                <span className="w-24 text-left">Jabatan</span>
                                <span className="mx-2">:</span>
                                <span className="flex-1 border-b border-dotted border-slate-400 font-medium uppercase">{selectedEmployeeForSlip.role}</span>
                              </div>
                            </div>

                            {/* Financial Table Section (ALIGNED) */}
                            <div className="pt-8 space-y-3">
                              <div className="flex items-center text-base">
                                  <span className="w-64 font-semibold uppercase text-xs tracking-wider">Gaji Pokok Dasar</span>
                                  <span className="w-8">:</span>
                                  <span className="w-8">Rp</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 text-right pb-0.5">{(slipData[selectedEmployeeForSlip.id]?.baseSalary || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex items-center text-base">
                                  <span className="w-64 font-semibold uppercase text-xs tracking-wider">Tunjangan Jabatan</span>
                                  <span className="w-8">:</span>
                                  <span className="w-8">Rp</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 text-right pb-0.5">{(slipData[selectedEmployeeForSlip.id]?.allowance || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex items-center text-base">
                                  <span className="w-64 font-semibold uppercase text-xs tracking-wider">Lembur / Bonus</span>
                                  <span className="w-8">:</span>
                                  <span className="w-8">Rp</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 text-right pb-0.5">{(slipData[selectedEmployeeForSlip.id]?.overtime || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex items-center text-base">
                                  <span className="w-64 font-semibold uppercase text-xs tracking-wider">THR Khusus</span>
                                  <span className="w-8">:</span>
                                  <span className="w-8">Rp</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 text-right pb-0.5">{(slipData[selectedEmployeeForSlip.id]?.thr || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex items-center text-base text-rose-600">
                                  <span className="w-64 font-bold uppercase text-xs tracking-wider">Potongan Absen / Alpha (-)</span>
                                  <span className="w-8">:</span>
                                  <span className="w-8 font-bold">Rp</span>
                                  <span className="flex-1 border-b-2 border-slate-900 text-right pb-0.5 font-black">{(slipData[selectedEmployeeForSlip.id]?.alphaDeduction || 0).toLocaleString('id-ID')}</span>
                                  <span className="ml-2 font-black text-slate-900 text-xl">+</span>
                              </div>

                            <div className="flex items-center pt-8 border-t-2 border-slate-100">
                              <div className="flex-1 flex items-center bg-emerald-50/60 border border-emerald-100 px-6 py-4 rounded-xl shadow-sm">
                                <span className="flex-1 font-bold text-sm uppercase tracking-[0.1em] text-emerald-900">GAJI BERSIH</span>
                                <span className="w-8 text-sm font-bold text-emerald-800">:</span>
                                <span className="w-8 font-bold text-sm text-emerald-800">Rp</span>
                                <span className="w-64 text-right font-black text-2xl tracking-tight text-emerald-950">
                                  {(() => {
                                      const d = slipData[selectedEmployeeForSlip.id] || { baseSalary: 0, allowance: 0, overtime: 0, thr: 0, alphaDeduction: 0 };
                                      const total = d.baseSalary + d.allowance + d.overtime + d.thr - d.alphaDeduction;
                                      return total.toLocaleString('id-ID');
                                  })()}
                                </span>
                              </div>
                            </div>
                            </div>

                          {/* Signature & Note Section (BALANCED 2-COLUMN) */}
                          <div className="pt-16 grid grid-cols-2 gap-16 items-end pb-12">
                            <div className="flex flex-col items-center italic">
                                <div className="text-center space-y-20">
                                  <p className="text-[10px] font-bold uppercase underline">Penerima,</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest border-t border-slate-400 pt-1 px-4">{selectedEmployeeForSlip.name}</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-end">
                               <div className="relative border-2 border-dashed border-slate-900 p-3 rounded-lg bg-slate-50/50 min-h-[90px] w-full max-w-[80mm] ml-auto">
                                  <h4 className="text-[9px] font-black uppercase mb-1 tracking-widest opacity-40">Catatan HRD</h4>
                                  <p className="text-[10px] font-medium leading-tight italic">
                                     {slipData[selectedEmployeeForSlip.id]?.hrdNotes || "................................................"}
                                  </p>
                               </div>
                            </div>
                          </div>
                          </div>
                        </Card>
                      </div>
                    </div>

                    <div className="flex gap-4 px-6 max-w-xl mx-auto pb-10">
                      <Button
                        onClick={() => pdfService.handleExportSlipPDF(selectedEmployeeForSlip, slipData[selectedEmployeeForSlip.id])}
                        className="flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                        <Printer className="w-5 h-5 shrink-0" />
                        <span>PRINT SLIP</span>
                      </Button>
                      <Button
                        onClick={() => pdfService.handleExportSlipPDF(selectedEmployeeForSlip, slipData[selectedEmployeeForSlip.id])}
                        className="flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 font-black text-[10px] tracking-[0.2em] shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                      >
                        <FileDown className="w-5 h-5 shrink-0" />
                        <span>DOWNLOAD</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-24 text-center bg-white rounded-xl border border-slate-100 shadow-sm space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-inner">
                      <Receipt className="w-12 h-12 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs max-w-xs mx-auto leading-relaxed">Pilih Nama Karyawan di atas Untuk Mengakses Slip Gaji Resmi</p>
                  </div>
                )}
              </div>
            </div>
          )}

        {karyawanTab === 'jadwal' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700 pt-[280px]">
            <SchedulerHeader 
              currentDate={currentDate}
              onPreviousMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              onExportPDF={() => pdfService.handleExportShiftPDF(employees, shifts, monthDates, currentDate)}
              onExportWeeklyPDF={() => pdfService.handleExportPatternPDF(employees, weeklyPattern)}
              view={schedulerView}
              onViewChange={setSchedulerView}
              onBack={backToMenu}
              theme={theme}
            />

            {schedulerView === 'grid' ? (
              <div ref={gridRef}>
                <ScheduleGrid 
                  employees={employees}
                  shifts={shifts}
                  dates={monthDates}
                  onShiftClick={handleCycleShift}
                  onExportPDF={() => pdfService.handleExportShiftPDF(employees, shifts, monthDates, currentDate)}
                />
              </div>
            ) : (
              <div ref={patternRef}>
                <PatternManager 
                  employees={employees}
                  initialPattern={weeklyPattern}
                  onSavePattern={setWeeklyPattern}
                  onApplyPattern={handleApplyPattern}
                  onExportWeeklyPDF={() => pdfService.handleExportPatternPDF(employees, weeklyPattern)}
                  onBack={() => setSchedulerView('grid')}
                  currentDate={currentDate}
                />
              </div>
            )}
          </div>
        )}

        {karyawanTab === 'absensi' && (
          <AttendanceGrid 
            employees={employees}
            attendances={attendances}
            onToggleAttendance={toggleAttendance}
          />
        )}

        <ShiftCheatSheet 
          isOpen={isCheatSheetOpen} 
          onClose={() => setIsCheatSheetOpen(false)} 
        />
        </div>
      </div>

    </div>
  );
};

export default JobdeskManager;
