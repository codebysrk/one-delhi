import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Bus, 
  XCircle, 
  MapPinned 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dtcData from './data/dtc_data.json';

// --- Interfaces & Types ---
interface Route {
  id: string;
  name: string;
  stops: string[];
}

// --- Helper Components ---
const TimerPill = React.memo(({ timeLeft }: { timeLeft: number }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-center my-4">
      <div className="bg-white px-5 py-2 rounded-full shadow-sm">
        <span className="text-sm text-gray-800">
          Pay within <span className="font-bold">{formatTime(timeLeft)}</span>
        </span>
      </div>
    </div>
  );
});

const SearchInput = React.memo(({ 
  placeholder, value, onChangeText, onFocus, icon, showClose, onClear, disabled, uppercase 
}: any) => (
  <div className={`flex items-center bg-gray-100 rounded-lg px-3 h-[52px] ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
    <div className="mr-3 text-gray-500 flex-shrink-0">{icon}</div>
    <input
      className={`flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-400 w-full ${uppercase ? 'uppercase' : ''}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      onFocus={onFocus}
      disabled={disabled}
      autoComplete="off"
    />
    {showClose && (
      <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-1 text-gray-400 hover:text-gray-600">
        <XCircle size={20} />
      </button>
    )}
  </div>
));

export default function App() {
  // --- State ---
  const [timeLeft, setTimeLeft] = useState(180);
  const [busType, setBusType] = useState<"AC" | "Non-AC">("AC");
  const [qty, setQty] = useState(1);
  const [baseFare, setBaseFare] = useState(5);

  const [routeSearch, setRouteSearch] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  
  const [activeInput, setActiveInput] = useState<"route" | "source" | "dest" | null>(null);
  
  const [isFareLoading, setIsFareLoading] = useState(false);
  const [isManualFare, setIsManualFare] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [selectedFullRouteId, setSelectedFullRouteId] = useState<string | null>(null);
  
  const [dbRoutes, setDbRoutes] = useState<Route[]>([]);
  const [showToast, setShowToast] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (dtcData && dtcData.routes) {
      setDbRoutes(dtcData.routes as Route[]);
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 || isFareLoading) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isFareLoading, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        resetForm();
      }, 2000);
    }
  }, [timeLeft]);

  const resetForm = useCallback(() => {
    setRouteSearch("");
    setSourceSearch("");
    setDestSearch("");
    setSelectedFullRouteId(null);
    setQty(1);
    setBusType("AC");
    setTimeLeft(180);
    setActiveInput(null);
    setIsManualFare(false);
    setManualTotal("");
  }, []);

  // Calculate Base Fare based on Stop Distance
  useEffect(() => {
    if (isManualFare) return;
    if (routeSearch && sourceSearch && destSearch && selectedFullRouteId) {
      setIsFareLoading(true);
      const foundRoute = dbRoutes.find(r => r.id === selectedFullRouteId);

      if (foundRoute) {
        const srcIdx = foundRoute.stops.indexOf(sourceSearch);
        const dstIdx = foundRoute.stops.indexOf(destSearch);

        if (srcIdx !== -1 && dstIdx !== -1) {
          const stopDiff = Math.abs(dstIdx - srcIdx);
          let newFare = 5;
          if (stopDiff <= 3) newFare = 5;
          else if (stopDiff <= 6) newFare = 10;
          else if (stopDiff <= 10) newFare = 15;
          else newFare = 20;

          setBaseFare(newFare);
          setActiveInput(null);
        }
      }
      setTimeout(() => setIsFareLoading(false), 300); // Simulate network
    } else {
      setBaseFare(5);
    }
  }, [routeSearch, sourceSearch, destSearch, selectedFullRouteId, isManualFare, dbRoutes]);

  const calculateTotal = useCallback(() => {
    const premium = busType === "AC" ? 5 : 0;
    const amount = (baseFare + premium) * qty;
    return (amount * 0.9).toFixed(1);
  }, [baseFare, busType, qty]);

  const handleBuy = useCallback(() => {
    if (!routeSearch || !sourceSearch || !destSearch) {
      alert("Please select route, source and destination stops.");
      return;
    }
    if (isManualFare) {
      const val = Number(manualTotal);
      const min = 5 * qty;
      const max = 25 * qty;
      if (val < min || val > max) {
        alert(`Fare must be between ₹${min} and ₹${max} for ${qty} tickets.`);
        return;
      }
    }
    alert("Ticket Purchased Successfully!");
    resetForm();
  }, [routeSearch, sourceSearch, destSearch, qty, isManualFare, manualTotal, resetForm]);

  // --- Search / Filters ---
  const filteredRoutes = useMemo(() => {
    if (activeInput !== "route") return [];
    if (!routeSearch) return dbRoutes;

    const searchLower = routeSearch.toLowerCase();
    return dbRoutes.filter(
      (r) => r.id.toLowerCase().startsWith(searchLower) || r.name.toLowerCase().includes(searchLower)
    );
  }, [routeSearch, activeInput, dbRoutes]);

  const currentRouteStops = useMemo(() => {
    if (selectedFullRouteId) {
      const found = dbRoutes.find((r) => r.id === selectedFullRouteId);
      if (found) return found.stops;
    }
    return [];
  }, [selectedFullRouteId, dbRoutes]);

  const filteredSources = useMemo(() => {
    if (activeInput !== "source") return [];
    if (!sourceSearch) return currentRouteStops;
    const searchLower = sourceSearch.toLowerCase();
    return currentRouteStops.filter((s) => s.toLowerCase().includes(searchLower));
  }, [sourceSearch, activeInput, currentRouteStops]);

  const filteredDests = useMemo(() => {
    if (activeInput !== "dest") return [];
    let stopsToFilter = currentRouteStops;
    if (sourceSearch) {
      const sourceIdx = currentRouteStops.indexOf(sourceSearch);
      if (sourceIdx !== -1) {
        stopsToFilter = currentRouteStops.slice(sourceIdx + 1);
      }
    }
    stopsToFilter = stopsToFilter.filter((s) => s !== sourceSearch);
    if (!destSearch) return stopsToFilter;
    const searchLower = destSearch.toLowerCase();
    return stopsToFilter.filter((s) => s.toLowerCase().includes(searchLower));
  }, [destSearch, activeInput, currentRouteStops, sourceSearch]);

  const handleSelectRoute = (item: Route) => {
    const displayId = item.id.replace(/UP$|DOWN$/, "");
    const destination = item.stops[item.stops.length - 1];
    setRouteSearch(`${displayId} - ${destination}`);
    setSelectedFullRouteId(item.id);
    setSourceSearch("");
    setDestSearch("");
    setActiveInput("source");
  };

  const handleSelectSource = (stop: string) => {
    setSourceSearch(stop);
    setDestSearch("");
    setActiveInput("dest");
  };

  const handleSelectDest = (stop: string) => {
    setDestSearch(stop);
    setActiveInput(null);
  };

  const isReady = routeSearch && sourceSearch && destSearch && (!isManualFare || manualTotal.length > 0);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex justify-center lg:items-center">
      <div className="w-full max-w-md bg-[#D32F2F] h-[100dvh] lg:h-[850px] lg:rounded-[2.5rem] lg:shadow-2xl relative flex flex-col overflow-hidden shadow-black/20">
        
        {/* Fixed Background for iOS styling */}
        <div className="absolute inset-0 bg-[#D32F2F] pointer-events-none" />

        {/* Header */}
        <header className="relative z-10 flex items-center px-4 h-16 text-white pt-2">
          <button className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="flex-1 text-center text-xl font-semibold pr-8">Buy tickets</h1>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 flex flex-col pt-2 pb-[240px] overflow-y-auto custom-scrollbar">
          
          {/* Backdrop for closing dropdowns when clicking outside */}
          {activeInput && (
            <div 
              className="fixed inset-0 z-40 lg:absolute lg:rounded-[2.5rem]"
              onClick={() => setActiveInput(null)} 
            />
          )}

          <TimerPill timeLeft={timeLeft} />

          <div className="px-4 relative">
            <div className="bg-white rounded-2xl p-4 shadow-xl mb-4">
              
              {/* Route Input */}
              <div className={`mb-4 relative ${activeInput === 'route' ? 'z-[100]' : 'z-20'}`}>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Route Info</label>
                <div 
                  className="relative" 
                  onClick={() => !activeInput && setActiveInput('route')}
                >
                  <SearchInput
                    placeholder="Current Route"
                    value={routeSearch}
                    onChangeText={(val: string) => {
                       setRouteSearch(val);
                       setActiveInput('route');
                       if(!val) setSelectedFullRouteId(null);
                    }}
                    onFocus={() => setActiveInput("route")}
                    icon={<MapPinned size={22} className="text-gray-900" />}
                    showClose={routeSearch.length > 0}
                    onClear={() => {
                      setRouteSearch("");
                      setSelectedFullRouteId(null);
                      setSourceSearch("");
                      setDestSearch("");
                      setActiveInput("route");
                    }}
                    uppercase
                  />
                  
                  {/* Dropdown for Routes */}
                  <AnimatePresence>
                    {activeInput === "route" && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-72 overflow-y-auto z-50 py-2"
                      >
                        {filteredRoutes.length > 0 ? filteredRoutes.map((route, idx) => (
                          <div 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); handleSelectRoute(route); }}
                            className="p-3 border-b border-gray-100 last:border-0 hover:bg-red-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Bus size={18} className="text-[#D32F2F]" />
                              <span className="font-bold text-lg text-gray-900">{route.id.replace(/UP$|DOWN$/, "")}</span>
                            </div>
                            <div className="flex items-start pl-1 gap-3">
                              <div className="flex flex-col items-center mt-1">
                                <div className="w-2.5 h-2.5 rounded-full border-2 border-[#D32F2F]" />
                                <div className="w-0.5 h-4 bg-[#D32F2F] my-0.5" />
                                <div className="w-2.5 h-2.5 rounded-full border-2 border-[#D32F2F]" />
                              </div>
                              <div className="flex flex-col gap-1 text-sm font-medium text-gray-500">
                                <span>{route.stops[0]}</span>
                                <span>{route.stops[route.stops.length - 1]}</span>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="p-4 text-center text-gray-400 font-medium text-sm">No routes found</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Source / Dest Inputs */}
              <div className={`mb-5 relative ${activeInput === 'source' || activeInput === 'dest' ? 'z-[100]' : 'z-10'}`}>
                <label className="block text-sm font-semibold text-gray-900 mb-2">From - To</label>
                
                {/* Source */}
                <div className="relative mb-3">
                  <SearchInput
                    placeholder="Source Stop"
                    value={sourceSearch}
                    onChangeText={(val: string) => { setSourceSearch(val); setActiveInput('source'); }}
                    onFocus={() => { if (selectedFullRouteId) setActiveInput("source"); }}
                    icon={<div className="w-3.5 h-3.5 rounded-full bg-black ml-1" />}
                    showClose={sourceSearch.length > 0}
                    onClear={() => { setSourceSearch(""); setDestSearch(""); setActiveInput("source"); }}
                    disabled={!selectedFullRouteId}
                  />
                  <AnimatePresence>
                    {activeInput === "source" && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto z-50 py-1"
                      >
                        {filteredSources.length > 0 ? filteredSources.map((stop, idx) => (
                          <div 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); handleSelectSource(stop); }}
                            className="flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer text-gray-800 font-medium text-sm"
                          >
                            <MapPin size={16} className="text-gray-400" />
                            {stop}
                          </div>
                        )) : (
                          <div className="p-4 text-center text-gray-400 text-sm">{selectedFullRouteId ? "No stops found" : "Please select a route first"}</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Destination */}
                <div className="relative">
                  <SearchInput
                    placeholder="Destination Stop"
                    value={destSearch}
                    onChangeText={(val: string) => { setDestSearch(val); setActiveInput('dest'); }}
                    onFocus={() => sourceSearch && setActiveInput("dest")}
                    icon={<MapPin size={22} className="text-gray-900" />}
                    showClose={destSearch.length > 0}
                    onClear={() => { setDestSearch(""); setActiveInput("dest"); }}
                    disabled={!selectedFullRouteId || !sourceSearch}
                  />
                  <AnimatePresence>
                    {activeInput === "dest" && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto z-50 py-1"
                      >
                        {filteredDests.length > 0 ? filteredDests.map((stop, idx) => (
                          <div 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); handleSelectDest(stop); }}
                            className="flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer text-gray-800 font-medium text-sm"
                          >
                            <MapPin size={16} className="text-gray-400" />
                            {stop}
                          </div>
                        )) : (
                          <div className="p-4 text-center text-gray-400 text-sm">No stops found</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Bus Type Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Bus Type</label>
                <div className="flex gap-3">
                  {["AC", "Non-AC"].map((type) => (
                    <button
                      key={type}
                      onClick={() => { setBusType(type as any); setIsManualFare(false); }}
                      className={`px-5 py-2.5 rounded-lg border font-medium transition-all ${
                        busType === type
                          ? type === "AC"
                            ? "bg-[#D32F2F] border-[#D32F2F] text-white shadow-md"
                            : "bg-[#4CAF50] border-[#4CAF50] text-white shadow-md"
                          : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* Bottom Sticky Payment Card */}
        <div className="absolute bottom-0 left-0 right-0 bg-white p-5 rounded-t-[1.5rem] lg:rounded-b-[2.5rem] shadow-[0_-8px_20px_rgba(0,0,0,0.12)] z-30 pb-safe">
          <label className="block text-[15px] font-semibold text-gray-900 mb-3">Number of tickets</label>
          <div className="flex gap-4 mb-5">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => {
                  if (isManualFare && manualTotal) {
                    const oldTotal = Number(manualTotal) || 0;
                    const newTotal = (oldTotal / qty) * n;
                    setManualTotal(newTotal.toFixed(1).toString());
                  }
                  setQty(n);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-xl border text-lg font-semibold transition-all ${
                  qty === n
                    ? "bg-[#D32F2F] border-[#D32F2F] text-white shadow-md"
                    : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-end mb-4 min-h-[50px]">
            <div className="flex-1">
              <label className="block text-[15px] font-semibold text-gray-900 mb-1">Amount Payable</label>
              {routeSearch && sourceSearch && destSearch ? (
                <div 
                  className="cursor-pointer group"
                  onDoubleClick={() => {
                    setIsManualFare(true);
                    const originalTotal = (baseFare + (busType === "AC" ? 5 : 0)) * qty;
                    setManualTotal(originalTotal.toFixed(1));
                  }}
                  title="Double click to enter manual fare"
                >
                  {isManualFare ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border-b-2 border-gray-400 pb-0.5">
                        <span className="text-2xl font-medium text-gray-600">₹</span>
                        <input
                          autoFocus
                          type="number"
                          className="w-16 text-2xl font-medium text-gray-600 bg-transparent outline-none ml-1"
                          value={manualTotal}
                          onChange={(e) => setManualTotal(e.target.value)}
                          onBlur={() => {
                            const val = Number(manualTotal);
                            const min = 5 * qty;
                            const max = 25 * qty;
                            if (val < min) setManualTotal(min.toFixed(1));
                            else if (val > max) setManualTotal(max.toFixed(1));
                            if (!manualTotal) setIsManualFare(false);
                          }}
                        />
                      </div>
                      <span className="text-2xl font-bold text-[#D32F2F]">
                        ₹{((Number(manualTotal) || 0) * 0.9).toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-medium text-gray-500 line-through">
                        ₹{((baseFare + (busType === "AC" ? 5 : 0)) * qty).toFixed(1)}
                      </span>
                      <span className="text-2xl font-bold text-[#D32F2F]">₹{calculateTotal()}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            {routeSearch && sourceSearch && destSearch && !isFareLoading && (
              <div className="bg-[#11C76A] px-3 py-1.5 rounded-lg shadow-sm">
                <span className="text-white text-sm font-semibold tracking-wide">10.0% off</span>
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: isReady ? 0.97 : 1 }}
            disabled={!isReady || isFareLoading}
            onClick={handleBuy}
            className={`w-full py-4 rounded-xl flex items-center justify-center transition-colors ${
              !isReady || isFareLoading ? "bg-gray-400 opacity-80 cursor-not-allowed" : "bg-[#D32F2F] hover:bg-red-700 shadow-lg"
            }`}
          >
            <span className="text-white font-bold tracking-widest text-lg">BUY</span>
          </motion.button>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-5 py-2.5 rounded-full z-[9999] text-sm font-medium shadow-xl whitespace-nowrap"
            >
              Session expired
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
