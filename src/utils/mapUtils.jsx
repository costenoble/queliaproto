
import React from 'react';
import { Wind, Sun, Factory, Users, MapPin, Zap, Battery, Droplet, CircleDot } from 'lucide-react';

/**
 * Validates if the provided string is a valid Mapbox API key format
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} - True if valid format
 */
export const validateMapboxApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') return false;
  // Mapbox public tokens start with 'pk.' and have at least 20 characters
  return apiKey.startsWith('pk.') && apiKey.length > 20;
};

/**
 * Validates if the provided string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid URL
 */
export const validateJsonUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Converts POI data array to GeoJSON FeatureCollection format
 * @param {Array} data - Array of POI objects
 * @returns {Object} - GeoJSON FeatureCollection
 */
export const convertToGeoJSON = (data) => {
  if (!Array.isArray(data)) {
    // If not array, check if it's already a FeatureCollection
    if (data && data.type === 'FeatureCollection') return data;
    return { type: 'FeatureCollection', features: [] };
  }

  const features = data.map((poi) => {
    if (!poi.lat || !poi.lng) {
      return null;
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(poi.lng), parseFloat(poi.lat)]
      },
      properties: {
        id: poi.id || `poi-${Math.random().toString(36).substr(2, 9)}`,
        name: poi.name || 'Unnamed Location',
        type: poi.type || 'default',
        description: poi.description || '',
        status: poi.status || 'unknown',
        ...poi
      }
    };
  }).filter(Boolean);

  return {
    type: 'FeatureCollection',
    features
  };
};

/**
 * Parses and validates POI data from JSON response
 * @param {Object|Array} jsonData - Raw JSON data
 * @returns {Array} - Parsed POI array
 */
export const parsePOIData = (jsonData) => {
  try {
    if (!jsonData) return [];

    // If data is already an array, return it
    if (Array.isArray(jsonData)) {
      return jsonData;
    }

    // If data has a 'pois' or 'data' property, use that
    if (jsonData.pois && Array.isArray(jsonData.pois)) {
      return jsonData.pois;
    }

    if (jsonData.data && Array.isArray(jsonData.data)) {
      return jsonData.data;
    }

    // If data has a 'features' property (GeoJSON), convert it
    if (jsonData.features && Array.isArray(jsonData.features)) {
      return jsonData.features.map(feature => ({
        id: feature.properties?.id,
        name: feature.properties?.name,
        lat: feature.geometry?.coordinates?.[1],
        lng: feature.geometry?.coordinates?.[0],
        type: feature.properties?.type,
        status: feature.properties?.status,
        description: feature.properties?.description,
        city: feature.properties?.city,
        startDate: feature.properties?.startDate,
        endDate: feature.properties?.endDate,
        capacity: feature.properties?.capacity,
        ...feature.properties
      }));
    }

    console.warn('Unknown JSON structure, returning empty array');
    return [];
  } catch (error) {
    console.error('Error parsing POI data:', error);
    return [];
  }
};

/**
 * Gets color for marker based on energy category
 * @param {string} category - Energy category or legacy type
 * @returns {string} - Hex color code
 */
export const getMarkerColor = (category) => {
  const normalizedType = category?.toLowerCase() || '';
  // New energy categories
  if (normalizedType.includes('solaire') || normalizedType.includes('solar')) return '#f97316'; // Orange
  if (normalizedType.includes('éolien') || normalizedType.includes('wind')) return '#3b82f6'; // Blue
  if (normalizedType.includes('biométhane') || normalizedType.includes('biogas') || normalizedType.includes('méthanisation')) return '#10b981'; // Green
  if (normalizedType.includes('cogénération')) return '#ec4899'; // Pink
  if (normalizedType.includes('hydroélectricité') || normalizedType.includes('hydro')) return '#06b6d4'; // Cyan
  // Legacy types
  if (normalizedType.includes('consultation')) return '#8b5cf6'; // Purple
  if (normalizedType.includes('stockage') || normalizedType.includes('battery')) return '#ef4444'; // Red
  if (normalizedType.includes('ligne') || normalizedType.includes('électrique')) return '#eab308'; // Yellow
  return '#6b7280'; // Default Gray
};

/**
 * Energy categories and their subtypes
 */
export const ENERGY_CATEGORIES = {
  solaire: {
    label: 'Solaire',
    subtypes: [
      { value: 'agri-pv', label: 'Agri-PV' },
      { value: 'ombrières', label: 'Ombrières' },
      { value: 'toiture', label: 'Toiture' },
      { value: 'au sol', label: 'Au sol' },
      { value: 'flottant', label: 'Flottant' }
    ]
  },
  éolien: {
    label: 'Éolien',
    subtypes: [
      { value: 'off shore', label: 'Off shore' },
      { value: 'on shore', label: 'Terrestre' }
    ]
  },
  biométhane: {
    label: 'Biométhane',
    subtypes: []
  },
  'cogénération-électricité': {
    label: 'Cogénération-électricité',
    subtypes: []
  },
  hydroélectricité: {
    label: 'Hydroélectricité',
    subtypes: []
  }
};

