"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import exifr from 'exifr';
import imageCompression from 'browser-image-compression'; 

// --- TRANSLATIONS ---
const translations = {
  en: {
    dashboard: "Dashboard",
    logout: "Logout",
    logoutConfirm: "Are you sure you want to logout?",
    driverName: "Driver Name",
    namaste: "Namaste",
    selectTask: "Select your current task below",
    startTrip: "Start New Trip",
    startTripSub: "Fill loading point & material",
    officeReturn: "Office Return",
    officeReturnSub: "Fill Expenses & Trip Closure",
    running: "Currently Running...",
    waiting: "Waiting to start",
    loadingEntry: "🚛 LOADING ENTRY",
    expenseEntry: "💰 Expense Entry",
    cancel: "← CANCEL",
    vehicleNo: "Vehicle Number",
    from: "LOADING FROM",
    to: "UNLOADING TO",
    material: "Material Name",
    partyName: "Party Name",
    totalKm: "Total KM",
    diesel: "Diesel RS",
    bhatta: "Bhatta RS",
    rto: "RTO RS",
    toll: "Toll RS",
    otherExp: "Other Exp",
    partyPhone: "Party Phone",
    driverBal: "Driver Bal.",
    clickPhoto: "📸 Click Cargo Photo",
    save: "COMPLETE & SEND TO OFFICE",
    saving: "SAVING...",
    verifying: "Verifying Trip Status...",
    gpsBlocked: "GPS Is Blocked",
    refresh: "I turned it on - Refresh",
    errMobile: "❌ Mobile number must be 10 digits",
    errVehicle: "❌ Invalid Vehicle Number! (e.g. MH09CP9345)"
  },
  hi: {
    dashboard: "डैशबोर्ड",
    logout: "लॉगआउट",
    logoutConfirm: "क्या आप वाकई लॉगआउट करना चाहते हैं?",
    driverName: "ड्राइवर का नाम",
    namaste: "नमस्ते",
    selectTask: "नीचे अपना कार्य चुनें",
    startTrip: "नई यात्रा शुरू करें",
    startTripSub: "लोडिंग पॉइंट और माल भरें",
    officeReturn: "ऑफिस वापसी",
    officeReturnSub: "खर्च और यात्रा समाप्ति भरें",
    running: "अभी चल रहा है...",
    waiting: "शुरू होने की प्रतीक्षा",
    loadingEntry: "🚛 लोडिंग एंट्री",
    expenseEntry: "💰 खर्च एंट्री",
    cancel: "← रद्द करें",
    vehicleNo: "गाड़ी नंबर",
    from: "कहाँ से लोड किया",
    to: "कहाँ खाली होगा",
    material: "माल का नाम",
    partyName: "पार्टी का नाम",
    totalKm: "कुल किलोमीटर",
    diesel: "डीजल खर्च",
    bhatta: "भत्ता",
    rto: "RTO खर्च",
    toll: "टोल खर्च",
    otherExp: "अन्य खर्च",
    partyPhone: "पार्टी फोन",
    driverBal: "ड्राइवर बैलेंस",
    clickPhoto: "📸 फोटो खींचे",
    save: "पूरा करें और ऑफिस भेजें",
    saving: "सेव हो रहा है...",
    verifying: "स्टेटस की जाँच हो रही है...",
    gpsBlocked: "GPS बंद है",
    refresh: "मैंने चालू कर दिया - रिफ्रेश करें",
    errMobile: "❌ मोबाइल नंबर 10 अंकों का होना चाहिए",
    errVehicle: "❌ गाड़ी नंबर गलत है! (उदा. MH09CP9345)"
  },
  mr: {
    dashboard: "डॅशबोर्ड",
    logout: "लॉगआउट",
    logoutConfirm: "तुम्हाला खात्री आहे की तुम्ही लॉगआउट करू इच्छिता?",
    driverName: "ड्रायव्हरचे नाव",
    namaste: "नमस्ते",
    selectTask: "खालीलपैकी तुमचे काम निवडा",
    startTrip: "नवीन ट्रिप सुरू करा",
    startTripSub: "लोडिंग आणि मालाची माहिती भरा",
    officeReturn: "ऑफिस परतावा",
    officeReturnSub: "खर्च आणि ट्रिप समाप्ती भरा",
    running: "सध्या सुरू आहे...",
    waiting: "सुरू होण्याची प्रतीक्षा",
    loadingEntry: "🚛 लोडिंग एन्ट्री",
    expenseEntry: "💰 खर्चाची एन्ट्री",
    cancel: "← रद्द करा",
    vehicleNo: "गाडी नंबर",
    from: "कोठून भरले (Loading)",
    to: "कोठे खाली करणार (Unloading)",
    material: "मालाचे नाव",
    partyName: "पार्टीचे नाव",
    totalKm: "एकूण किलोमीटर",
    diesel: "डिझेल खर्च",
    bhatta: "भत्ता",
    rto: "RTO खर्च",
    toll: "टोल खर्च",
    otherExp: "इतर खर्च",
    partyPhone: "पार्टी फोन",
    driverBal: "ड्रायव्हर बॅलन्स",
    clickPhoto: "📸 फोटो काढा",
    save: "पूर्ण करा आणि ऑफिसला पाठवा",
    saving: "सेव्ह होत आहे...",
    verifying: "स्थिती तपासत आहे...",
    gpsBlocked: "GPS बंद आहे",
    refresh: "मी चालू केले - रिफ्रेश करा",
    errMobile: "❌ मोबाईल नंबर 10 अंकी असावा",
    errVehicle: "❌ गाडी नंबर चुकीचा आहे! (उदा. MH09CP9345)"
  }
};

