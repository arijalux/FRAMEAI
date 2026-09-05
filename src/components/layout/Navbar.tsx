import React from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerNavigation } from './CustomerNavigation';
import { SellerNavigation } from './SellerNavigation';

export const Navbar: React.FC = () => {
  const { currentPath, user } = useApp();
  const safePath = (currentPath || '').toString();

  const isAdminMode = safePath.startsWith('/seller') || safePath.startsWith('/admin') || safePath.startsWith('/store-admin');

  if (isAdminMode) {
    return <SellerNavigation />;
  }

  return <CustomerNavigation />;
};

