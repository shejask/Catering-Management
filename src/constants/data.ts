import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

// Role-based navigation items
export const getNavItems = (role?: string): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      title: 'Dashboard',
      url: '/dashboard/overview',
      icon: 'dashboard',
      isActive: false,
      shortcut: ['d', 'd'],
      items: []
    }
  ];

  switch (role) {
    case 'receptionist':
      return [
        {
          title: 'Receptionist Dashboard',
          url: '/dashboard/receptionist/overview',
          icon: 'dashboard',
          isActive: false,
          shortcut: ['r', 'd'],
          items: []
        },
        {
          title: 'Create Order',
          url: '/dashboard/receptionist/create-order',
          icon: 'add',
          shortcut: ['c', 'o'],
          isActive: false,
          items: []
        }
      ];

    case 'cook':
    case 'kitchen':
      return [
        {
          title: 'Kitchen',
          url: '/dashboard/cook',
          icon: 'chef',
          isActive: false,
          shortcut: ['k', 'i'],
          items: []
        }
      ];

    case 'manager':
      return [
        {
          title: 'Dashboard',
          url: '/dashboard/overview',
          icon: 'dashboard',
          isActive: false,
          shortcut: ['d', 'd'],
          items: []
        },
        {
          title: 'All Orders',
          url: '/dashboard/all-orders',
          icon: 'clipboardList',
          shortcut: ['a', 'o'],
          isActive: false,
          items: []
        },
        {
          title: 'Inventory',
          url: '#',
          icon: 'package',
          isActive: false,
          items: [
            {
              title: 'All Products',
              url: '/dashboard/inventory',
              icon: 'package',
            },
            {
              title: 'Customers',
              url: '/dashboard/inventory/customers',
              icon: 'users',
            },
            {
              title: 'Stock In',
              url: '/dashboard/inventory/stock-in',
              icon: 'barcode',
              shortcut: ['s', 'i'],
            },
            {
              title: 'Add Product',
              url: '/dashboard/inventory/add-product',
              icon: 'add',
            }
          ]
        },
        {
          title: 'Accounts & Finance',
          url: '#',
          icon: 'calculator',
          isActive: true,
          items: [
            {
              title: 'Dashboard',
              url: '/dashboard/accounts',
              icon: 'dashboard',
            },
            {
              title: 'Daily Expenses',
              url: '/dashboard/accounts/expenses',
              icon: 'receipt',
            },
            {
              title: 'Income Management',
              url: '/dashboard/accounts/income',
              icon: 'dollar',
            },
            {
              title: 'Credit Customers',
              url: '/dashboard/accounts/credit-customers',
              icon: 'users',
            },
            {
              title: 'Reports (P&L)',
              url: '/dashboard/accounts/reports',
              icon: 'post',
            },
          ]
        },
        {
          title: 'Stock Management',
          url: '#',
          icon: 'clipboardList',
          isActive: true,
          items: [
            {
              title: 'Dashboard',
              url: '/dashboard/stock-management',
              icon: 'dashboard',
            },
            {
              title: 'Item Master',
              url: '/dashboard/stock-management/items',
              icon: 'package',
            },
            {
              title: 'Stock IN (Receive)',
              url: '/dashboard/stock-management/stock-in',
              icon: 'add',
            },
            {
              title: 'Stock OUT (Consume)',
              url: '/dashboard/stock-management/stock-out',
              icon: 'minus',
            },
            {
              title: 'Adjustments',
              url: '/dashboard/stock-management/adjustments',
              icon: 'refresh',
            },
            {
              title: 'Reports',
              url: '/dashboard/stock-management/reports',
              icon: 'post',
            }
          ]
        }
      ];

    case 'financial':
      return [
        {
          title: 'All Orders',
          url: '/dashboard/financial/orders',
          icon: 'clipboardList',
          isActive: false,
          shortcut: ['a', 'o'],
          items: []
        }
      ];

    default:
      return [
        ...baseItems,
        {
          title: 'Create Order',
          url: '/dashboard/create-order',
          icon: 'add',
          shortcut: ['c', 'o'],
          isActive: false,
          items: []
        },
        {
          title: 'All Orders',
          url: '/dashboard/orders',
          icon: 'clipboardList',
          shortcut: ['a', 'o'],
          isActive: false,
          items: []
        },
        {
          title: 'Customers',
          url: '/dashboard/customers',
          icon: 'users',
          shortcut: ['c', 'u'],
          isActive: false,
          items: []
        },
        {
          title: 'Settings',
          url: '/dashboard/settings',
          icon: 'settings',
          shortcut: ['s', 'e'],
          isActive: false,
          items: []
        }
      ];
  }
};

export const navItems: NavItem[] = getNavItems(); // Legacy export

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export interface SaleProduct {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export interface SaleProduct {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export interface SaleProduct {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export interface SaleProduct {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}
