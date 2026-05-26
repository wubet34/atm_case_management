import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Phone, Mail, Building, User, X } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

// Coordinates for districts in Addis Ababa
const districtCoordinates = {
  'Bole': { lat: 9.0057, lng: 38.7636, address: 'Bole Road, near Edna Mall' },
  'Kirkos': { lat: 9.0207, lng: 38.7669, address: 'Kirkos Sub-city, near Meskel Square' },
  'Yeka': { lat: 9.0333, lng: 38.7833, address: 'Yeka Sub-city, near Wollo Sefer' },
  'Gulele': { lat: 9.0500, lng: 38.7500, address: 'Gulele Sub-city, near Entoto' },
  'Kolfe': { lat: 9.0333, lng: 38.7167, address: 'Kolfe Keranio, near Ring Road' },
  'Addis Ketema': { lat: 9.0389, lng: 38.7528, address: 'Addis Ketema, near Merkato' },
  'Nifas Silk': { lat: 8.9833, lng: 38.7833, address: 'Nifas Silk Lafto, near Stadium' },
  'Lideta': { lat: 9.0050, lng: 38.7500, address: 'Lideta Sub-city, near Mexico Square' },
  'Arada': { lat: 9.0300, lng: 38.7500, address: 'Arada Sub-city, near Piassa' }
};

const CaseMap = ({ caseItem, onClose }) => {
  const { darkMode } = useDarkMode();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [location, setLocation] = useState(null);
  const [staticMapUrl, setStaticMapUrl] = useState('');

  useEffect(() => {
    if (caseItem && caseItem.district) {
      // Get coordinates for the case location
      const coords = districtCoordinates[caseItem.district] || districtCoordinates['Bole'];
      setLocation(coords);
      
      // Create a static map URL using OpenStreetMap (free, no API key needed)
      const mapUrl = `https://tile.openstreetmap.org/static/${coords.lat},${coords.lng},15/600x300.png`;
      setStaticMapUrl(mapUrl);
      setMapLoaded(true);
    }
  }, [caseItem]);

  const getDirectionsUrl = () => {
    if (!location) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
  };

  const getOpenStreetMapUrl = () => {
    if (!location) return '#';
    return `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=15/${location.lat}/${location.lng}`;
  };

  if (!caseItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${darkMode ? 'dark' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Case Location</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {caseItem.caseId || caseItem.case_id} - {caseItem.atmName || caseItem.atm_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Case Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">ATM Location</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {caseItem.atmName || caseItem.atm_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {caseItem.district} Sub-city, {caseItem.branch}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Full Address</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {location?.address || 'Address not available'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Bank</p>
              <p className="text-sm text-gray-900 dark:text-white">{caseItem.bank}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Case Type</p>
              <p className="text-sm text-gray-900 dark:text-white">{caseItem.caseType || caseItem.case_type}</p>
            </div>
          </div>

          {/* Map Visualization */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-orange-500" />
              Location Map
            </h3>
            
            {mapLoaded && location && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                {/* OpenStreetMap Static Image (Free, no API key needed) */}
                <img
                  src={staticMapUrl}
                  alt="Case Location Map"
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/600x300?text=Map+Location:+${caseItem.district}+District`;
                  }}
                />
                
                {/* Map Info Overlay */}
                <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-red-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {caseItem.district} District, {caseItem.branch}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={getDirectionsUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors"
                      >
                        <Navigation size={14} />
                        Directions
                      </a>
                      <a
                        href={getOpenStreetMapUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                      >
                        <MapPin size={14} />
                        Open Map
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Assigned Technician</p>
              <div className="flex items-center gap-2">
                <User size={14} className="text-orange-500" />
                <span className="text-sm text-gray-900 dark:text-white">
                  {caseItem.technician || 'Not assigned yet'}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Status Information</p>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Status: {caseItem.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400 mb-2 font-semibold">Emergency Contacts</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-green-500" />
                <span className="text-sm text-gray-900 dark:text-white">+251-911-234567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-blue-500" />
                <span className="text-sm text-gray-900 dark:text-white">support@atmcase.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Building size={14} className="text-purple-500" />
                <span className="text-sm text-gray-900 dark:text-white">24/7 Support Center</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseMap;