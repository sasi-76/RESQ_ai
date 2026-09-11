import { useState } from 'react';
import { Building2, BedDouble, Truck, Heart, MapPin, Ambulance, X, Phone, Navigation, Clock } from 'lucide-react';
import { hospitals } from '../data/mockData';

function Hospitals() {
  const [selectedHospital, setSelectedHospital] = useState(null);

  const totalHospitals = hospitals.length;
  const totalFreeBeds = hospitals.reduce((sum, h) => sum + h.freeBeds, 0);
  const totalAmbulances = hospitals.reduce((sum, h) => sum + h.ambulances, 0);
  const emergencyReady = hospitals.filter(h => h.emergency).length;

  const handleDetailsClick = (hospital) => {
    console.log('🏥 Opening details for:', hospital.name);
    setSelectedHospital(hospital);
  };

  const handleCallAmbulance = (hospital) => {
    console.log('🚑 Calling ambulance from:', hospital.name);
    alert(`🚑 Ambulance Dispatched!\n\nFrom: ${hospital.name}\nAvailable: ${hospital.ambulances} ambulances\nETA: ${Math.ceil((hospital.distance / 40) * 60)} minutes`);
  };

  const handleGetDirections = (hospital) => {
    console.log('🗺️ Getting directions to:', hospital.name);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Building2 className="h-7 w-7 text-blue-400" />
          Hospitals & Medical Support
        </h2>
        <p className="text-sm text-slate-400 mt-1">Within Radius · Controller View</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-blue-500/10 rounded-xl p-3">
            <Building2 className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalHospitals}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Hospitals</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-green-500/10 rounded-xl p-3">
            <BedDouble className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalFreeBeds}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Available Beds</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-purple-500/10 rounded-xl p-3">
            <Truck className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalAmbulances}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Ambulances</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-red-500/10 rounded-xl p-3">
            <Heart className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{emergencyReady}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Emergency Ready</p>
          </div>
        </div>
      </div>

      {/* Hospitals Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hospital Name</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Free Beds</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Beds</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Distance</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ambulances</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital, idx) => {
                const occupancyPercent = ((hospital.totalBeds - hospital.freeBeds) / hospital.totalBeds) * 100;
                const bedIndicatorColor = hospital.freeBeds > 50 ? '#22c55e' : hospital.freeBeds > 20 ? '#eab308' : '#ef4444';

                return (
                  <tr key={hospital.id} className={`border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors ${idx % 2 === 0 ? 'bg-slate-800/10' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Building2 className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{hospital.name}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span>{hospital.distance} km</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bedIndicatorColor }} />
                        <span className="text-sm font-bold text-white">{hospital.freeBeds}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div>
                        <span className="text-sm font-medium text-slate-300">{hospital.totalBeds}</span>
                        <div className="w-24 mx-auto mt-1 bg-slate-700/50 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${occupancyPercent}%`, backgroundColor: bedIndicatorColor }} />
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                        {hospital.type}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span className="text-sm text-slate-300">{hospital.distance} km</span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Ambulance className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-bold text-white">{hospital.ambulances}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                        </span>
                        <span className="text-xs font-medium text-green-400">{hospital.status}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDetailsClick(hospital)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setSelectedHospital(null)}
        >
          <div
            className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-6 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedHospital.name}</h3>
                  <p className="text-sm text-slate-400">{selectedHospital.type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHospital(null)}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
              >
                <X className="h-6 w-6 text-slate-400 hover:text-red-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Card */}
              <div className="glass-card p-4 border-l-4 border-l-green-500 bg-green-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                  </span>
                  <span className="text-sm font-bold text-green-400 uppercase">{selectedHospital.status}</span>
                </div>
                <p className="text-xs text-slate-400">Hospital is operational and accepting patients</p>
              </div>

              {/* Capacity Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <BedDouble className="h-5 w-5 text-green-400" />
                    <span className="text-xs text-slate-500 uppercase">Available Beds</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{selectedHospital.freeBeds}</p>
                  <p className="text-xs text-slate-400 mt-1">of {selectedHospital.totalBeds} total</p>
                  <div className="w-full mt-2 bg-slate-700/50 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(selectedHospital.freeBeds / selectedHospital.totalBeds) * 100}%`,
                        backgroundColor: selectedHospital.freeBeds > 50 ? '#22c55e' : selectedHospital.freeBeds > 20 ? '#eab308' : '#ef4444'
                      }}
                    />
                  </div>
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Ambulance className="h-5 w-5 text-red-400" />
                    <span className="text-xs text-slate-500 uppercase">Ambulances</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{selectedHospital.ambulances}</p>
                  <p className="text-xs text-slate-400 mt-1">Available now</p>
                </div>
              </div>

              {/* Location Info */}
              <div className="glass-card p-4">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-400" />
                  Location Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="text-slate-300 font-mono">
                      {selectedHospital.lat.toFixed(3)}, {selectedHospital.lng.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Distance:</span>
                    <span className="text-slate-300 font-semibold">{selectedHospital.distance} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Est. Travel Time:</span>
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.ceil((selectedHospital.distance / 40) * 60)} minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency Info */}
              {selectedHospital.emergency && (
                <div className="glass-card p-4 border-l-4 border-l-red-500 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-red-400" />
                    <span className="text-sm font-bold text-red-400">24/7 Emergency Services</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    This facility provides round-the-clock emergency care with trauma specialists and ICU support.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCallAmbulance(selectedHospital)}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Ambulance className="h-5 w-5" />
                  Call Ambulance
                </button>
                <button
                  onClick={() => handleGetDirections(selectedHospital)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Navigation className="h-5 w-5" />
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hospitals;
