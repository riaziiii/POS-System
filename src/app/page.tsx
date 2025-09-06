'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  CreditCard, 
  Receipt, 
  Plus, 
  Minus, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Star,
  LogOut,
  User,
  Settings,
  Shield,
  Trash2,
  ShoppingBag
} from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Order, OrderItem as OrderItemType } from '@/types'
import { usePinAuth } from '@/lib/pin-auth-context'
import PinAuthGuard from '@/app/pinauthguard'
import UserManagement from '@/app/UserManagement'

interface Product {
  id: string
  name: string
  price: number
  category: string
  image_url?: string
  description?: string
  stock?: number
  is_available?: boolean
  best_seller?: boolean
}

interface OrderItem {
  product: Product
  quantity: number
  total_price: number
}

interface ProcessingState {
  isProcessing: boolean
  isSuccess: boolean
  isError: boolean
  message: string
}

interface Analytics {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  salesByCategory: Array<{ category: string; sales: number }>
  recentOrders: Array<{
    id: string
    order_number: string
    total_amount: number
    status: string
    created_at: string
  }>
}

type ViewMode = 'pos' | 'orders' | 'analytics' | 'user-admin'

function UserMenu() {
  const { user, logout } = usePinAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'cashier': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 bg-white rounded-lg px-3 py-2 shadow-sm border"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">{user?.name}</p>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user?.role || '')}`}>
            {user?.role}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border">
          <div className="px-4 py-3 border-b">
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getRoleColor(user?.role || '')}`}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default function POSPage() {
  const { user } = usePinAuth()
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card')
  const [viewMode, setViewMode] = useState<ViewMode>('pos')
  const [orders, setOrders] = useState<Order[]>([])
  const [orderType, setOrderType]= useState<'dine-in' | 'take-out'>('dine-in')
  const [tableNumber, setTableNumber] = useState<string>('')
  const [analytics, setAnalytics] = useState<Analytics>({
  
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    salesByCategory: [],
    recentOrders: []
  })
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isSuccess: false,
    isError: false,
    message: ''
  })
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [showBestSellers, setShowBestSellers] = useState(false)

  // Sample products with images - you'll replace this with data from Supabase
  const products: Product[] = [
    { 
      id: '1', 
      name: 'Classic Burger', 
      price: 12.99, 
      category: 'main',
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      description: 'Juicy beef patty with fresh vegetables',
      stock: 50,
      is_available: true,
      best_seller: true
    },
    { 
      id: '2', 
      name: 'Crispy Fries', 
      price: 4.99, 
      category: 'sides',
      image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
      description: 'Golden crispy french fries',
      stock: 100,
      is_available: true,
      best_seller: false
    },
    { 
      id: '3', 
      name: 'Coca Cola', 
      price: 2.99, 
      category: 'drinks',
      image_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop',
      description: 'Refreshing cold beverage',
      stock: 200,
      is_available: true,
      best_seller: false
    },
    { 
      id: '4', 
      name: 'Margherita Pizza', 
      price: 15.99, 
      category: 'main',
      image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',
      description: 'Fresh mozzarella and basil',
      stock: 30,
      is_available: true,
      best_seller: true
    },
    { 
      id: '5', 
      name: 'Caesar Salad', 
      price: 8.99, 
      category: 'sides',
      image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
      description: 'Fresh romaine with caesar dressing',
      stock: 25,
      is_available: true,
      best_seller: false
    },
    { 
      id: '6', 
      name: 'Espresso Coffee', 
      price: 3.99, 
      category: 'drinks',
      image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
      description: 'Rich and aromatic coffee',
      stock: 150,
      is_available: true,
      best_seller: false
    },
    { 
      id: '7', 
      name: 'Chicken Wings', 
      price: 11.99, 
      category: 'main',
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
      description: 'Spicy buffalo wings',
      stock: 40,
      is_available: true,
      best_seller: true
    },
    { 
      id: '8', 
      name: 'Onion Rings', 
      price: 5.99, 
      category: 'sides',
      image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
      description: 'Crispy battered onion rings',
      stock: 60,
      is_available: true,
      best_seller: false
    },
    { 
      id: '9', 
      name: 'Iced Tea', 
      price: 2.49, 
      category: 'drinks',
      image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
      description: 'Refreshing iced tea',
      stock: 120,
      is_available: true,
      best_seller: false
    }
  ]

  const categories = ['all','main', 'sides', 'drinks']

    // Add these missing helper functions
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

    const finalProducts = showBestSellers
      ? filteredProducts.filter(p => p.best_seller)
      : filteredProducts
  
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      loadOrders()
      loadAnalytics()
    }, [dateRange])
  
  // ... rest of your existing code ...

  const loadOrders = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('Error loading orders:', error)
        } else {
          setOrders(data || [])
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      if (supabase) {
        // Get date range
        const now = new Date()
        const startDate = new Date()
        
        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
        }

        const { data: ordersData, error } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString())

        if (error) {
          console.error('Error loading analytics:', error)
          return
        }

        const orders = ordersData || []

        
        // Calculate analytics
        const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0)
        const totalOrders = orders.length
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

        // Calculate top products
        const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
        orders.forEach(order => {
          order.order_items?.forEach((item: OrderItemType) => {
            if (productSales[item.product_id]) {
              productSales[item.product_id].quantity += item.quantity
              productSales[item.product_id].revenue += item.total_price
            } else {
              productSales[item.product_id] = {
                name: item.product?.name || 'Unknown Product',
                quantity: item.quantity,
                revenue: item.total_price
              }
            }
          })
        })

        const topProducts = Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)

        // Calculate sales by category
        const categorySales: { [key: string]: number } = {}
        orders.forEach(order => {
          order.order_items?.forEach((item: OrderItemType) => {
            const category = item.product?.category || 'unknown'
            categorySales[category] = (categorySales[category] || 0) + item.total_price
          })
        })

        const salesByCategory = Object.entries(categorySales).map(([category, sales]) => ({
          category,
          sales
        }))

        // Get recent orders
        const recentOrders = orders.slice(0, 10).map(order => ({
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at
        }))

        setAnalytics({
          totalSales,
          totalOrders,
          averageOrderValue,
          topProducts,
          salesByCategory,
          recentOrders
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'completed' | 'cancelled') => {
    try {
        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId)

        if (error) {
          console.error('Error updating order status:', error)
        return
      }
      await loadOrders()
      await loadAnalytics()
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  // ... existing helper functions (addToOrder, removeFromOrder, updateQuantity, getTotalAmount, etc.) ...

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `ORD-${timestamp.slice(-6)}-${random}`
  }

  const processPayment = async () => {
    if (currentOrder.length === 0) return

    setProcessingState({
      isProcessing: true,
      isSuccess: false,
      isError: false,
      message: 'Processing payment...'
    })

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const orderData = {
        order_number: generateOrderNumber(),
        status: 'completed' as const,
        total_amount: getTotalAmount(),
        payment_method: paymentMethod,
        order_type: orderType,
        table_number: orderType === 'dine-in' ? (tableNumber || null) : null,
        order_items: currentOrder.map(item => ({
          product_id: item.product.id,
          product: item.product,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.total_price
        })),
        created_at: new Date().toISOString()
      }

      if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        try {
          const { error: probeErr } = await supabase.from('orders').select('id').limit(1)
          if (probeErr) {
            console.error('Probe error:', probeErr)
            alert(`DB probe failed: ${probeErr.message}`)
            return
          }
          const { data, error, status } = await supabase
            .from('orders')
            .insert([orderData])
            .select() // force return to validate schema

          if (error) {
            console.error('Supabase error raw:', error)
            console.dir(error) // shows non-enumerable fields
            console.error('status:', status)
            alert(`Insert failed: ${error.message || 'Unknown error'}`)
            return
          }
          console.log('Order saved:', data)
        } catch (e: unknown) {
          console.error('Supabase exception:', e)
          const msg = e instanceof Error ? e.message : String(e)
          alert(`Insert threw exception: ${msg}`)
          return
        }
      } else {
        console.log('Supabase not configured - running in demo mode')
        const existingOrders =JSON.parse(localStorage.getItem('pos_orders') || '[]')
         existingOrders.push(orderData)
      }           
      setProcessingState({
        isProcessing: false,
        isSuccess: true,
        isError: false,
        message: `Payment successful! Order #${orderData.order_number}`
      })

      setTimeout(() => {
        setCurrentOrder([])
        setProcessingState({
          isProcessing: false,
          isSuccess: false,
          isError: false,
          message: ''
        })
        loadOrders()
        loadAnalytics()
      }, 3000)

    } catch (error) {
      console.error('Payment processing error:', error)
      setProcessingState({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: 'Payment failed. Please try again.'
      })

      setTimeout(() => {
        setProcessingState({
          isProcessing: false,
          isSuccess: false,
          isError: false,
          message: ''
        })
      }, 3000)
    }
  }

  const sendReceipt = async () => {
    if (currentOrder.length === 0) return
    
    setProcessingState({
      isProcessing: true,
      isSuccess: false,
      isError: false,
      message: 'Generating receipt...'
    })
    
    try {
      const orderNumber = generateOrderNumber()
      const html = generateReceiptHtml(orderNumber)
    
      // Open printable receipt
      const printWin = window.open('', '_blank')
      if (printWin) {
        printWin.document.open()
        printWin.document.write(html)
        printWin.document.close()
      }
    
      // Also download a copy as .txt for records
      const txt = [
        `Restaurant Receipt`,
        `Order #: ${orderNumber}`,
        `Date: ${new Date().toLocaleString()}`,
        `Payment: ${paymentMethod.toUpperCase()}`,
        `Order Type: ${orderType.replace('-', ' ')}`,
        `${orderType === 'dine-in' ? `Table: ${tableNumber || 'N/A'}` : ''}`,
        ``,
        ...currentOrder.map(i => `${i.product.name} x${i.quantity} - $${i.total_price.toFixed(2)}`),
        ``,
        `TOTAL: $${getTotalAmount().toFixed(2)}`
      ].filter(Boolean).join('\n')
    
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${orderNumber}.txt`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    
      setProcessingState({
        isProcessing: false,
        isSuccess: true,
        isError: false,
        message: 'Receipt opened for print and downloaded.'
      })
    
      // Optional: keep order; or clear after a moment
      setTimeout(() => {
        setProcessingState({ isProcessing: false, isSuccess: false, isError: false, message: '' })
      }, 2500)
    } catch (e) {
      console.error('Receipt generation error:', e)
      setProcessingState({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: 'Failed to generate receipt.'
      })
      setTimeout(() => {
        setProcessingState({ isProcessing: false, isSuccess: false, isError: false, message: '' })
      }, 2500)
    }
  }

  const generateReceiptHtml = (orderNumber: string) => {
    const timestamp = new Date().toLocaleString()
    const itemsHtml = currentOrder.map(item => `
      <tr>
        <td style="padding:4px 0;">${item.product.name} x${item.quantity}</td>
        <td style="text-align:right;">$${item.total_price.toFixed(2)}</td>
      </tr>
    `).join('')
  
    return `
      <html>
        <head>
          <title>Receipt ${orderNumber}</title>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>
            body{font-family:Arial, sans-serif; padding:16px; color:#111}
            h1{font-size:18px;margin-bottom:8px}
            .muted{color:#555;font-size:12px}
            table{width:100%; border-collapse:collapse; margin-top:12px}
            tfoot td{font-weight:bold; border-top:1px solid #ddd; padding-top:8px}
          </style>
        </head>
        <body>
          <h1>Restaurant Receipt</h1>
          <div class="muted">Order #: ${orderNumber}</div>
          <div class="muted">Date: ${timestamp}</div>
          <div class="muted">Payment: ${paymentMethod.toUpperCase()}</div>
          <div class="muted">Order Type: ${orderType.replace('-', ' ')}</div>
          ${orderType === 'dine-in' ? `<div class="muted">Table: ${tableNumber || 'N/A'}</div>` : ''}
          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td style="text-align:right;">$${getTotalAmount().toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <p class="muted">Thank you!</p>
          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `
  }

  const filteredOrders = orders.filter(order => 
    orderFilter === 'all' || order.status === orderFilter
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <PinAuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="h-screen flex flex-col">
          {/* Navigation Header */}
          <div className="bg-white shadow-sm border-b z-10 flex-shrink-0">
            <div className="flex items-center justify-between px-6 py-4">
              <h1 className="text-2xl font-bold text-gray-800">Restaurant POS</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('pos')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'pos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  POS
                </button>
                <button
                  onClick={() => setViewMode('orders')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'orders'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'analytics'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Analytics
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setViewMode('user-admin')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'user-admin'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    User Admin
                  </button>
                )}
              </div>
              <UserMenu />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden p-4 sm:p-6">
            {viewMode === 'pos' && (
              <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Container - Products (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border flex flex-col h-full">
                  {/* Categories Header */}
                  <div className="p-4 sm:p-6 border-b flex-shrink-0">
                    <div className="flex gap-2 flex-wrap">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                            selectedCategory === category
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowBestSellers(v => !v)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto ${
                          showBestSellers ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title="Show Best Sellers only"
                      >
                        <span className="hidden sm:inline">Best Sellers</span>
                        <span className="sm:hidden">⭐</span>
                      </button>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {finalProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => addToOrder(product)}
                          disabled={!product.is_available}
                          className="bg-gray-50 rounded-lg border hover:border-blue-300 transition-all duration-200 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {/* Product Image */}
                          <div className="relative h-28 sm:h-32 overflow-hidden">
                            {product.best_seller && (
                              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white rounded-full px-2 py-0.5">
                                <Star size={12} className="text-white" />
                                <span className="text-[10px] font-semibold leading-none">Best</span>
                              </div>
                            )}
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <ImageIcon className="text-gray-400" size={24} />
                              </div>
                            )}
                            {product.is_available && (
                              <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="text-white" size={16} />
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-3 text-left">
                            <div className="font-semibold text-gray-800 mb-1 text-sm">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</div>
                            )}
                            <div className="flex justify-between items-center">
                              <div className="text-green-600 font-medium text-sm">${product.price.toFixed(2)}</div>
                              {product.stock !== undefined && (
                                <div className="text-xs text-gray-500">Stock: {product.stock}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Container - Order Summary (1/3 width) */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border flex flex-col h-full">
                  <div className="p-4 sm:p-6 border-b flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800">Current Order</h2>
                  </div>
                  
                  {/* Order Type and Table Selection - Fixed */}
                  <div className="p-4 sm:p-6 border-b flex-shrink-0 space-y-4">
                    {/* Order Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setOrderType('dine-in')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            orderType === 'dine-in'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Dine-in
                        </button>
                        <button
                          onClick={() => setOrderType('take-out')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            orderType === 'take-out'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Take-out
                        </button>
                      </div>
                    </div>

                    {/* Table Number (for dine-in) */}
                    {orderType === 'dine-in' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                        <input
                          type="text"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="Enter table number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Order Items - Scrollable Section */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-4 sm:p-6">
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Order Items</h3>
                      </div>
                      {currentOrder.length === 0 ? (
                        <div className="text-center text-gray-500 py-6">
                          <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No items in order</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {currentOrder.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-800 truncate text-sm">{item.product.name}</div>
                                <div className="text-xs text-gray-600">${item.product.price.toFixed(2)} each</div>
                              </div>
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-5 text-center font-medium text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => removeFromOrder(item.product.id)}
                                  className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center ml-1"
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fixed Bottom Section - Always Visible */}
                  <div className="border-t bg-gray-50 flex-shrink-0">
                    <div className="p-4 space-y-3">
                      {/* Total */}
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold text-gray-800">Total:</span>
                          <span className="text-lg font-bold text-green-600">${getTotalAmount().toFixed(2)}</span>
                        </div>
                        {currentOrder.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {currentOrder.reduce((sum, item) => sum + item.quantity, 0)} items
                          </div>
                        )}
                      </div>

                      {/* Payment Methods */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Payment Method</label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { name: 'Cash', icon: '💵' },
                            { name: 'Card', icon: '💳' },
                           
                          ].map(method => (
                            <button
                              key={method.name}
                              onClick={() => setPaymentMethod(method.name.toLowerCase() as 'cash' | 'card')}
                              className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                                paymentMethod === method.name.toLowerCase()
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <span className="text-sm">{method.icon}</span>
                              <span className="text-xs">{method.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={processPayment}
                          disabled={currentOrder.length === 0 || processingState.isProcessing}
                          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm shadow-md hover:shadow-lg"
                        >
                          {processingState.isProcessing ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <CreditCard size={14} />
                          )}
                          {processingState.isProcessing ? 'Processing...' : 'Process Payment'}
                        </button>
                        
                        <button
                          onClick={sendReceipt}
                          disabled={currentOrder.length === 0 || processingState.isProcessing}
                          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm shadow-md hover:shadow-lg"
                        >
                          {processingState.isProcessing ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Receipt size={14} />
                          )}
                          {processingState.isProcessing ? 'Generating...' : 'Send Receipt'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'orders' && (
              <div className="h-full overflow-y-auto text-gray-800">
                <div className="max-w-6xl mx-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Orders Management</h2>
                    <div className="flex gap-2">
                      <select
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value as 'all' | 'pending' | 'completed' | 'cancelled')}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                      >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders
                          .filter(order => orderFilter === 'all' || order.status === orderFilter)
                          .map((order) => (
                            <tr key={order.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.customer_email || order.customer_phone || 'Walk-in'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.order_items.length} items
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.total_amount.toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  order.status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(order.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => updateOrderStatus(order.id, order.status === 'pending' ? 'completed' : 'pending')}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  {order.status === 'pending' ? 'Complete' : 'Reopen'}
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'analytics' && (
              <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Side - Analytics Dashboard */}
                <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border flex flex-col h-full">
                  <div className="p-4 sm:p-6 border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800">Analytics Dashboard</h2>
                      <div className="flex gap-2">
                        <select
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value as 'today' | 'week' | 'month')}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
                        >
                          <option value="today">Today</option>
                          <option value="week">Last 7 Days</option>
                          <option value="month">Last 30 Days</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="text-green-600" size={20} />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(analytics.totalSales)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <ShoppingBag className="text-blue-600" size={20} />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-lg font-bold text-gray-900">{analytics.totalOrders}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="text-purple-600" size={20} />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Average Order</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(analytics.averageOrderValue)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Users className="text-orange-600" size={20} />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Customers</p>
                            <p className="text-lg font-bold text-gray-900">{analytics.totalOrders}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Charts and Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Top Products */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
                        <div className="space-y-3">
                          {analytics.topProducts.map((product, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-900">{product.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">{product.quantity} sold</div>
                                <div className="text-xs text-gray-500">{formatCurrency(product.revenue)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sales by Category */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales by Category</h3>
                        <div className="space-y-3">
                          {analytics.salesByCategory.map((category, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                <span className="text-sm font-medium text-gray-900 capitalize">{category.category}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">{formatCurrency(category.sales)}</div>
                                <div className="text-xs text-gray-500">Revenue</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders Table */}
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Order #</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Customer</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Amount</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map((order) => (
                              <tr key={order.id} className="border-b border-gray-100">
                                <td className="py-2 text-sm text-gray-900">{order.order_number}</td>
                                <td className="py-2 text-sm text-gray-600">
                                  {order.customer_email || order.customer_phone || 'Walk-in'}
                                </td>
                                <td className="py-2 text-sm text-gray-900">{formatCurrency(order.total_amount)}</td>
                                <td className="py-2">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    order.status === 'completed' 
                                      ? 'bg-green-100 text-green-800'
                                      : order.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-2 text-sm text-gray-600">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - User Admin */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border flex flex-col h-full">
                  <div className="p-4 sm:p-6 border-b flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-800">User Management</h3>
                    <p className="text-sm text-gray-600 mt-1">Admin Controls</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {user?.role === 'admin' ? (
                      <UserManagement />
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Admin access required</p>
                        <p className="text-xs text-gray-400 mt-1">Only administrators can manage users</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'user-admin' && (
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">User Administration</h2>
                    <p className="text-gray-600 mt-1">Manage system users and permissions</p>
                  </div>
                  
                  {user?.role === 'admin' ? (
                    <UserManagement />
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Denied</h3>
                      <p className="text-gray-600">Only administrators can access user management.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PinAuthGuard>
  )
}