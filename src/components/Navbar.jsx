
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-16">
          {/* Logo centré */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                className="h-10 md:h-12 w-auto"
                src="https://horizons-cdn.hostinger.com/8896ea62-c67d-4cd6-bb1e-261e23376240/f4119e01f9b07695060939d83fbcc8d5.png"
                alt="Quelia"
              />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
