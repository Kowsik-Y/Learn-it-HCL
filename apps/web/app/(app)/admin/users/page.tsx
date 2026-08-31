'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  Building,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Mail,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { type Column, DataTable } from '@/components/ui/data-table';
import { DataTableRowActions } from '@/components/ui/data-table-row-actions';
import { DetailsSheet } from '@/components/ui/details-sheet';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [userToToggle, setUserToToggle] = useState<{ id: string; currentStatus: boolean } | null>(
    null,
  );
  const [approvalResult, setApprovalResult] = useState<{ email: string; password: string } | null>(
    null,
  );

  // New CRUD states
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ fullName: '', role: '' });
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, reqsData] = await Promise.all([
        api.request<{ items: any[] }>('/admin/users'),
        api.request<{ items: any[] }>('/admin/requests'),
      ]);
      setUsers(usersData.items || []);
      setRequests(reqsData.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProcessRequest = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    setApprovalResult(null);
    try {
      const data = await api.request<{ user?: any }>(`/admin/requests/${id}/${action}`, {
        method: 'POST',
      });
      if (action === 'approve' && data.user) {
        setApprovalResult({ email: data.user.email, password: data.user.temporaryPassword });
        toast.success('Request approved successfully');
      } else {
        toast.success('Request rejected successfully');
      }
      fetchData(); // refresh data
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleUser = async () => {
    if (!userToToggle) return;
    const { id, currentStatus } = userToToggle;
    setProcessingId(id);
    try {
      await api.request(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchData(); // refresh
      toast.success(`User ${currentStatus ? 'blocked' : 'unblocked'} successfully`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
      setUserToToggle(null);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setEditFormData({
      fullName: user.fullName,
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    try {
      setProcessingId(editingUserId);
      await api.request(`/admin/users/${editingUserId}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      setIsEditModalOpen(false);
      fetchData();
      toast.success('User updated successfully');
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
      await api.request(`/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      fetchData();
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setProcessingId(null);
      setUserToDelete(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const activeUsers = users.filter((u) => u.isActive);
  const blockedUsers = users.filter((u) => !u.isActive);

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userColumns: Column<any>[] = [
    {
      header: 'Name & Email',
      render: (user) => (
        <>
          <div className={`font-medium ${!user.isActive ? 'opacity-70' : ''}`}>{user.fullName}</div>
          <div className={`text-xs text-muted-foreground ${!user.isActive ? 'line-through' : ''}`}>
            {user.email}
          </div>
        </>
      ),
    },
    {
      header: 'Organization',
      cellClassName: (user: any) => (!user.isActive ? 'opacity-70' : ''),
      render: (user) =>
        user.organization?.name || <span className="text-muted-foreground italic">None</span>,
    },
    {
      header: 'Role',
      cellClassName: (user: any) => (!user.isActive ? 'opacity-70' : ''),
      render: (user) => <Badge variant="outline">{user.role}</Badge>,
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (user) => (
        <DataTableRowActions
          loading={processingId === user.id}
          actions={[
            {
              label: 'View Details',
              icon: <Eye className="mr-2 h-4 w-4" />,
              onClick: () => setViewingUser(user),
            },
            {
              label: 'Edit User',
              icon: <Pencil className="mr-2 h-4 w-4" />,
              onClick: () => openEditModal(user),
            },
            user.isActive
              ? {
                  label: 'Block User',
                  icon: <ShieldAlert className="mr-2 h-4 w-4" />,
                  onClick: () => setUserToToggle({ id: user.id, currentStatus: true }),
                  className: 'text-orange-600 focus:text-orange-600 focus:bg-orange-50',
                }
              : {
                  label: 'Unblock User',
                  icon: <ShieldCheck className="mr-2 h-4 w-4" />,
                  onClick: () => setUserToToggle({ id: user.id, currentStatus: false }),
                  className: 'text-green-600 focus:text-green-600 focus:bg-green-50',
                },
            {
              label: 'Delete User',
              icon: <Trash2 className="mr-2 h-4 w-4" />,
              onClick: () => setUserToDelete({ id: user.id, name: user.fullName }),
              variant: 'destructive',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Global Users"
        description="Manage platform access requests and user statuses globally."
      />
      {approvalResult && (
        <Dialog open={!!approvalResult} onOpenChange={() => setApprovalResult(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Approved & Organization Created!</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Please securely share these temporary credentials with the user:
            </p>
            <div className="bg-background rounded p-4 font-mono text-sm border shadow-inner">
              <div>
                <strong>Email:</strong> {approvalResult.email}
              </div>
              <div>
                <strong>Password:</strong> {approvalResult.password}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setApprovalResult(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit User Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit User"
        description="Update user details and global role."
        onSubmit={handleUpdateUser}
        isProcessing={processingId === editingUserId}
      >
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input
            value={editFormData.fullName}
            onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>System Role</Label>
          <Select
            value={editFormData.role}
            onValueChange={(val) => setEditFormData({ ...editFormData, role: val ?? '' })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="org_admin">Organization Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormDialog>

      {/* Delete User Alert */}
      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
        title="Delete User"
        description={
          <>
            Are you sure you want to permanently delete{' '}
            <span className="font-bold">{userToDelete?.name}</span>? This action cannot be undone
            and will remove all their data from the system.
          </>
        }
        onConfirm={handleDeleteUser}
        isProcessing={processingId === userToDelete?.id}
        confirmLabel="Delete User"
      />

      {/* View User Details Sheet */}
      <DetailsSheet
        open={!!viewingUser}
        onOpenChange={(open) => !open && setViewingUser(null)}
        title="User Profile"
        description={`Detailed information for ${viewingUser?.fullName}.`}
        icon={<User className="h-6 w-6 text-primary" />}
        className="w-[400px] sm:max-w-md overflow-y-auto"
      >
        {viewingUser && (
          <>
            <div className="space-y-1 border-b pb-4">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Status
              </p>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={viewingUser.isActive ? 'default' : 'secondary'}
                  className={
                    viewingUser.isActive
                      ? 'bg-green-500/10 text-green-600 border-green-500/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }
                >
                  {viewingUser.isActive ? 'Active' : 'Blocked'}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {viewingUser.role.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="space-y-4 border-b pb-4">
              <div className="grid grid-cols-3 gap-2">
                <p className="text-sm text-muted-foreground font-medium">Name</p>
                <p className="col-span-2 font-medium text-foreground">{viewingUser.fullName}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <p className="text-sm text-muted-foreground font-medium">Email</p>
                <p className="col-span-2 font-medium text-sm text-foreground">
                  {viewingUser.email}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <p className="text-sm text-muted-foreground font-medium">ID</p>
                <p className="col-span-2 font-mono text-xs text-muted-foreground">
                  {viewingUser.id}
                </p>
              </div>
            </div>

            <div className="space-y-4 border-b pb-4">
              <p className="text-sm font-semibold text-foreground">Organization</p>
              {viewingUser.organization ? (
                <div className="space-y-2">
                  <p className="font-medium">{viewingUser.organization.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    /{viewingUser.organization.slug}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No organization assigned.</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <p className="text-sm text-muted-foreground font-medium">Joined</p>
                <p className="col-span-2 text-sm">
                  {new Date(viewingUser.createdAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setViewingUser(null);
                  openEditModal(viewingUser);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            </div>
          </>
        )}
      </DetailsSheet>

      <ConfirmDialog
        open={!!userToToggle}
        onOpenChange={(open) => !open && setUserToToggle(null)}
        title="Are you absolutely sure?"
        description={
          userToToggle?.currentStatus
            ? 'This will block the user and prevent them from accessing the platform.'
            : 'This will unblock the user and restore their access to the platform.'
        }
        onConfirm={handleToggleUser}
        confirmLabel={userToToggle?.currentStatus ? 'Block User' : 'Unblock User'}
        variant={userToToggle?.currentStatus ? 'destructive' : 'default'}
      />
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="mb-6 h-12 w-full md:w-auto bg-muted/50 p-1">
          <TabsTrigger
            value="requests"
            className="flex-1 md:flex-none text-sm font-medium h-10 px-6 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Pending Requests{' '}
            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
              {pendingRequests.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="flex-1 md:flex-none text-sm font-medium h-10 px-6 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Active Users{' '}
            <Badge variant="secondary" className="ml-2">
              {activeUsers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="blocked"
            className="flex-1 md:flex-none text-sm font-medium h-10 px-6 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Blocked Users{' '}
            <Badge variant="secondary" className="ml-2">
              {blockedUsers.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="border-dashed bg-muted/10">
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-4 opacity-20" />
                <p>No pending access requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <Card key={req.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-muted/30 pb-4 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{req.fullName}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3" /> {req.email}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                      >
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {req.company && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-4 w-4" /> {req.company}
                      </div>
                    )}
                    <div className="text-sm bg-muted/30 p-3 rounded-md italic">"{req.reason}"</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Applied {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={processingId === req.id}
                        onClick={() => handleProcessRequest(req.id, 'approve')}
                      >
                        {processingId === req.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Approve & Provision'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                        disabled={processingId === req.id}
                        onClick={() => handleProcessRequest(req.id, 'reject')}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <DataTable
              columns={userColumns}
              data={activeUsers}
              keyExtractor={(u) => u.id}
              emptyMessage="No active users found."
            />
          </div>
        </TabsContent>

        <TabsContent value="blocked" className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm border-destructive/20">
            <DataTable
              columns={userColumns}
              data={blockedUsers}
              keyExtractor={(u) => u.id}
              emptyMessage="No blocked users found."
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