/**
 * Power units available
 */
export const POWER_UNITS = ['kW', 'MW', 'Nm3/h'];

/**
 * Equivalent display types
 */
export const EQUIVALENT_TYPES = [
  { value: 'foyers', label: 'Foyers' },
  { value: 'voitures', label: 'Voitures électriques' },
  { value: 'industrie', label: 'Industries' }
];

/**
 * Calculate equivalents based on power
 * @param {number} power - Power value
 * @param {string} unit - Power unit (kW, MW, Nm3/h)
 * @param {string} equivalentType - Type of equivalent (foyers, voitures, industrie)
 * @returns {object} - Calculated equivalent value and label
 */
export const calculateEquivalent = (power, unit, equivalentType) => {
  if (!power || !unit) return null;

  // Convert to MW for calculation
  let powerInMW = power;
  if (unit === 'kW') powerInMW = power / 1000;
  if (unit === 'Nm3/h') powerInMW = power * 0.01; // Approximation for biogas

  const conversions = {
    foyers: { factor: 2000, label: 'foyers alimentés' }, // 1 MW ≈ 2000 foyers
    voitures: { factor: 500, label: 'voitures électriques/an' }, // 1 MW ≈ 500 véhicules
    industrie: { factor: 10, label: 'sites industriels' } // 1 MW ≈ 10 PME
  };

  const conversion = conversions[equivalentType] || conversions.foyers;
  const value = Math.round(powerInMW * conversion.factor);

  return {
    value: value.toLocaleString('fr-FR'),
    label: conversion.label
  };
};

/**
 * Gets status color for badges
 * @param {string} status - Project status
 * @returns {string} - Tailwind class string for badge background
 */
export const getStatusColorClass = (status) => {
  const normalizedStatus = status?.toLowerCase() || '';
  if (normalizedStatus.includes('projet')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (normalizedStatus.includes('exploitation')) return 'bg-green-100 text-green-800 border-green-200';
  // Legacy - pour les données anciennes
  if (normalizedStatus.includes('étude')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (normalizedStatus.includes('construction')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Gets marker SVG string based on energy category
 * @param {string} category - Energy category or legacy type
 * @returns {string} - SVG string
 */
export const getMarkerIconSvg = (category, color) => {
  const normalizedType = category?.toLowerCase() || '';
  let iconPath = '';

  if (normalizedType.includes('solaire')) {
    iconPath = '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (normalizedType.includes('éolien')) {
    iconPath = '<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (normalizedType.includes('biométhane') || normalizedType.includes('méthanisation')) {
    iconPath = '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 18h1M12 18h1M7 18h1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (normalizedType.includes('cogénération')) {
    iconPath = '<path d="M12 2v10l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m12 12-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="18" r="4" stroke="currentColor" stroke-width="2"/>';
  } else if (normalizedType.includes('hydroélectricité') || normalizedType.includes('hydro')) {
    iconPath = '<path d="M12 2v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 22a8 8 0 0 0 8-8c0-4.4-8-10-8-10S4 9.6 4 14a8 8 0 0 0 8 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (normalizedType.includes('consultation')) {
    iconPath = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (normalizedType.includes('stockage')) {
    iconPath = '<rect width="16" height="10" x="2" y="7" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="22" x2="22" y1="11" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (normalizedType.includes('ligne')) {
    iconPath = '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else {
    iconPath = '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide">${iconPath}</svg>`;
};

/**
 * Gets marker component based on energy category (for use in React components)
 * @param {string} category - Energy category or legacy type
 * @param {string} className - Additional CSS classes
 * @returns {React.Component} - Icon component
 */
export const getMarkerIconComponent = (category, className = "") => {
  const normalizedType = category?.toLowerCase() || '';

  if (normalizedType.includes('solaire')) return <Sun className={className} />;
  if (normalizedType.includes('éolien')) return <Wind className={className} />;
  if (normalizedType.includes('biométhane') || normalizedType.includes('méthanisation')) return <Factory className={className} />;
  if (normalizedType.includes('cogénération')) return <CircleDot className={className} />;
  if (normalizedType.includes('hydroélectricité') || normalizedType.includes('hydro')) return <Droplet className={className} />;
  if (normalizedType.includes('consultation')) return <Users className={className} />;
  if (normalizedType.includes('stockage')) return <Battery className={className} />;
  if (normalizedType.includes('ligne')) return <Zap className={className} />;
  return <MapPin className={className} />;
};
