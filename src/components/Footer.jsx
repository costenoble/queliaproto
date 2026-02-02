
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Company Info */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-2 text-white">Quelia</h3>
            <p className="text-gray-400 text-sm">
              Expertise en concertation et ingénierie sociale pour les énergies renouvelables.
            </p>
          </div>

          {/* Legal Link */}
          <div className="text-center md:text-right">
            <a
              href="https://quelia.fr/mentions-legales/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Mentions légales
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} Quelia. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
