export interface Product {
    id: string
    name: string
    description?: string
    price: number
    category: string
    image_url?: string
    is_available: boolean
    stock?: number
    best_seller?: boolean
  }
  
  export interface OrderItem {
    id: string
    product_id: string
    product: Product
    quantity: number
    unit_price: number
    total_price: number
    special_instructions?: string
  }
  
  export interface Order {
    id: string
    order_number: string
    status: 'pending' | 'completed' | 'cancelled'
    total_amount: number
    payment_method?: string
    customer_email?: string
    customer_phone?: string
    order_items: OrderItem[]
    created_at: string
    order_type?: string        // Add this
    table_number?: string      // Add this
  }
  
  export type PaymentMethod = 'cash' | 'card'