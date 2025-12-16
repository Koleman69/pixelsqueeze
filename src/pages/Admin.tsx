import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, ArrowLeft, Users, Shield, ShieldCheck, ShieldOff, Search, X } from "lucide-react";
import * as XLSX from "xlsx";

interface UserData {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
}

const Admin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.email?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);

      // Check if user is admin using the has_role function
      const { data: roleData, error: roleError } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (roleError || !roleData) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAdmin(true);

      // Fetch all users and roles in parallel
      const [usersResult, rolesResult] = await Promise.all([
        supabase.rpc('get_all_users_for_admin'),
        supabase.rpc('get_all_user_roles')
      ]);

      if (usersResult.error) throw usersResult.error;
      if (rolesResult.error) throw rolesResult.error;

      setUsers(usersResult.data || []);
      setUserRoles(rolesResult.data || []);
    } catch (error: any) {
      console.error("Error loading admin data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isUserAdmin = (userId: string) => {
    return userRoles.some(r => r.user_id === userId && r.role === 'admin');
  };

  const handleToggleAdminRole = async (userId: string) => {
    setUpdatingRole(userId);
    const hasAdminRole = isUserAdmin(userId);

    try {
      if (hasAdminRole) {
        // Remove admin role
        const { error } = await supabase.rpc('remove_user_role', {
          target_user_id: userId,
          target_role: 'admin'
        });
        if (error) throw error;
        
        setUserRoles(prev => prev.filter(r => !(r.user_id === userId && r.role === 'admin')));
        toast({
          title: "Role Removed",
          description: "Admin role has been removed from the user.",
        });
      } else {
        // Add admin role
        const { error } = await supabase.rpc('add_user_role', {
          target_user_id: userId,
          target_role: 'admin'
        });
        if (error) throw error;
        
        setUserRoles(prev => [...prev, { user_id: userId, role: 'admin' }]);
        toast({
          title: "Role Added",
          description: "Admin role has been assigned to the user.",
        });
      }
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);

    try {
      // Prepare data for Excel
      const excelData = users.map(user => ({
        "First Name": user.first_name || "",
        "Last Name": user.last_name || "",
        "Email": user.email || "",
        "Admin": isUserAdmin(user.user_id) ? "Yes" : "No",
        "Signup Date & Time": user.created_at 
          ? new Date(user.created_at).toLocaleString()
          : ""
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // First Name
        { wch: 20 }, // Last Name
        { wch: 35 }, // Email
        { wch: 10 }, // Admin
        { wch: 25 }, // Signup Date & Time
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Users");

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `pixelsqueeze-users-${date}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export Successful",
        description: `Downloaded ${users.length} users to ${filename}`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate Excel file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Admin Panel</h1>
              <p className="text-lg text-muted-foreground">Manage users and export data</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Registered Users</CardTitle>
                  <CardDescription>
                    {users.length} total user{users.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
              <Button 
                onClick={handleExportExcel}
                disabled={isExporting || users.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export to Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {searchQuery && (
                <span className="text-sm text-muted-foreground">
                  {filteredUsers.length} of {users.length} users
                </span>
              )}
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No users match your search" : "No users found"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Signup Date & Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const hasAdminRole = isUserAdmin(user.user_id);
                      const isCurrentUser = user.user_id === currentUserId;
                      
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>{user.first_name || "—"}</TableCell>
                          <TableCell>{user.last_name || "—"}</TableCell>
                          <TableCell>{user.email || "—"}</TableCell>
                          <TableCell>
                            {hasAdminRole ? (
                              <Badge variant="default" className="gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.created_at 
                              ? new Date(user.created_at).toLocaleString()
                              : "—"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={hasAdminRole ? "destructive" : "outline"}
                              size="sm"
                              disabled={updatingRole === user.user_id || isCurrentUser}
                              onClick={() => handleToggleAdminRole(user.user_id)}
                            >
                              {updatingRole === user.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : hasAdminRole ? (
                                <>
                                  <ShieldOff className="h-4 w-4 mr-1" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-1" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
