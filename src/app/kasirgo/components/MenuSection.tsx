import { MenuItem } from '../types';
import { formatPrice } from '../utils/format';

type MenuSectionProps = {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  filteredMenu: MenuItem[];
  addToCart: (item: MenuItem) => void;
  editMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: number) => void;
};

export function MenuSection({
  categories,
  activeCategory,
  setActiveCategory,
  filteredMenu,
  addToCart,
  editMenuItem,
  deleteMenuItem
}: MenuSectionProps) {
  return (
    <div className="print:hidden">
      <h2 className="text-xl font-semibold mb-4">Menu</h2>
      <div className="flex gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {filteredMenu.map((item) => (
          <div key={item.id} className="p-4 border rounded hover:bg-slate-50 flex justify-between items-center">
            <button onClick={() => addToCart(item)} className="flex-grow text-left">
              <span>{item.name}</span>
              <span className="font-semibold ml-2">{formatPrice(item.price)}</span>
            </button>
            <div className="flex gap-2 print:hidden">
              <button onClick={() => editMenuItem(item)} className="text-blue-500 text-sm">Edit</button>
              <button onClick={() => deleteMenuItem(item.id)} className="text-rose-500 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
