import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { ProductDetail } from './pages/ProductDetail';
import { FindMyFrame } from './pages/FindMyFrame';
import { AiAnalysis } from './pages/AiAnalysis';
import { Recommendations } from './pages/Recommendations';
import { TryOn } from './pages/TryOn';
import { ARProductDisplay } from './pages/ARProductDisplay';
import { Compare } from './pages/Compare';
import { Cart } from './pages/Cart';
import { SellerDashboard } from './pages/SellerDashboard';
import { Profile } from './pages/Profile';
import { Storefront } from './pages/Storefront';
import { About } from './pages/About';

function AppContent() {
  const { currentPath, navigate, user, toastMessage } = useApp();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPath]);

  // Route dispatcher
  const renderRoute = () => {
    const safePath = (currentPath || '/').toString();
    const cleanPath = safePath.split('?')[0];

    // Try-on full-screen mirror AR route (Face Try-On)
    if (cleanPath.startsWith('/try-on')) {
      const parts = cleanPath.split('/');
      const productId = parts[2];
      return <TryOn productId={productId} />;
    }

    // AR Product Display (Physical Real-Size Marker Showcase)
    if (cleanPath.startsWith('/ar-display')) {
      const parts = cleanPath.split('/');
      const productId = parts[2];
      return <ARProductDisplay productId={productId} />;
    }

    // Product Detail route
    if (cleanPath.startsWith('/product/')) {
      const parts = cleanPath.split('/');
      const productId = parts[2];
      return <ProductDetail productId={productId} />;
    }

    // Storefront public artisan route
    if (cleanPath.startsWith('/store/')) {
      const parts = cleanPath.split('/');
      const sellerId = parts[2];
      return <Storefront sellerId={sellerId} />;
    }

    // Store Admin routes (/admin, /store-admin, or /seller)
    if (cleanPath.startsWith('/seller') || cleanPath.startsWith('/admin') || cleanPath.startsWith('/store-admin')) {
      return <SellerDashboard />;
    }

    switch (cleanPath) {
      case '/':
      case '':
        return <Home />;
      case '/story':
      case '/about':
        return <About />;
      case '/explore':
        return <Explore />;
      case '/find-my-frame':
        return <FindMyFrame />;
      case '/ai-analysis':
        return <AiAnalysis />;
      case '/recommendations':
        return <Recommendations />;
      case '/compare':
        return <Compare />;
      case '/cart':
      case '/checkout':
        return <Cart />;
      case '/order-confirmation':
        return <Cart />;
      case '/profile':
        return <Profile />;
      default:
        return <Home />;
    }
  };

  const safePath = (currentPath || '/').toString();
  const isFullScreenAR = safePath.startsWith('/try-on') || safePath.startsWith('/ar-display');

  if (isFullScreenAR) {
    return (
      <main className="min-h-screen bg-[#121212] text-white">
        {renderRoute()}
        <AuthModal />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-black/90 text-white border border-white/20 rounded-full shadow-2xl text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            {toastMessage}
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F2ED] text-[#1A1A1A] antialiased selection:bg-orange-700 selection:text-white font-sans">
      <Navbar />
      <main className="flex-grow">{renderRoute()}</main>
      <Footer />
      <AuthModal />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-[#1A1A1A] text-white rounded-full shadow-2xl text-xs font-semibold backdrop-blur-md flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
