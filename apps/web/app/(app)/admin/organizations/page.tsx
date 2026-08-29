"use client";

import { PageHeader } from "@/components/ui/page-header";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const mockOrgs = [
  { id: "1", name: "Acme Corp", slug: "acme-corp", tenant_type: "enterprise", is_active: true },
  { id: "2", name: "Global Tech", slug: "global-tech", tenant_type: "standalone", is_active: true },
];

const columns: Column<any>[] = [
  { accessor: "name", header: "Organization Name" },
  { accessor: "slug", header: "Slug" },
  { accessor: "tenant_type", header: "Type" },
  { 
    accessor: "is_active", 
    header: "Status",
    render: (item: any) => (
      <span className={`px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {item.is_active ? 'Active' : 'Inactive'}
      </span>
    )
  },
  {
    header: "Actions",
    render: (item: any) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Edit</Button>
        <Button variant="destructive" size="sm">Deactivate</Button>
      </div>
    )
  }
];

export default function OrganizationsPage() {
  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-6">
        <PageHeader 
          title="Organizations" 
          description="Manage tenant organizations, access, and limits." 
        />
        <Button>Create Organization</Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={mockOrgs}
            keyExtractor={(item) => item.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
