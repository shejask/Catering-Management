'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { InventorySection } from '@/features/inventory-customers/components/inventory-section';
import { CustomersSection } from '@/features/inventory-customers/components/customers-section';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function InventoryCustomersPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');
  const [activeSection, setActiveSection] = useState<string>('inventory');

  useEffect(() => {
    if (section === 'customers') setActiveSection('customers');
    else if (section === 'inventory') setActiveSection('inventory');
  }, [section]);

  const handleSectionChange = useCallback((value: string) => {
    setActiveSection(value);
  }, []);

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <Heading
          title="Inventory & Customer Management"
          description="Manage inventory, barcodes, and customer assignments for events."
        />
        <Accordion
          type="single"
          collapsible
          value={activeSection}
          onValueChange={handleSectionChange}
          className="w-full"
        >
          <AccordionItem value="inventory">
            <AccordionTrigger className="text-base font-semibold py-4">
              Inventory
            </AccordionTrigger>
            <AccordionContent>
              <InventorySection />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="customers">
            <AccordionTrigger className="text-base font-semibold py-4">
              Customers
            </AccordionTrigger>
            <AccordionContent>
              <CustomersSection />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </PageContainer>
  );
}
