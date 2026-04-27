import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useLang } from "./contexts/LanguageContext";
import CompetitorShops from "./pages/CompetitorShops";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import PriceHistory from "./pages/PriceHistory";
import SalesEstimator from "./pages/SalesEstimator";

function Router() {
  const { t } = useLang();
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">{t.appLoading}</div>
    );
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        {isAuthenticated && <Route path="/products" component={Products} />}
        {isAuthenticated && <Route path="/history" component={PriceHistory} />}
        {isAuthenticated && <Route path="/competitors" component={CompetitorShops} />}
        {isAuthenticated && <Route path="/sales-estimator" component={SalesEstimator} />}
        <Route path="/404" component={NotFound} />
        <Route component={isAuthenticated ? NotFound : Dashboard} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
