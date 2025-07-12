'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-950 text-gray-300 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} Cube Painter. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
