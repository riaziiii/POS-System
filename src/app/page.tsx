'use client'

import { useState } from 'react'
import { ShoppingCart, CreditCard, Receipt, Plus, Minus, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  price: number
  category: string
  image_url?: string
  description?: string
}

interface OrderItem {
  product: Product
  quantity: number
  total_price: number
}

export default function POSPage() {
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card')

  // Sample products with images - you'll replace this with data from Supabase
  const products: Product[] = [
    { 
      id: '1', 
      name: 'Classic Burger', 
      price: 12.99, 
      category: 'main',
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      description: 'Juicy beef patty with fresh vegetables'
    },
    { 
      id: '2', 
      name: 'Crispy Fries', 
      price: 4.99, 
      category: 'sides',
      image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
      description: 'Golden crispy french fries'
    },
    { 
      id: '3', 
      name: 'Coca Cola', 
      price: 2.99, 
      category: 'drinks',
      image_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop',
      description: 'Refreshing cold beverage'
    },
    { 
      id: '4', 
      name: 'Margherita Pizza', 
      price: 15.99, 
      category: 'main',
      image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',
      description: 'Fresh mozzarella and basil'
    },
    { 
      id: '5', 
      name: 'Caesar Salad', 
      price: 8.99, 
      category: 'sides',
      image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
      description: 'Fresh romaine with caesar dressing'
    },
    { 
      id: '6', 
      name: 'Espresso Coffee', 
      price: 3.99, 
      category: 'drinks',
      image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
      description: 'Rich and aromatic coffee'
    },
    { 
      id: '7', 
      name: 'Chicken Wings', 
      price: 11.99, 
      category: 'main',
      image_url: 'https://images.unsplash.com/photo-1567620832903-9e6d124101b4?w=400&h=300&fit=crop',
      description: 'Spicy buffalo wings'
    },
    { 
      id: '8', 
      name: 'Onion Rings', 
      price: 5.99, 
      category: 'sides',
      image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=300&fit=crop',
      description: 'Crispy battered onion rings'
    },
    { 
      id: '9', 
      name: 'Iced Tea', 
      price: 2.49, 
      category: 'drinks',
      image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
      description: 'Refreshing iced tea'
    }
  ]

  const categories = ['all', 'main', 'sides', 'drinks']

  const addToOrder = (product: Product) => {
    setCurrentOrder(prev => {
      const existingItem = prev.find(item => item.product.id === product.id)
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.product.price }
            : item
        )
      }
      return [...prev, { product, quantity: 1, total_price: product.price }]
    })
  }

  const removeFromOrder = (productId: string) => {
    setCurrentOrder(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(productId)
      return
    }
    setCurrentOrder(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, total_price: newQuantity * item.product.price }
          : item
      )
    )
  }

  const getTotalAmount = () => {
    return currentOrder.reduce((total, item) => total + item.total_price, 0)
  }

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory)

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Left Side - Products */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Restaurant POS</h1>
        
        {/* Categories */}
        <div className="flex gap-2 mb-6">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToOrder(product)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Product Image */}
              <div className="relative h-32 overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="text-gray-400" size={32} />
                  </div>
                )}
                {/* Add to cart indicator */}
                <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="text-white" size={16} />
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-4 text-left">
                <div className="font-semibold text-gray-800 mb-1">{product.name}</div>
                {product.description && (
                  <div className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</div>
                )}
                <div className="text-green-600 font-medium">${product.price.toFixed(2)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Side - Order Summary */}
      <div className="w-96 bg-white shadow-lg p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
          <ShoppingCart className="text-gray-600" />
        </div>

        {/* Order Items */}
        <div className="flex-1 space-y-3 mb-6 overflow-y-auto">
          {currentOrder.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="mx-auto mb-2" size={32} />
              <p>No items in order</p>
            </div>
          ) : (
            currentOrder.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {/* Product Image in Order */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="text-gray-400" size={16} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{item.product.name}</div>
                  <div className="text-sm text-gray-600">${item.product.price.toFixed(2)} each</div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateQuantity(item.product.id, item.quantity - 1)
                    }}
                    className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateQuantity(item.product.id, item.quantity + 1)
                    }}
                    className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromOrder(item.product.id)
                    }}
                    className="w-7 h-7 rounded-full bg-gray-500 text-white flex items-center justify-center hover:bg-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total */}
        <div className="border-t pt-4 mb-6">
          <div className="flex justify-between text-xl font-bold">
            <span>Total:</span>
            <span>${getTotalAmount().toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">Payment Method</h3>
          <div className="flex gap-2">
            {(['cash', 'card'] as const).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium capitalize transition-colors ${
                  paymentMethod === method
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              // TODO: Implement payment processing
              alert('Payment processed!')
              setCurrentOrder([])
            }}
            disabled={currentOrder.length === 0}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            <CreditCard size={20} />
            Process Payment
          </button>
          
          <button
            onClick={() => {
              // TODO: Implement receipt generation
              alert('Receipt sent!')
            }}
            disabled={currentOrder.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            <Receipt size={20} />
            Send Receipt
          </button>
        </div>
      </div>
    </div>
  )
}