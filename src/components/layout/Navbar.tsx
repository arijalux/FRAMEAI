import React from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerNavigation } from './CustomerNavigation';
import { SellerNavigation } from './SellerNavigation';

export const Navbar: React.FC = () => {
  const { currentPath, user } = useApp();
  const safePath = (currentPath || '').toString();

  const isSellerMode = user.role === 'seller' && safePath.startsWith('/seller');

  if (isSellerMode) {
    return <SellerNavigation />;
  }

  return <CustomerNavigation />;
};

