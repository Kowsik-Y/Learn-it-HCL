"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Pencil } from "lucide-react";
import AVAILABLE_PERMISSIONS from "@/config/permissions.json";
import { PageHeader } from "@/components/ui/page-header";
import { FormDialog } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { DataTable, Column } from "@/components/ui/data-table";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";

export default function OrgRoles() {
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ id: string, name: string } | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const data = await api.request<{ items: any[] }>("/org/roles");
      setRoles(data.items);
    } catch (err) {
      console.error(err);
      if ((err as Error).message.includes("Session expired") || (err as Error).message.includes("Forbidden")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoleId) {
        await api.request(`/org/roles/${editingRoleId}`, {
          method: "PUT",
          body: JSON.stringify({ name: formData.name, permissions: formData.permissions }),
        });
        toast.success("Role updated successfully");
      } else {
        await api.request("/org/roles", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast.success("Role created successfully");
      }
      setIsModalOpen(false);
      setEditingRoleId(null);
      setFormData({ name: "", slug: "", permissions: [] });
      fetchRoles();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const openEditModal = (role: any) => {
    setEditingRoleId(role.id);
    setFormData({
      name: role.name,
      slug: role.slug,
      permissions: role.permissions || [],
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingRoleId(null);
    setFormData({ name: "", slug: "", permissions: [] });
    setIsModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setProcessingId(roleToDelete.id);
    try {
      await api.request(`/org/roles/${roleToDelete.id}`, {
        method: "DELETE",
      });
      fetchRoles();
      toast.success(`Role "${roleToDelete.name}" deleted successfully`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setProcessingId(null);
      setRoleToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-muted-foreground">Loading roles...</div>;
  }

  const columns: Column<any>[] = [
    {
      header: "Role Name",
      headerClassName: "rounded-tl-lg",
      render: (role) => (
        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {role.name}
        </span>
      ),
    },
    {
      header: "Slug Identifier",
      render: (role) => (
        <span className="font-mono text-xs text-muted-foreground bg-muted/20 px-1 py-0.5 rounded">
          {role.slug}
        </span>
      ),
    },
    {
      header: "Scope",
      render: (role) =>
        role.is_global ? (
          <Badge variant="outline" className="bg-muted text-muted-foreground shadow-sm">
            Global System
          </Badge>
        ) : (
          <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-sm">
            Organization Custom
          </Badge>
        ),
    },
    {
      header: "Permissions",
      render: (role) =>
        role.permissions?.length > 0 ? (
          <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md">
            {role.permissions.length} rules
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">None</span>
        ),
    },
    {
      header: "Created At",
      render: (role) => (
        <span className="text-muted-foreground">
          {new Date(role.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      headerClassName: "rounded-tr-lg text-right",
      render: (role) => (
        !role.is_global && (
          <DataTableRowActions
            loading={processingId === role.id}
            actions={[
              {
                label: "Edit Role",
                icon: <Pencil className="mr-2 h-4 w-4" />,
                onClick: () => openEditModal(role),
              },
              {
                label: "Delete Role",
                icon: <Trash2 className="mr-2 h-4 w-4" />,
                onClick: () => setRoleToDelete({ id: role.id, name: role.name }),
                variant: "destructive",
              }
            ]}
          />
        )
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Custom Roles"
        description="Manage roles specific to your organization."
        actions={
          <Button size="lg" onClick={openCreateModal}>
            + Create Custom Role
          </Button>
        }
      />
          <FormDialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            title={editingRoleId ? "Edit Custom Role" : "Create Custom Role"}
            description={
              editingRoleId
                ? "Modify the name and permissions for this custom role."
                : "Create a new role scoped exclusively to your organization."
            }
            onSubmit={handleSaveRole}
            submitLabel={editingRoleId ? "Save Changes" : "Create Role"}
            className="sm:max-w-[42.5rem]"
          >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role Name (Display)</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Assistant Teacher"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slug (System ID)</label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      placeholder="assistant_teacher"
                      required
                      disabled={!!editingRoleId}
                      className="bg-background/50 font-mono text-sm disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-sm font-medium">Access Permissions</label>
                    <div className="grid grid-cols-2 gap-3 p-4 border border-border rounded-lg bg-muted/20">
                      {AVAILABLE_PERMISSIONS.map(perm => (
                        <label key={perm.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm hover:bg-muted/50 transition-colors cursor-pointer">
                          <Checkbox
                            id={perm.id}
                            checked={formData.permissions.includes(perm.id)}
                            onCheckedChange={(checked) => {
                              const newPerms = checked
                                ? [...formData.permissions, perm.id]
                                : formData.permissions.filter(p => p !== perm.id);
                              setFormData({ ...formData, permissions: newPerms });
                            }}
                          />
                          <div className="space-y-1 leading-none">
                            <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{perm.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
          </FormDialog>

          <ConfirmDialog
            open={!!roleToDelete}
            onOpenChange={(open) => !open && setRoleToDelete(null)}
            title="Are you absolutely sure?"
            description={`This action cannot be undone. This will permanently delete the custom role "${roleToDelete?.name}".`}
            onConfirm={handleDeleteRole}
            confirmLabel="Delete"
            variant="destructive"
          />

      <Card className="backdrop-blur-xl bg-card/80 border-border shadow-xl mt-6">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={roles}
            keyExtractor={(role) => role.id}
            emptyMessage="No roles found."
          />
        </CardContent>
      </Card>
    </>
  );
}
