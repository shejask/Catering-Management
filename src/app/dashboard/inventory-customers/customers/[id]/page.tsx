'use client';

import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useInventoryCustomersStore } from '@/stores/inventory-customers-store';
import { IconChevronLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { ScanReturnSheet } from '@/features/inventory-customers/components/scan-return-sheet';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const getCustomerById = useInventoryCustomersStore((s) => s.getCustomerById);
  const getAssignmentsByCustomer = useInventoryCustomersStore((s) => s.getAssignmentsByCustomer);

  const customer = getCustomerById(id);
  const assignments = getAssignmentsByCustomer(id);

  if (!customer) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Customer not found.</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/dashboard/inventory-customers?section=customers">Back to Customers</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/inventory-customers?section=customers">
              <IconChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Customer Detail</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{customer.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Delivery required:</span> {customer.deliveryRequiredDate}</p>
            {customer.address && <p><span className="text-muted-foreground">Address:</span> {customer.address}</p>}
            {customer.phone && <p><span className="text-muted-foreground">Phone:</span> {customer.phone}</p>}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-medium mb-3">Products assigned to this customer</h2>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No products assigned yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.barcodeId}</TableCell>
                      <TableCell>{a.productName}</TableCell>
                      <TableCell>{a.category}</TableCell>
                      <TableCell>{a.dateAssigned}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'with_customer' ? 'default' : 'secondary'}>
                          {a.status === 'with_customer' ? 'With customer' : 'Returned'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.status === 'with_customer' && (
                          <ScanReturnSheet
                            barcodeId={a.barcodeId}
                            customerId={customer.id}
                            triggerLabel="Scan return"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
