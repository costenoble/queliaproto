
import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = "Rechercher...", count = 0 }) => {
  return (
    <div className="relative w-full max-w-md group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all shadow-sm hover:border-gray-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="absolute -top-3 right-0 -mr-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 shadow-sm border border-indigo-200">
          {count} résultats
        </span>
      </div>
    </div>
  );
};

export default SearchBar;
