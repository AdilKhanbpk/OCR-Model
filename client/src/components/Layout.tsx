import { useAuth } from '@/hooks/useAuth';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && <Navigation />}
      <main className={isAuthenticated ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  );
}
