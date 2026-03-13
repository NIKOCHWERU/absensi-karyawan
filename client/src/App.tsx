import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/LoginPage";
import EmployeeDashboard from "@/pages/employee/DashboardPage";
import EmployeeRecap from "@/pages/employee/RecapPage";
import EmployeeInfo from "@/pages/employee/InfoPage";

import AdminDashboard from "@/pages/admin/DashboardPage";
import AdminEmployeeList from "@/pages/admin/EmployeeListPage";
import AttendanceSummaryPage from "@/pages/admin/AttendanceSummaryPage";
import AdminRecap from "@/pages/admin/RecapPage";
import InfoBoardPage from "@/pages/admin/InfoBoardPage";
import AdminComplaints from "@/pages/admin/ComplaintsPage";
import AdminLeave from "@/pages/admin/AdminLeavePage";
import AdminLeaveHistory from "@/pages/admin/AdminLeaveHistoryPage";
import AdminAttendanceHistory from "@/pages/admin/AttendanceHistoryPage";
import AdminBackupPage from "@/pages/admin/AdminBackupPage";
import EmployeeComplaint from "@/pages/employee/ComplaintPage";
import AdminLayout from "@/components/layout/AdminLayout";
import EmployeeLeave from "@/pages/employee/LeavePage";
import NotFound from "@/pages/not-found";
import InstallAppBanner from "@/components/InstallAppBanner";

function ProtectedRoute({ component: Component, adminOnly }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && adminOnly && user.role !== 'admin') {
      setLocation("/");
    }
  }, [user, isLoading, setLocation, adminOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (adminOnly && user.role !== 'admin') return null;

  return <Component />;
}

function DashboardSwitcher() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminLayout><AdminDashboard /></AdminLayout>;
  }
  return <EmployeeDashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={() => <AdminLayout><AdminDashboard /></AdminLayout>} adminOnly />
      </Route>
      <Route path="/admin/employees">
        <ProtectedRoute component={() => <AdminLayout><AdminEmployeeList /></AdminLayout>} adminOnly />
      </Route>
      <Route path="/admin/attendance-history">
        <ProtectedRoute component={() => <AdminLayout><AdminAttendanceHistory /></AdminLayout>} adminOnly />
      </Route>
      <Route path="/admin/recap">
        <ProtectedRoute component={() => <AdminLayout><AdminRecap /></AdminLayout>} adminOnly />
      </Route>
      <Route path="/admin/attendance-summary">
        <ProtectedRoute component={() => <AdminLayout><AttendanceSummaryPage /></AdminLayout>} adminOnly />
      </Route>
      <Route path="/admin/info-board">
        <ProtectedRoute component={() => <AdminLayout><InfoBoardPage /></AdminLayout>} adminOnly />
      </Route>
      <Route path="/admin/complaints">
        <ProtectedRoute component={() => <AdminLayout><AdminComplaints /></AdminLayout>} adminOnly />
      </Route>
      <Route path="/admin/leave">
        <ProtectedRoute component={() => <AdminLayout><AdminLeave /></AdminLayout>} adminOnly />
      </Route>
      <Route path="/admin/leave-history">
        <ProtectedRoute component={() => <AdminLayout><AdminLeaveHistory /></AdminLayout>} adminOnly />
      </Route>
      <Route path="/admin/backup">
        <ProtectedRoute component={() => <AdminLayout><AdminBackupPage /></AdminLayout>} adminOnly />
      </Route>

      {/* Employee & Shared Routes */}
      <Route path="/">
        <ProtectedRoute component={DashboardSwitcher} />
      </Route>
      <Route path="/recap">
        <ProtectedRoute component={EmployeeRecap} />
      </Route>
      <Route path="/info">
        <ProtectedRoute component={EmployeeInfo} />
      </Route>
      <Route path="/complaint">
        <ProtectedRoute component={EmployeeComplaint} />
      </Route>
      <Route path="/leave">
        <ProtectedRoute component={EmployeeLeave} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <InstallAppBanner />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
