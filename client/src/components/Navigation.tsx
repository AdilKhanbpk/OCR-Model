import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Eye, Sun, Moon, Menu, User, Settings, LogOut } from 'lucide-react';

export default function Navigation() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const navigationItems = [
    { href: '/', label: 'Dashboard', active: location === '/' },
    { href: '/api-keys', label: 'API Keys', active: location === '/api-keys' },
    { href: '/usage', label: 'Usage', active: location === '/usage' },
    { href: '/pricing', label: 'Pricing', active: location === '/pricing' },
  ];

  const getInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">OCR Vision</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.active ? 'secondary' : 'ghost'}
                  className="text-sm font-medium"
                  data-testid={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              data-testid="theme-toggle"
            >
              {theme === 'light' ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-slate-400" />
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="user-menu">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.profileImageUrl} alt={user?.email || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.firstName && (
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                    )}
                    {user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="mobile-menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navigationItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={item.active ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                        >
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
