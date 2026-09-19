'use client';

import React from 'react';

interface UserAvatarProps {
  email?: string;
  name?: string;
  className?: string;
}

export function UserAvatar({ email, name, className = '' }: UserAvatarProps) {
  const getInitial = () => {
    if (name && name.trim().length > 0) {
      return name.trim().charAt(0).toUpperCase();
    }
    if (email && email.trim().length > 0) {
      return email.trim().charAt(0).toUpperCase();
    }
    return 'U';
  };

  const initial = getInitial();

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-bold shadow-xs select-none ${className}`}
    >
      {initial}
    </div>
  );
}
