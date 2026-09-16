'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuth } from '../hooks/use-auth';

interface LogoutButtonProps extends ButtonProps {
  showIcon?: boolean;
}

export function LogoutButton({ showIcon = true, className, variant = 'outline', size = 'sm', children, ...props }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      {...props}
    >
      {isLoggingOut ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
      ) : (
        showIcon && <LogOut className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
      )}
      {children || 'Logout'}
    </Button>
  );
}