export default function EmployeeDashboard() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'menu' | 'loading' | 'expenses'>('menu');
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [showSettingsHelper, setShowSettingsHelper] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');

  const router = useRouter();
  const t = translations[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem('appLang') as any;
    if (savedLang) setLang(savedLang);

    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!savedUser.username) {
      router.push('/login');
      return;
    }
    setUser(savedUser);

    const verifyStatus = async () => {
      setIsCheckingStatus(true); // Keep screen locked until check is finished
      try {
        const res = await fetch(`https://gk-backend-two.vercel.app/api/check-active-trip/${savedUser.id}`);
        const data = await res.json();
        
        if (data.active && data.tripId) {
          setActiveTripId(data.tripId);
          localStorage.setItem('activeTripId', data.tripId);
        } else {
          setActiveTripId(null);
          localStorage.removeItem('activeTripId');
        }
      } catch (err) {
        console.error("Database check failed", err);
        const savedTrip = localStorage.getItem('activeTripId');
        if (savedTrip) setActiveTripId(savedTrip);
      } finally {
        // Small delay to ensure state updates before removing loading screen
        setTimeout(() => setIsCheckingStatus(false), 500);
      }
    };

    verifyStatus();
  }, [router]);

  const changeLanguage = (l: 'en' | 'hi' | 'mr') => {
    setLang(l);
    localStorage.setItem('appLang', l);
  };

  const handleLogout = () => {
    if (confirm(t.logoutConfirm)) {
      localStorage.removeItem('user');
      localStorage.removeItem('activeTripId');
      router.push('/login');
    }
  };

  const handleImageCompression = async (file: File) => {
    const options = {
      maxSizeMB: 0.5, // Reduced for mobile performance and server limits
      maxWidthOrHeight: 1024, // Reduced resolution for faster upload
      useWebWorker: true,
      initialQuality: 0.7 
    };
    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error("Compression error:", error);
      return file;
    }
  };

  const stampImage = async (file: File, locationName: string): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const fontSize = Math.floor(canvas.width * 0.035);
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          
          const timeText = `📅 DATE: ${new Date().toLocaleString()}`;
          const locText = `📍 LOC: ${locationName}`;

          const stripHeight = fontSize * 4.5;
          ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
          ctx.fillRect(0, canvas.height - stripHeight, canvas.width, stripHeight);

          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 4;
          
          ctx.fillText(timeText, 30, canvas.height - (fontSize * 2.5));
          ctx.fillText(locText, 30, canvas.height - (fontSize * 0.8));

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: file.type }));
            } else {
              resolve(file);
            }
          }, file.type, 0.8); // Slightly lower quality for smaller file size
        };
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (view === 'loading') {
        const vNo = (e.currentTarget.elements.namedItem('vehicleNo') as HTMLInputElement).value;
        const vRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
        if (!vRegex.test(vNo.replace(/\s|-/g, "").toUpperCase())) {
            alert(t.errVehicle);
            return;
        }
    }

    if (view === 'expenses') {
        const mobile = (e.currentTarget.elements.namedItem('party_number') as HTMLInputElement).value;
        const mobileRegex = /^[0-9]{10}$/;
        if (mobile && !mobileRegex.test(mobile)) {
            alert(t.errMobile);
            return;
        }
    }

    setLoading(true);
    setStatusText(t.saving); 
    const formData = new FormData(e.currentTarget);

    const today = new Date().toISOString().split('T')[0];
    if (view === 'loading') {
      formData.append('loading_date', today);
    } else {
      formData.append('unloading_date', today);
    }

    const processSubmission = async () => {
      const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
      const originalFile = fileInput?.files?.[0];
      
      let finalLat = "0";
      let finalLng = "0";
      let photoTime = new Date().toISOString(); 
      let addressLabel = "Location not detected"; 

      if (originalFile) {
        try {
          setStatusText("Optimizing Image...");
          const file = await handleImageCompression(originalFile);

          setStatusText("Checking Photo GPS..."); 
          const meta = await exifr.gps(file);
          const timestamp = await exifr.parse(file, ['DateTimeOriginal']);
          
          if (meta) {
            finalLat = meta.latitude.toFixed(6);
            finalLng = meta.longitude.toFixed(6);
          } else {
            setStatusText("🛰️ Fetching Live GPS..."); 
            const pos: any = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                   setShowSettingsHelper(true);
                }
                reject(error);
              }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
            });
            finalLat = pos.coords.latitude.toFixed(6);
            finalLng = pos.coords.longitude.toFixed(6);
          }

          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalLat}&lon=${finalLng}&accept-language=en`);
            const geoData = await geoRes.json();
            addressLabel = geoData.display_name || `Lat: ${finalLat}, Lng: ${finalLng}`;
          } catch (e) {
            addressLabel = `Lat: ${finalLat}, Lng: ${finalLng}`;
          }

          if (timestamp?.DateTimeOriginal) {
             photoTime = new Date(timestamp.DateTimeOriginal).toISOString();
          }

          if (finalLat === "0" || finalLng === "0") {
             throw new Error("GPS_SIGNAL_LOST");
          }

          setStatusText("Stamping Photo..."); 
          const stampedFile = await stampImage(file, addressLabel);
          formData.set('photo', stampedFile); 

        } catch (err) {
          setLoading(false);
          setStatusText(""); 
          return; 
        }
      }

      const cleanTime = new Date(photoTime).toISOString().slice(0, 19).replace('T', ' ');
      formData.append('locName', addressLabel);
      formData.append('captureTime', cleanTime); 
      formData.append('empId', user.id);
      formData.append('empName', user.full_name);
      
      const endpoint = view === 'loading' ? '/api/start-trip' : '/api/complete-trip';
      const currentTripId = activeTripId || localStorage.getItem('activeTripId');
      
      if (currentTripId) formData.append('tripId', currentTripId);

      try {
        setStatusText("Uploading..."); 
        const res = await fetch(`https://gk-backend-two.vercel.app${endpoint}`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (res.ok) {
          if (view === 'loading') {
            setActiveTripId(data.tripId);
            localStorage.setItem('activeTripId', data.tripId);
            alert("✅ Success!");
            setView('menu');
          } else {
            alert("✅ Finished!");
            localStorage.removeItem('activeTripId');
            setActiveTripId(null);
            setView('menu');
          }
        } else {
          alert("❌ Error: " + data.message);
        }
      } catch (err) {
        alert("❌ Server Error.");
      } finally {
        setLoading(false);
        setStatusText(""); 
      }
    };

    processSubmission();
  };

  if (!user || isCheckingStatus) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <div className="font-bold text-slate-500 uppercase tracking-widest text-xs">
              {t.verifying}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {showSettingsHelper && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1001] flex items-center justify-center p-6 text-center">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl">
               <div className="text-4xl mb-4">📍</div>
               <h2 className="text-xl font-black text-slate-900 uppercase italic">{t.gpsBlocked}</h2>
               <button onClick={() => window.location.reload()} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">
                 {t.refresh}
               </button>
            </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black uppercase tracking-widest text-sm italic">{statusText}</p>
        </div>
      )}

      <div className="w-full md:w-64 bg-slate-900 text-white p-5 md:p-6 shadow-xl z-10 flex flex-col">
        <div className="flex justify-between items-center md:block">
          <h1 className="text-xl font-black text-orange-500 uppercase italic tracking-tighter">Ganesh Enterprises</h1>
          <div className="flex gap-2">
            <select 
                value={lang} 
                onChange={(e) => changeLanguage(e.target.value as any)}
                className="bg-slate-800 text-[10px] font-bold border-none rounded-lg px-2 focus:ring-0"
            >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="mr">मराठी</option>
            </select>
            <button onClick={handleLogout} className="text-[10px] bg-red-600 px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest">{t.logout}</button>
          </div>
        </div>
        
        <div className="mt-6 hidden md:block border-t border-slate-700 pt-6">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{t.driverName}</p>
          <p className="text-lg font-bold text-white leading-tight">{user.full_name}</p>
        </div>

        <nav className="mt-8 hidden md:flex flex-col flex-1 space-y-2">
          <button onClick={() => setView('menu')} className={`w-full text-left p-4 rounded-xl font-bold transition ${view === 'menu' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{t.dashboard}</button>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-8">
        {view === 'menu' ? (
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 uppercase italic">{t.namaste}, {user.full_name.split(' ')[0]}!</h2>
                <p className="text-slate-500 text-sm font-medium">{t.selectTask}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => !activeTripId && setView('loading')}
                className={`group relative p-8 rounded-3xl shadow-sm border-2 transition-all duration-300 ${activeTripId ? 'bg-slate-100 border-slate-200 opacity-50 grayscale cursor-not-allowed' : 'bg-white border-white hover:border-orange-500 hover:shadow-xl active:scale-95 cursor-pointer'}`}
              >
                <div className="bg-orange-100 text-orange-600 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition">🚛</div>
                <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">{t.startTrip}</h3>
                <p className="text-slate-500 text-xs mt-1 font-medium italic">{t.startTripSub}</p>
                {activeTripId && <div className="mt-4 inline-block bg-red-100 text-red-600 text-[10px] px-3 py-1 rounded-full font-black uppercase">{t.running}</div>}
              </div>

              <div
                onClick={() => activeTripId && setView('expenses')}
                className={`group relative p-8 rounded-3xl shadow-sm border-2 transition-all duration-300 ${!activeTripId ? 'bg-slate-100 border-slate-200 opacity-50 grayscale cursor-not-allowed' : 'bg-white border-white hover:border-green-500 hover:shadow-xl active:scale-95 cursor-pointer'}`}
              >
                <div className="bg-green-100 text-green-600 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition">💰</div>
                <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">{t.officeReturn}</h3>
                <p className="text-slate-500 text-xs mt-1 font-medium italic">{t.officeReturnSub}</p>
                {!activeTripId && <div className="mt-4 inline-block bg-slate-200 text-slate-500 text-[10px] px-3 py-1 rounded-full font-black uppercase">{t.waiting}</div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">
                {view === 'loading' ? t.loadingEntry : t.expenseEntry}
              </h2>
              <button onClick={() => setView('menu')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 px-3 py-1 rounded-full hover:bg-white transition">{t.cancel}</button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-5 md:p-8 space-y-4 border border-slate-100">
              {view === 'loading' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{t.vehicleNo}</label>
                    <input name="vehicleNo" placeholder="MH09CP9345" required className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-400 outline-none text-base font-bold uppercase" />
                  </div>
                  
                  {/* Updated Side-by-Side Layout */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{t.from}</label>
                      <input 
                        name="loading" 
                        placeholder="e.g. Pune, MH" 
                        required 
                        className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white outline-none text-base font-bold" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{t.to}</label>
                      <input 
                        name="unloading" 
                        placeholder="e.g. Surat, GJ" 
                        required 
                        className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white outline-none text-base font-bold" 
                      />
                    </div>
                  </div>

                  <input name="material" placeholder={t.material} required className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold" />
                  <input name="partyName" placeholder={t.partyName} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold" />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input name="travelKm" type="number" placeholder={t.totalKm} required className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold" />
                    <input name="diesel" type="number" placeholder={t.diesel} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="bhatta" type="number" placeholder={t.bhatta} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold" />
                    <input name="rto" type="number" placeholder={t.rto} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="toll" type="number" placeholder={t.toll} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold" />
                    <input name="other_exp" type="number" placeholder={t.otherExp} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      name="party_number" 
                      type="tel" 
                      maxLength={10}
                      placeholder={t.partyPhone} 
                      className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold" 
                    />
                    <input name="driver_balance" type="number" placeholder={t.driverBal} className="w-full p-4 border border-slate-100 rounded-2xl bg-red-50 text-red-700 font-bold" />
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center relative overflow-hidden group">
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">{t.clickPhoto}</p>
                <input type="file" name="photo" accept="image/*" capture="environment" required className="w-full text-[10px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-slate-800 file:text-white" />
              </div>

              <button type="submit" disabled={loading} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition active:scale-95 ${view === 'loading' ? 'bg-orange-600 shadow-orange-200' : 'bg-green-600 shadow-green-200'}`}>
                {loading ? t.saving : t.save}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}