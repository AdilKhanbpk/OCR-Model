import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import DemoLanding from "@/pages/DemoLanding";
import Dashboard from "@/pages/Dashboard";
import ApiKeys from "@/pages/ApiKeys";
import Usage from "@/pages/Usage";
import Pricing from "@/pages/Pricing";
import Admin from "@/pages/Admin";
import Subscribe from "@/pages/Subscribe";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // In demo mode, always show demo landing and bypass auth
  const isDemoMode = process.env.DATABASE_ENABLED !== 'true';

  return (
    <Switch>
      {isDemoMode ? (
        <>
          <Route path="/" component={DemoLanding} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/api-keys" component={ApiKeys} />
          <Route path="/usage" component={Usage} />
          <Route path="/admin" component={Admin} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/subscribe" component={Subscribe} />
        </>
      ) : isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/pricing" component={Pricing} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/api-keys" component={ApiKeys} />
          <Route path="/usage" component={Usage} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/admin" component={Admin} />
          <Route path="/subscribe" component={Subscribe} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
