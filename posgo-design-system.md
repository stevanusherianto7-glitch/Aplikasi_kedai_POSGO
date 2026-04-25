# POSGO DESIGN SYSTEM (v1.0)
*The Definitive Visual & UI Guide for POSGO Application*

---

## 1. Master Prompt (System Instructions)
"Kamu adalah Lead Frontend Engineer untuk aplikasi **POSGO**. Saat membangun UI, kamu **WAJIB** menggunakan **React (Vite)** dan **Tailwind CSS**. Kamu harus mematuhi identitas visual 'Ice Blue Premium' dengan Glassmorphism. Selalu gunakan komponen dari folder `/components/ui` yang sudah terstandarisasi."

---

## 2. Color Palette (Ice Blue Premium)
| Role | Hex/Tailwind | Usage |
| :--- | :--- | :--- |
| **Primary** | `#2563eb` (blue-600) | Main buttons, active tabs, primary branding. |
| **Success** | `#059669` (emerald-600) | Profit indicators, save buttons, stock available. |
| **Danger** | `#e11d48` (rose-600) | Delete buttons, loss indicators, stock empty. |
| **Warning** | `#d97706` (amber-600) | Pending status, maintenance, notifications. |
| **Text Primary** | `#0f172a` (slate-900) | Main headings, product names, price values. |
| **Text Secondary**| `#64748b` (slate-500) | Roles, units, subtitles, secondary info. |
| **Background** | `#f8fafc` (slate-50) | Global body background (Light Mode). |
| **Dark BG** | `#0a0a0c` | Global body background (Dark Mode). |

---

## 3. Typography
- **Font Family:** `Inter` or `Helvetica` (Sans-serif).
- **Headings:** Bold/Black (`font-black`), Uppercase, Tracking-tight.
- **Body:** Medium (`font-medium`), Slate-500.
- **Numbers:** Tabular Lining (for prices) to ensure vertical alignment.
- **Standard Sizes:**
  - `text-[11px]` for item names (Bold).
  - `text-[8px]` or `text-[7px]` for roles/sub-info (Extra Bold/Tracking Widest).

---

## 4. UI Component Rules
### A. Buttons
- **Shape:** `rounded-2xl` (for main actions) or `rounded-xl` (for smaller actions).
- **Style:** Shadow-lg, active:scale-95, transition-all.
- **Main Action:** `bg-blue-600 text-white font-black text-[11px] tracking-[0.2em]`.

### B. Cards & Containers
- **Glassmorphism:** `bg-white/60 backdrop-blur-xl border-slate-200/50 shadow-sm`.
- **Corners:** Large rounded corners (`rounded-[2.5rem]` or `rounded-[3rem]`).
- **Inner Padding:** Standard `p-6` or `p-8` for desktop, `p-4` for mobile.

### C. Form Inputs
- **Style:** `rounded-xl`, `border-slate-100`, `bg-slate-50/50`.
- **Focus:** `focus:ring-4 focus:ring-blue-500/5 transition-all duration-200`.
- **Height:** Standard `h-12` or `h-14` for touch-friendly mobile use.

---

## 5. Layouting & Spacing
- **Grid Gap:** Always use `gap-4` or `gap-6`.
- **Sticky Elements:** Navbar and Headers must use `backdrop-blur-md` for depth.
- **Mobile Grid:** Employee columns locked at `160px` for consistent scrolling.
- **Navbar:** Bottom fixed, `z-[100]`, auto-hides during "Focus Mode" (e.g., detail HPP).

---

## 6. PDF Export Standards
- **Format:** A4 Landscape (standard for reports).
- **Header:** Clean White Background (No black blocks).
- **Table Theme:** `grid`, `headStyles: { fillColor: [226, 232, 240] }`.
- **Alignment:** Shift codes (P, M, O) MUST be `halign: 'center', valign: 'middle'`.

---

## 7. Component Library Reference
- **PriceInput:** Custom component for IDR formatting.
- **Badge:** Used for categories (Makanan, Minuman, Pelengkap).
- **Dialog:** shadcn/ui base with customized `rounded-[2.5rem]` and premium gradients.
