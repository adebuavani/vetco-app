// app/register/layout.tsx
import React from 'react';

const RegisterLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {/* Layout components like header or footer can go here */}
      {children}
    </div>
  );
};

export default RegisterLayout;
