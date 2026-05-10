import React from 'react'
import { X } from 'lucide-react'
import { MenuItem } from '../types'

interface MenuModalProps {
  isOpen: boolean
  onClose: () => void
  menuItem: MenuItem | null
}

const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, menuItem }) => {
  if (!isOpen || !menuItem) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{menuItem.nama_menu}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {menuItem.image_url && (
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={menuItem.image_url}
                  alt={menuItem.nama_menu}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Kategori:</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {menuItem.kategori}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Harga:</span>
              <span className="text-xl font-bold text-green-600">
                Rp {menuItem.harga.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Order Type:</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {menuItem.order_type}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Metode Pembayaran:</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {menuItem.metode_pembayaran}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status Pembayaran:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                menuItem.status_pembayaran === 'lunas'
                  ? 'bg-green-100 text-green-800'
                  : menuItem.status_pembayaran === 'promo'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {menuItem.status_pembayaran}
              </span>
            </div>

            {menuItem.chef_notes && (
              <div>
                <span className="text-gray-600 block mb-2">Chef Notes:</span>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {menuItem.chef_notes}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuModal