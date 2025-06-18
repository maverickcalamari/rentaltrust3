import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Properties from "@/pages/properties";
import Tenants from "@/pages/tenants";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import PropertyDetails from "@/pages/property-details";
import TenantDetails from "@/pages/tenant-details";
import TenantPortal from "@/pages/tenant-portal";
import { ProtectedRoute } from "./lib/protected-route";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Landlord Routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/properties" component={Properties} />
      <ProtectedRoute path="/properties/:id" component={PropertyDetails} />
      <ProtectedRoute path="/tenants" component={Tenants} />
      <ProtectedRoute path="/tenants/:id" component={TenantDetails} />
      <ProtectedRoute path="/payments" component={Payments} />
      <ProtectedRoute path="/reports" component={Reports} />
      
      {/* Tenant Routes */}
      <ProtectedRoute path="/tenant-portal" component={TenantPortal} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
