// app/login/layout.tsx
import React from 'react';

const LoginLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {/* You can add common elements like headers, footers, etc. here */}
      {children}
    </div>
  );
};

export default LoginLayout;
