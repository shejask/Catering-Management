# 🔥 Dynamic Firebase Dashboard

## This dashboard is ALREADY DYNAMIC and connected to Firebase!

### How it works:

1. **Real-time Data Fetching**: The dashboard automatically fetches data from Firebase Realtime Database every 30 seconds
2. **Dynamic KPI Calculations**: All metrics are calculated in real-time from your actual order data
3. **Live Updates**: When you create, update, or delete orders, the dashboard will reflect these changes

### KPIs Calculated from Firebase Data:

- **Total Revenue**: Sum of all paid orders (totalPayment - discount)
- **New Customers**: Unique customers (by phone number) for current month
- **Total Balance Amount**: Outstanding balance from unpaid orders
- **Cooking Pending**: Orders with status 'pending' or 'preparing'

### Firebase Connection:
- Database: `aneesh--catering-default-rtdb.firebaseio.com`
- Collection: `orders`
- Updates: Every 30 seconds automatically

### To see it in action:
1. Create a new order in "Create Order" page
2. Watch the dashboard update automatically
3. Change order status in "All Orders" page
4. See the KPIs change in real-time

The dashboard is fully dynamic and connected to your Firebase database!