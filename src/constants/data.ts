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
          title: 'Inventory & Customer Management',
          url: '/dashboard/inventory-customers',
          icon: 'package',
          shortcut: ['i', 'c'],
          isActive: true,
          items: [
            { title: 'Inventory', url: '/dashboard/inventory-customers?section=inventory', icon: 'package', isActive: false, items: [] },
            { title: 'Customers', url: '/dashboard/inventory-customers?section=customers', icon: 'users', isActive: false, items: [] }
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
        },
        {
          title: 'Inventory & Customer Management',
          url: '/dashboard/inventory-customers',
          icon: 'package',
          shortcut: ['i', 'c'],
          isActive: true,
          items: [
            { title: 'Inventory', url: '/dashboard/inventory-customers?section=inventory', icon: 'package', isActive: false, items: [] },
            { title: 'Customers', url: '/dashboard/inventory-customers?section=customers', icon: 'users', isActive: false, items: [] }
          ]
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
          title: 'Inventory & Customer Management',
          url: '/dashboard/inventory-customers',
          icon: 'package',
          shortcut: ['i', 'c'],
          isActive: true,
          items: [
            { title: 'Inventory', url: '/dashboard/inventory-customers?section=inventory', icon: 'package', isActive: false, items: [] },
            { title: 'Customers', url: '/dashboard/inventory-customers?section=customers', icon: 'users', isActive: false, items: [] }
          ]
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