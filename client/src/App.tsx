import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthAccess from "./pages/AuthAccess";
import CompetitorShops from "./pages/CompetitorShops";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import PriceHistory from "./pages/PriceHistory";

function Router() {
  const [location] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading...</div>;
  }
  if (location === "/login-placeholder") {
    return <AuthAccess />;
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        {isAuthenticated && <Route path="/products" component={Products} />}
        {isAuthenticated && <Route path="/history" component={PriceHistory} />}
        {isAuthenticated && <Route path="/competitors" component={CompetitorShops} />}
        <Route path="/404" component={NotFound} />
        <Route component={isAuthenticated ? NotFound : Dashboard} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
