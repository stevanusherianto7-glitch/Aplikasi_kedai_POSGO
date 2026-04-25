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
import { formatCurrency, cn } from "@/lib/utils";
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
    // We delay the call slightly to ensure state is updated if needed,
    // but handleSaveEmployee in App.tsx takes arguments, so we can just call it with them.
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
            <DialogTrigger render={<div className={cn(
              "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] p-5 border h-24 flex flex-col justify-center items-start text-left shadow-xl active:scale-95",
              theme === 'dark'
                ? "bg-blue-600/20 backdrop-blur-xl border-blue-400/30 hover:bg-blue-600/30 hover:border-blue-400/50 shadow-blue-500/10"
                : "bg-blue-500 border-blue-600 hover:bg-blue-400"
            )} />}>
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
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-4rem)] sm:max-w-md mx-auto rounded-[2rem] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white animate-in zoom-in-95 duration-200">
              {/* Premium Header with Gradient */}
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

              {/* Content Body */}
              <div className="p-8 space-y-6 bg-white">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <div className="w-1 h-1 bg-primary rounded-full" />
                    Nama Lengkap
                  </label>
                  <Input 
                    placeholder="BUDI SANTOSO"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value.toUpperCase()})}
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
                      placeholder="COOK / SERVER"
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value.toUpperCase()})}
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

              {/* Footer */}
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
        {/* Content Area (Full Width) */}
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
                    {/* Baris 1: Nama & Jabatan (Kanan) */}
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

                    {/* Baris 2: Gaji & Aksi */}
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
              {/* Utility Header for Jobdesk */}
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

              {/* Full Width Markdown Content */}
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
            <div className="space-y-10">
              <div className={cn(
                "p-8 rounded-[2.5rem] overflow-hidden relative transition-all duration-300",
                theme === 'dark'
                  ? "bg-blue-600/10 border border-blue-500/20 backdrop-blur-xl shadow-2xl shadow-black/40"
                  : "bg-white border border-slate-100 shadow-xl shadow-slate-200/50"
              )}>
                <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative z-10">
                  <div className="space-y-1 shrink-0">
                    <h3 className={cn(
                      "text-sm font-black tracking-tight uppercase",
                      theme === 'dark' ? "text-white" : "text-slate-800"
                    )}>PILIH KARYAWAN</h3>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-[0.3em]",
                      theme === 'dark' ? "text-blue-300/60" : "text-slate-400"
                    )}>NAVIGASI SLIP GAJI CEPAT</p>
                  </div>
                  
                  <div className="flex-1 w-full md:max-w-md max-h-[160px] overflow-y-auto no-scrollbar pr-2 space-y-2">
                    {employees.map((emp, idx) => {
                      const isSelected = selectedEmployeeForSlip?.id === emp.id;
                      const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                      
                      return (
                        <div 
                          key={emp.id}
                          onClick={() => setSelectedEmployeeForSlip(emp)}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-300 group border",
                            isSelected 
                              ? (theme === 'dark' ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/40 translate-x-2" : "bg-slate-900 border-slate-800 text-white translate-x-2 shadow-lg")
                              : (theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md")
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-inner shrink-0",
                            avatarColor
                          )}>
                             {getEmployeeInitials(emp.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              "text-[11px] font-black uppercase tracking-tight truncate",
                              isSelected ? (theme === 'dark' ? "text-white" : "text-white") : (theme === 'dark' ? "text-slate-200" : "text-slate-700")
                            )}>
                              {emp.name}
                            </h4>
                            <p className={cn(
                              "text-[8px] font-bold uppercase tracking-widest truncate",
                              isSelected ? (theme === 'dark' ? "text-blue-100" : "text-slate-400") : (theme === 'dark' ? "text-slate-500" : "text-slate-400")
                            )}>
                              {emp.role}
                            </p>
                          </div>
                          {isSelected && (
                             <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {theme === 'dark' && <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>}
              </div>

              <div className="space-y-8">
              {selectedEmployeeForSlip ? (
                <Card className="border-none shadow-2xl bg-white rounded-xl overflow-hidden max-w-2xl mx-auto border border-slate-50 animate-in zoom-in-95 duration-500">
                  <div className="p-14 space-y-10">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-1 bg-indigo-500 rounded-full mx-auto"></div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tighter">SLIP GAJI KARYAWAN</h2>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">PERIODE: {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-12 py-10 border-y border-slate-50">
                      <div className="space-y-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Penerima</p>
                          <p className="text-lg font-black text-slate-900 tracking-tight uppercase">{selectedEmployeeForSlip.name.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Jabatan</p>
                          <p className="text-xs font-black text-slate-500 tracking-widest uppercase">{selectedEmployeeForSlip.role.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Ringkasan Kehadiran</p>
                          <div className="flex gap-4 mt-2">
                            <div className="text-center">
                              <p className="text-xs font-black text-emerald-600">
                                {attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Hadir' && a.date.startsWith(new Date().toISOString().substring(0, 7))).length}
                              </p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase">Hadir</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-blue-500">
                                {attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Izin' && a.date.startsWith(new Date().toISOString().substring(0, 7))).length}
                              </p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase">Izin</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-rose-500">
                                {attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Alpha' && a.date.startsWith(new Date().toISOString().substring(0, 7))).length}
                              </p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase">Alpha</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6 text-right">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Nomor ID</p>
                          <p className="text-sm font-black text-slate-900">#ELV-{selectedEmployeeForSlip.id.split('-')[0].toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Status Pekerjaan</p>
                          <Badge className="bg-indigo-600 text-white border-none font-black tracking-widest px-4 py-1.5 text-[9px]">FULL TIME</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Gaji Pokok Dasar</span>
                        <span className="font-black text-slate-900">{formatCurrency(selectedEmployeeForSlip.salary)}</span>
                      </div>
                      <div className="flex justify-between items-center text-rose-600">
                        <span className="font-bold uppercase text-[10px] tracking-widest">Potongan Alpha</span>
                        {(() => {
                          const currentMonth = new Date().toISOString().substring(0, 7);
                          const alphaCount = attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Alpha' && a.date.startsWith(currentMonth)).length;
                          const deductionRate = selectedEmployeeForSlip.salary / 26;
                          const totalDeduction = alphaCount * deductionRate;
                          return (
                            <div className="text-right">
                              <p className="font-black">-{formatCurrency(totalDeduction)}</p>
                              <p className="text-[8px] font-bold">({alphaCount} Hari Tanpa Keterangan)</p>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Bonus & Tunjangan</span>
                        <span className="font-black text-slate-900">{formatCurrency(0)}</span>
                      </div>
                      <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                        <div>
                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Total Penerimaan</p>
                          <span className="text-sm font-black text-slate-400">NET TAKE HOME PAY</span>
                        </div>
                        <span className="text-3xl font-black text-indigo-600 tracking-tighter">
                          {(() => {
                            const currentMonth = new Date().toISOString().substring(0, 7);
                            const alphaCount = attendances.filter(a => a.employeeId === selectedEmployeeForSlip.id && a.status === 'Alpha' && a.date.startsWith(currentMonth)).length;
                            const deductionRate = selectedEmployeeForSlip.salary / 26;
                            const totalDeduction = alphaCount * deductionRate;
                            const netPay = Math.max(0, selectedEmployeeForSlip.salary - totalDeduction);
                            return formatCurrency(netPay);
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                      <Button 
                        onClick={() => pdfService.handleExportSlipPDF(selectedEmployeeForSlip, attendances)}
                        className="flex-1 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                        <Printer className="w-5 h-5 mr-3" />
                        PRINT SLIP
                      </Button>
                      <Button 
                        onClick={() => pdfService.handleExportSlipPDF(selectedEmployeeForSlip, attendances)}
                        className="flex-1 h-16 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 font-black text-[10px] tracking-[0.2em] shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                      >
                        <FileDown className="w-5 h-5 mr-3" />
                        DOWNLOAD
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="p-24 text-center bg-white rounded-xl border border-slate-100 shadow-sm space-y-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-inner">
                    <Receipt className="w-12 h-12 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs max-w-xs mx-auto leading-relaxed">Pilih Nama Karyawan di samping Untuk Mengakses Slip Gaji Resmi</p>
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
