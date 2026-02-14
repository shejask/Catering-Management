# Almakarem Kitchen Management System

<div align="center"><strong>Kitchen Management System for Almakarem Restaurant</strong></div>
<div align="center">Built with Next.js 15 App Router and Firebase</div>
<br />

## Overview

This is a comprehensive kitchen management system built specifically for Almakarem Restaurant using the following stack:

- Framework - [Next.js 15](https://nextjs.org/15)
- Language - [TypeScript](https://www.typescriptlang.org)
- Auth - Custom Authentication
- Database - [Firebase Realtime Database](https://firebase.google.com/docs/database)
- Styling - [Tailwind CSS v4](https://tailwindcss.com)
- Components - [Shadcn-ui](https://ui.shadcn.com)
- Schema Validations - [Zod](https://zod.dev)
- State Management - [Zustand](https://zustand-demo.pmnd.rs)
- Search params state manager - [Nuqs](https://nuqs.47ng.com/)
- Tables - [Tanstack Data Tables](https://ui.shadcn.com/docs/components/data-table)
- Forms - [React Hook Form](https://ui.shadcn.com/docs/components/form)
- Command+k interface - [kbar](https://kbar.vercel.app/)
- Notifications - [Sonner](https://sonner.emilkowal.ski/)
- Linting - [ESLint](https://eslint.org)
- Pre-commit Hooks - [Husky](https://typicode.github.io/husky/)
- Formatting - [Prettier](https://prettier.io)

## Features

### Order Management
- **Create Orders** - Comprehensive order creation with customer details, payment info, and delivery options
- **All Orders View** - Table view with order management, status updates, and filtering
- **Order Editing** - Full order editing capabilities with balance and discount calculations
- **Status Tracking** - Payment status (Paid/Unpaid) and Cook status (Pending/Preparing/Ready/Delivered)
- **Real-time Updates** - Live order updates with Firebase integration

### Kitchen Operations
- **Cook Status Management** - Track order preparation stages
- **Share to Cook** - Notify kitchen staff of new orders
- **Order Details** - Complete order information for kitchen staff

### Multi-language Support
- **English/Arabic** - Full bilingual support with RTL layout for Arabic
- **Language Switcher** - Easy language switching in header
- **Localized Content** - All text, labels, and messages translated

### Payment Management
- **Payment Tracking** - Track total, advance, and balance payments
- **Discount System** - Apply discounts with automatic calculations
- **Payment Types** - Support for Cash, ATM, and Transfer payments
- **Balance Calculations** - Automatic balance calculation based on total, advance, and discount

## Pages

| Pages | Specifications |
| :---- | :------------- |
| [Authentication](./src/app/auth) | Simple authentication forms |
| [Dashboard](./src/app/dashboard/overview) | Overview dashboard with analytics and quick actions |
| [Create Order](./src/app/dashboard/create-order) | Comprehensive order creation form with all customer and payment details |
| [All Orders](./src/app/dashboard/all-orders) | Complete order management table with editing, status updates, and filtering |
| [Profile](./src/app/dashboard/profile) | User profile management |

## Project Structure

```plaintext
src/
├── app/
│   ├── dashboard/
│   │   ├── create-order/     # Order creation page
│   │   ├── all-orders/       # Order management page
│   │   └── layout.tsx        # Dashboard layout
│   └── globals.css           # Global styles with RTL support
│
├── components/
│   ├── ui/                   # Shadcn UI components
│   ├── layout/               # Layout components
│   └── language-switcher.tsx # Language switching component
│
├── contexts/
│   └── language-context.tsx  # Language management context
│
├── services/
│   └── orderService.ts       # Firebase order operations
│
├── lib/
│   └── firebase.ts           # Firebase configuration
│
└── constants/
    └── data.ts               # Navigation and app data
```

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd almakarem-kitchen
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup:**
   - Copy `env.example.txt` to `.env.local`
   - Add your Firebase configuration

4. **Firebase Configuration:**
   - Create a Firebase project
   - Enable Realtime Database
   - Copy your config to `.env.local`

5. **Run the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_firebase_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

## Usage

### Creating Orders
1. Navigate to "Create Order" from the sidebar
2. Fill in customer information (name, phone, location)
3. Add order details and delivery preferences
4. Set payment information (total, advance, payment type)
5. Submit to save to Firebase

### Managing Orders
1. Go to "All Orders" to view all orders
2. Click status badges to update payment/cook status
3. Use the actions menu to:
   - View complete order details
   - Edit order information
   - Share order with kitchen
   - Delete orders (with confirmation)

### Language Switching
- Click the language icon in the header
- Select English or Arabic
- Interface updates immediately with proper RTL support for Arabic

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary to Almakarem Restaurant.

---

**Almakarem Kitchen Management System** - Streamlining restaurant operations with modern technology.