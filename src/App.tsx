import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load all pages for code-splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Success = lazy(() => import("./pages/Success"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const Company = lazy(() => import("./pages/Company"));
const Account = lazy(() => import("./pages/Account"));
const Landing = lazy(() => import("./pages/Landing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SharedFile = lazy(() => import("./pages/SharedFile"));
const Admin = lazy(() => import("./pages/Admin"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Install = lazy(() => import("./pages/Install"));
const Promote = lazy(() => import("./pages/Promote"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Scanner = lazy(() => import("./pages/Scanner"));
const AIImageUpscaler = lazy(() => import("./pages/tools/AIImageUpscaler"));
const ImageEnhancer = lazy(() => import("./pages/tools/ImageEnhancer"));
const PhotoOptimizer = lazy(() => import("./pages/tools/PhotoOptimizer"));
const WebsiteImageCompression = lazy(() => import("./pages/tools/WebsiteImageCompression"));
const PrintReadyImages = lazy(() => import("./pages/tools/PrintReadyImages"));
const SolutionsIndex = lazy(() => import("./pages/SolutionsIndex"));
const IndustryLanding = lazy(() => import("./pages/IndustryLanding"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Loading page">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true"></div>
    <span className="sr-only">Loading...</span>
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Authenticating">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true"></div>
        <span className="sr-only">Authenticating...</span>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Public Route component (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public landing page */}
                <Route path="/" element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                } />
                {/* Protected dashboard */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/success" element={
                  <ProtectedRoute>
                    <Success />
                  </ProtectedRoute>
                } />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:articleId" element={<BlogArticle />} />
                <Route path="/company" element={<Company />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/install" element={<Install />} />
                <Route path="/promote" element={<Promote />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/tools/ai-image-upscaler" element={<AIImageUpscaler />} />
                <Route path="/tools/image-enhancer" element={<ImageEnhancer />} />
                <Route path="/tools/photo-optimizer" element={<PhotoOptimizer />} />
                <Route path="/tools/website-image-compression" element={<WebsiteImageCompression />} />
                <Route path="/tools/print-ready-images" element={<PrintReadyImages />} />
                <Route path="/for" element={<SolutionsIndex />} />
                <Route path="/for/:slug" element={<IndustryLanding />} />
                <Route path="/share/:shareCode" element={<SharedFile />} />
                <Route path="/account" element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/auth" element={
                  <PublicRoute>
                    <Auth />
                  </PublicRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
