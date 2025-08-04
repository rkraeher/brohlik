// types.d.ts

type MessageAction =
  | 'UPDATE_USER'
  | 'INJECT_BROHLIK_BUTTON'
  | 'INJECT_ALL_BROHLIK_BUTTONS';

interface CartItem {
  user?: string;
  price?: number;
  quantity?: number;
  productName?: string;
  productId?: number;
}

interface CartData {
  items: Object<number, CartItem>;
  notAvailableItems: Array<CartItem>;
}

type ShoppingCart = Record<number, CartItem>;
type Totals = Record<string, number>;
