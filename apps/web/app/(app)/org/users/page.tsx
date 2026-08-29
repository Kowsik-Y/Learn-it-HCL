"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { FormDialog } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailsSheet } from "@/components/ui/details-sheet";
import { DataTable, Column } from "@/components/ui/data-table";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Pencil, Eye, User, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";

export default function OrgAdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<{ id: string, currentStatus: boolean } | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student",
  });

  // New CRUD states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ full_name: "", role: "" });
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        api.request<{ items: any[] }>("/org/users"),
        api.request<{ items: any[] }>("/org/roles"),
      ]);
      setUsers(usersData.items);
      setRoles(rolesData.items);
    } catch (err) {
      console.error(err);
      if ((err as Error).message.includes("Session expired") || (err as Error).message.includes("Forbidden")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request("/org/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsModalOpen(false);
      setFormData({ full_name: "", email: "", password: "", role: "student" });
      fetchData();
      toast.success("User created successfully");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleToggleStatus = async () => {
    if (!userToToggle) return;
    const { id, currentStatus } = userToToggle;
    try {
      await api.request(`/org/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      fetchData();
      toast.success(`User ${currentStatus ? "deactivated" : "activated"} successfully`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUserToToggle(null);
      setProcessingId(null);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setEditFormData({
      full_name: user.full_name,
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    try {
      setProcessingId(editingUserId);
      await api.request(`/org/users/${editingUserId}`, {
        method: "PUT",
        body: JSON.stringify(editFormData),
      });
      setIsEditModalOpen(false);
      fetchData();
      toast.success("User updated successfully");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setProcessingId(userToDelete.id);
      await api.request(`/org/users/${userToDelete.id}`, {
        method: "DELETE",
      });
      fetchData();
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setProcessingId(null);
      setUserToDelete(null);
    }
  };

  const activeUsers = users.filter((u) => u.is_active);
  const blockedUsers = users.filter((u) => !u.is_active);

  const columns: Column<any>[] = [
    {
      header: "User",
      headerClassName: "rounded-tl-lg",
      render: (user) => (
        <>
          <div className={`font-semibold transition-colors ${!user.is_active ? 'opacity-70' : 'group-hover:text-primary text-foreground'}`}>
            {user.full_name}
          </div>
          <div className={`text-xs mt-1 ${!user.is_active ? 'text-muted-foreground line-through opacity-70' : 'text-muted-foreground'}`}>
            {user.email}
          </div>
        </>
      ),
    },
    {
      header: "Role",
      cellClassName: (user: any) => (!user.is_active ? "opacity-70" : ""),
      render: (user) => (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 capitalize shadow-sm">
          {user.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      header: "Status",
      render: (user) => (
        <Badge
          variant={user.is_active ? "default" : "secondary"}
          className={
            user.is_active
              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
              : "border-destructive/20 text-destructive bg-destructive/10"
          }
        >
          {user.is_active ? "Active" : "Deactivated"}
        </Badge>
      ),
    },
    {
      header: "Created At",
      cellClassName: (user: any) => `text-muted-foreground ${!user.is_active ? 'opacity-70' : ''}`,
      render: (user) => new Date(user.created_at).toLocaleDateString(),
    },
    {
      header: "Actions",
      headerClassName: "rounded-tr-lg text-right",
      cellClassName: "text-right",
      render: (user) => (
        <DataTableRowActions
          loading={processingId === user.id}
          actions={[
            {
              label: "View Details",
              icon: <Eye className="mr-2 h-4 w-4" />,
              onClick: () => setViewingUser(user),
            },
            user.role !== "super_admin" && {
              label: "Edit User",
              icon: <Pencil className="mr-2 h-4 w-4" />,
              onClick: () => openEditModal(user),
            },
            user.role !== "super_admin" && (user.is_active
              ? {
                label: "Deactivate User",
                icon: <ShieldAlert className="mr-2 h-4 w-4" />,
                onClick: () => setUserToToggle({ id: user.id, currentStatus: true }),
                className: "text-orange-600 focus:text-orange-600 focus:bg-orange-50",
              }
              : {
                label: "Activate User",
                icon: <ShieldCheck className="mr-2 h-4 w-4" />,
                onClick: () => setUserToToggle({ id: user.id, currentStatus: false }),
                className: "text-green-600 focus:text-green-600 focus:bg-green-50",
              }),
            user.role !== "super_admin" && {
              label: "Remove User",
              icon: <Trash2 className="mr-2 h-4 w-4" />,
              onClick: () => setUserToDelete({ id: user.id, name: user.full_name }),
              variant: "destructive",
            },
          ]}
        />
      ),
    },
  ];

  const renderUserTable = (userList: any[]) => (
    <Card className="p-0">
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={userList}
          keyExtractor={(u) => u.id}
          emptyMessage="No users found in this category."
        />
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-muted-foreground">Loading users...</div>;
  }

  return (
    <>
      <PageHeader
        title="Organization Roster"
        description="Manage members and roles within your tenant."
        actions={
          <Button size="lg" onClick={() => setIsModalOpen(true)}>
            + Add User
          </Button>
        }
      />
          <FormDialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            title="Add New User"
            description="Invite a new member to your organization and assign a role."
            onSubmit={handleCreateUser}
            submitLabel="Create User"
          >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Temporary Password</label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {roles.filter((r) => r.slug !== "super_admin").map((role) => (
                        <option key={role.slug} value={role.slug}>
                          {role.name} {role.is_global ? "(Global)" : "(Custom)"}
                        </option>
                      ))}
                    </select>
                  </div>
            </div>
          </FormDialog>

          <ConfirmDialog
            open={!!userToToggle}
            onOpenChange={(open) => !open && setUserToToggle(null)}
            title="Are you absolutely sure?"
            description={
              userToToggle?.currentStatus
                ? "This will deactivate the user and prevent them from accessing the platform."
                : "This will activate the user and restore their access to the platform."
            }
            onConfirm={handleToggleStatus}
            confirmLabel={userToToggle?.currentStatus ? "Deactivate User" : "Activate User"}
            variant={userToToggle?.currentStatus ? "destructive" : "default"}
          />

          {/* Edit User Modal */}
          <FormDialog
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            title="Edit User"
            description="Update user details and their organization role."
            onSubmit={handleUpdateUser}
            isProcessing={processingId === editingUserId}
            className="sm:max-w-md"
          >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    required
                  >
                    {roles.filter((r) => r.slug !== "super_admin").map((role) => (
                      <option key={role.slug} value={role.slug}>
                        {role.name} {role.is_global ? "(Global)" : "(Custom)"}
                      </option>
                    ))}
                  </select>
                </div>
          </FormDialog>

          {/* Delete User Alert */}
          <ConfirmDialog
            open={!!userToDelete}
            onOpenChange={() => setUserToDelete(null)}
            title="Delete User"
            description={
              <>Are you sure you want to permanently remove <span className="font-bold">{userToDelete?.name}</span> from this organization? This action cannot be undone.</>
            }
            onConfirm={handleDeleteUser}
            isProcessing={processingId === userToDelete?.id}
            confirmLabel="Remove User"
            variant="destructive"
          />

          {/* View User Details Sheet */}
          <DetailsSheet
            open={!!viewingUser}
            onOpenChange={(open) => !open && setViewingUser(null)}
            title="User Profile"
            description={`Detailed information for ${viewingUser?.full_name}.`}
            icon={<User className="h-6 w-6 text-primary" />}
            className="w-[400px] sm:max-w-md overflow-y-auto"
          >
            {viewingUser && (
                <div className="space-y-8 mt-6">
                  <div className="space-y-1 border-b pb-4">
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={viewingUser.is_active ? "default" : "secondary"} className={viewingUser.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                        {viewingUser.is_active ? "Active" : "Deactivated"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{viewingUser.role.replace("_", " ")}</Badge>
                    </div>
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-sm text-muted-foreground font-medium">Name</p>
                      <p className="col-span-2 font-medium text-foreground">{viewingUser.full_name}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-sm text-muted-foreground font-medium">Email</p>
                      <p className="col-span-2 font-medium text-sm text-foreground">{viewingUser.email}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-sm text-muted-foreground font-medium">ID</p>
                      <p className="col-span-2 font-mono text-xs text-muted-foreground">{viewingUser.id}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-sm text-muted-foreground font-medium">Joined</p>
                      <p className="col-span-2 text-sm">
                        {new Date(viewingUser.created_at).toLocaleString(undefined, {
                          year: 'numeric', month: 'long', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <Button variant="outline" className="w-full" onClick={() => { setViewingUser(null); openEditModal(viewingUser); }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit User
                    </Button>
                  </div>
                </div>
              )}
          </DetailsSheet>

      <Tabs defaultValue="all" className="w-full mt-6">
        <TabsList className="mb-6 bg-muted/50">
          <TabsTrigger value="all" className="text-sm font-medium px-6 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            All Users <Badge variant="secondary" className="ml-2">{users.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="text-sm font-medium px-6 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Active <Badge variant="secondary" className="ml-2">{activeUsers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="blocked" className="text-sm font-medium px-6 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Blocked <Badge variant="secondary" className="ml-2">{blockedUsers.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderUserTable(users)}</TabsContent>
        <TabsContent value="active">{renderUserTable(activeUsers)}</TabsContent>
        <TabsContent value="blocked">{renderUserTable(blockedUsers)}</TabsContent>
      </Tabs>


    </>
  );
}
