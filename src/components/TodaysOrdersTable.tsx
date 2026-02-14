import React from 'react';
import { OrderWithStatus } from '@/lib/pdf-utils';
import { DownloadReceiptButton, DownloadReceiptIconButton } from './DownloadReceiptButton';

interface TodaysOrdersTableProps {
  orders: OrderWithStatus[];
}

export const TodaysOrdersTable: React.FC<TodaysOrdersTableProps> = ({
  orders
}) => {
  // Only show English text and buttons regardless of language setting

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Receipt No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Order Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Phone Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Delivery Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Total Amount
            </th>
            {/* Receipt column - always in English */}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Receipt
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order, index) => (
            <tr key={order.orderId || index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b">
                {order.receiptNo || order.orderId || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                {order.name || 'N/A'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 border-b max-w-xs truncate">
                {order.orderDetails || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                {order.phoneNumber || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                {order.deliveryType || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                {order.date || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                {order.time || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status || 'Unknown'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b">
                ${order.totalAmount?.toFixed(2) || '0.00'}
              </td>
              {/* Receipt button - always in English */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                <DownloadReceiptButton 
                  order={order} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Alternative compact version with icon buttons
export const TodaysOrdersCompactTable: React.FC<TodaysOrdersTableProps> = ({
  orders
}) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order, index) => (
        <div key={order.orderId || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {order.receiptNo || order.orderId || 'N/A'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{order.name || 'N/A'}</h3>
                  <p className="text-sm text-gray-500">{order.orderDetails || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>{order.phoneNumber || 'N/A'}</span>
                <span>{order.deliveryType || 'N/A'}</span>
                <span>{order.date || 'N/A'}</span>
                <span>{order.time || 'N/A'}</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status || 'Unknown'}
                </span>
                <span className="font-medium text-gray-900">${order.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              <DownloadReceiptIconButton 
                order={order} 
                variant="outline"
                size="icon"
                className="hover:bg-blue-50"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TodaysOrdersTable;
