"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://gk-backend-two.vercel.app";

export default function AdminDashboard() {
  const [trips, setTrips] = useState([]);
  const [parties, setParties] = useState<any[]>([]); 
  const [reminders, setReminders] = useState<any[]>([]); 
  const [search, setSearch] = useState("");
  const [partySearch, setPartySearch] = useState(""); 
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<any>(null);
  const [fullPreview, setFullPreview] = useState<{ url: string, type: string, time: string, loc: string } | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [partyData, setPartyData] = useState({
    name: '',
    mobile: '',
    totalAmount: 0,
    advance: 0,
    feedback: ''
  });
  const [partyHistory, setPartyHistory] = useState<any[]>([]); 

  const router = useRouter();

  const sendWhatsAppReminder = (party: any) => {
    const balance = Number(party.total_amount) - Number(party.advance_paid);
    const message = `*Ganesh Enterprises Reminder*%0A%0AHello *${party.party_name}*,%0AThis is a friendly reminder regarding your pending balance of *₹${balance}*. Please let us know when you can clear the payment.%0A%0AThank you!`;
    const cleanMobile = party.mobile_no.replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanMobile}?text=${message}`, '_blank');
  };

  const fetchTrips = () => {
    // Added safety check for localStorage parsing
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    fetch(`${API_URL}/api/admin/trips`)
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array before filtering
        const tripsData = Array.isArray(data) ? data : [];
        if (user.role === 'employee') {
          const myTrips = tripsData.filter((t: any) => t.full_name === user.full_name);
          setTrips(myTrips);
        } else {
          setTrips(tripsData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }

  const fetchPartiesList = () => {
    fetch(`${API_URL}/api/admin/parties-all`)    
     .then(res => res.json())
      .then(data => setParties(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching parties:", err));
  };

  const fetchReminders = () => {
    fetch(`${API_URL}/api/admin/reminders`)     
      .then(res => res.json())
      .then(data => setReminders(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching reminders:", err));
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    if (!user || Object.keys(user).length === 0 || (user.role !== 'admin' && user.role !== 'employee')) {
      router.push('/login');
    } else {
      fetchTrips();
      fetchPartiesList(); 
      fetchReminders(); 
    }
  }, [router]);

  useEffect(() => {
    if (partyData.mobile.length === 10) {
    fetch(`${API_URL}/api/admin/party/${partyData.mobile}`)  
      .then(res => res.json())
        .then(data => {
          if (data.exists) {
            setPartyData(prev => ({
              ...prev,
              name: data.party.party_name,
              totalAmount: Number(data.party.total_amount),
              advance: Number(data.party.advance_paid)
            }));
            setPartyHistory(data.history || []);
          } else {
            setPartyHistory([]);
          }
        })
        .catch(err => console.error("Error fetching party details:", err));
    }
  }, [partyData.mobile]);

  const filteredTrips = trips
    .filter((t: any) => {
      const matchesSearch = t.full_name?.toLowerCase().includes(search.toLowerCase()) || 
                            t.vehicle_no?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      if (a.status === 'started' && b.status === 'completed') return -1;
      if (a.status === 'completed' && b.status === 'started') return 1;
      return b.id - a.id;
    });

  const filteredParties = parties.filter(p => 
    p.party_name?.toLowerCase().includes(partySearch.toLowerCase()) || 
    p.mobile_no?.includes(partySearch)
  );

  const totalDiesel = filteredTrips.reduce((acc: any, t: any) => acc + Number(t.diesel_amt || 0), 0);
  const totalBhatta = filteredTrips.reduce((acc: any, t: any) => acc + Number(t.bhatta || 0), 0);
  const runningCount = filteredTrips.filter((t: any) => t.status !== 'completed').length;

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) setPartyData({ ...partyData, mobile: val });
  };

  const savePartyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (partyData.mobile.length !== 10) return alert("Mobile must be 10 digits");
    
    try {
        const response = await fetch(`${API_URL}/api/admin/party-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partyData),
        });
        if (response.ok) {
            alert(`Record updated for ${partyData.name}`);
            setPartyData({ name: '', mobile: '', totalAmount: 0, advance: 0, feedback: '' });
            setPartyHistory([]);
            fetchPartiesList(); 
            fetchReminders(); 
        }
    } catch (err) {
        alert("Error saving party data");
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredTrips.map((t: any) => ({
      "Date": new Date(t.capture_time).toLocaleDateString(),
      "Driver": t.full_name,
      "Vehicle": t.vehicle_no,
      "Loading": t.loading_point,
      "Unloading": t.unloading_point,
      "Diesel Rs": t.diesel_amt,
      "Bhatta": t.bhatta,
      "Driver Balance": t.driver_balance,
      "Status": t.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trips");
    XLSX.writeFile(workbook, `Ganesh_Trips_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportPartiesToExcel = () => {
    const data = parties.map(p => ({
      "Party Name": p.party_name,
      "Mobile": p.mobile_no,
      "Total Deal": p.total_amount,
      "Advance Paid": p.advance_paid,
      "Remaining Balance": p.total_amount - p.advance_paid
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Party Balances");
    XLSX.writeFile(workbook, `Party_Balances_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      router.push('/login');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this record?")) {
      await fetch(`${API_URL}/api/admin/delete-trip/${id}`, { method: 'DELETE' });
      fetchTrips();
    }
  };

  const deleteParty = async (id: number) => {
    if (confirm("Are you sure you want to delete this party and all their logs?")) {
      await fetch(`https://gk-backend-two.vercel.app/api/admin/delete-party/${id}`, { method: 'DELETE' });
      fetchPartiesList();
      fetchReminders();
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 uppercase text-xs tracking-widest">Loading Dashboard Data...</div>;

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = userObj.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-[#0F172A] text-white p-6 no-print flex flex-row md:flex-col justify-between items-center md:items-stretch md:min-h-screen sticky top-0 z-50">
        <div className="w-full">
          <div className="mb-0 md:mb-12">
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter text-[#FF5722] uppercase">
              GANESH ENTERPRISES
            </h1>
            <div className="hidden md:block h-1 w-12 bg-[#FF5722] mt-1"></div>
          </div>
       <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-3 overflow-x-auto md:overflow-visible w-full no-scrollbar pb-2 md:pb-0">            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`${activeTab === 'dashboard' ? 'bg-[#FF5722] shadow-[#FF5722]/20' : 'bg-transparent'} text-white p-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all text-left`}>
              Dashboard
            </button>
            {isAdmin && (
              <button 
                onClick={() => setActiveTab('party')}
                className={`${activeTab === 'party' ? 'bg-[#FF5722] shadow-[#FF5722]/20' : 'bg-transparent'} text-white p-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all text-left`}>
                Party Payments
              </button>
            )}
          </nav>
        </div>
        <div className="w-auto md:w-full md:mt-auto">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-transparent md:bg-[#FF5722]/10 text-[#FF5722] md:hover:bg-[#FF5722] md:hover:text-white px-5 py-2.5 md:py-4 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all border border-[#FF5722]/30 md:border-none w-full">
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-10">
        {activeTab === 'dashboard' ? (
          <>
            <header className="mb-8 hidden md:block">
              <h2 className="text-3xl font-black text-[#0F172A] italic uppercase tracking-tight">Admin Dashboard</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Manage Trip Records & Expenses</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 no-print">
              {[
                { label: 'Total Trips', val: filteredTrips.length, color: 'text-slate-800' },
                { label: 'Total Diesel', val: `₹${totalDiesel}`, color: 'text-green-600' },
                { label: 'Total Bhatta', val: `₹${totalBhatta}`, color: 'text-orange-600' },
                { label: 'Running', val: runningCount, color: 'text-blue-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-transform hover:scale-[1.02]">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className={`text-xl md:text-3xl font-black tracking-tighter ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 no-print items-end md:items-center">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-80">
                  <input type="text" placeholder="Search Driver or Vehicle..." className="p-4 pl-6 border-none rounded-2xl w-full shadow-sm bg-white focus:ring-2 focus:ring-[#FF5722] outline-none transition-all font-bold text-sm" onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="p-4 border-none rounded-2xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#FF5722] font-black text-[10px] uppercase tracking-wider cursor-pointer" onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Status: All</option>
                  <option value="started">Status: Running</option>
                  <option value="completed">Status: Finished</option>
                </select>
              </div>
              <button onClick={exportToExcel} className="bg-[#2E7D32] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-900/10 active:scale-95 transition-all w-full md:w-auto">
                Export to Excel
              </button>
            </div>

            <div className="hidden md:block bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden border border-slate-50 no-print">
              <table className="w-full text-left">
                <thead className="bg-[#F8F9FA] text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                  <tr>
                    <th className="p-8">Driver & Date</th>
                    <th className="p-8">Vehicle/Material</th>
                    <th className="p-8">Route</th>
                    <th className="p-8">Expenses</th>
                    <th className="p-8 text-center">Actions</th>
                    <th className="p-8 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredTrips.map((trip: any) => (
                    <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-8 font-bold text-slate-700">{trip.full_name}<div className="text-[10px] text-slate-400 font-medium mt-1">{new Date(trip.capture_time).toLocaleDateString()}</div></td>
                      <td className="p-8 font-black text-slate-800 uppercase tracking-tighter">{trip.vehicle_no}<div className="text-[10px] text-[#FF5722] font-normal lowercase italic">{trip.material}</div></td>
                      <td className="p-8 font-medium text-slate-500 italic">{trip.loading_point} → {trip.unloading_point}</td>
                      <td className="p-8 text-[11px] font-black">D: ₹{trip.diesel_amt} <br/> B: ₹{trip.bhatta}</td>
                      <td className="p-8 text-center space-x-4">
                        <button onClick={() => setSelectedImg(trip)} className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:text-blue-800">View Details</button>
                        <button onClick={() => handleDelete(trip.id)} className="text-red-400 font-black text-[10px] uppercase tracking-widest hover:text-red-600">Delete</button>
                      </td>
                      <td className="p-8 text-center">
                        <span className={`text-[9px] font-black uppercase px-4 py-2 rounded-full border ${trip.status === 'completed' ? 'text-green-600 bg-green-50 border-green-100' : 'text-blue-600 bg-blue-50 border-blue-100 animate-pulse'}`}>
                          {trip.status === 'completed' ? 'Finished' : 'Running'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4 no-print">
              {filteredTrips.map((trip: any) => (
                <div key={trip.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col relative">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full ${trip.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50 animate-pulse'}`}>
                      {trip.status === 'completed' ? 'Finished' : 'Running'}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(trip.capture_time).toLocaleDateString()}</p>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none mb-1">{trip.vehicle_no}</h3>
                  <p className="text-[11px] text-slate-400 font-black uppercase mb-4 tracking-widest">{trip.full_name}</p>
                  <div className="bg-red-50 p-4 rounded-3xl border border-red-100 mb-4">
                    <p className="text-[7px] font-black text-red-500 uppercase tracking-widest">Driver Bal.</p>
                    <p className="text-base font-black text-red-600">₹{trip.driver_balance || 0}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-[11px] font-black text-slate-400 tracking-tighter">D: ₹{trip.diesel_amt} | B: ₹{trip.bhatta}</div>
                    <div className="flex gap-4">
                      <button onClick={() => setSelectedImg(trip)} className="text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-5 py-2.5 rounded-xl">Details</button>
                      <button onClick={() => handleDelete(trip.id)} className="text-red-400 text-[10px] font-black uppercase py-2.5">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto pb-20">
            <header className="mb-10 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-[#0F172A] italic uppercase tracking-tight">Party Finance</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Manage Client Payments & Call Feedback</p>
              </div>
              <button onClick={exportPartiesToExcel} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Export Balances</button>
            </header>

            {reminders.length > 0 && (
              <div className="mb-8 bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-[2rem]">
                <h4 className="text-orange-700 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  ⚠️ Automatic Reminders ({reminders.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reminders.slice(0, 6).map(p => {
                    const balance = p.total_amount - p.advance_paid;
                    return (
                      <div key={p.id} className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-orange-100 flex justify-between items-center group">
                        <div>
                          <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">{p.party_name}</p>
                          <p className="text-[12px] font-black text-orange-600 tracking-tighter">₹{balance} Pending</p>
                        </div>
                        <button 
                          onClick={() => sendWhatsAppReminder(p)}
                          className="bg-[#25D366] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 hover:bg-[#128C7E] transition-all"
                        >
                          WhatsApp
                        </button>
                      </div>
                    );
                  })}
                </div>
                {reminders.length > 6 && (
                  <p className="mt-4 text-[9px] font-bold text-orange-400 uppercase tracking-widest text-center">+{reminders.length - 6} more pending balances</p>
                )}
              </div>
            )}

            <form onSubmit={savePartyDetails} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-8 mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Party Name / Company</label>
                    <input required type="text" className="w-full p-5 rounded-[1.5rem] bg-[#F8F9FA] border-none focus:ring-2 focus:ring-[#FF5722] font-bold text-slate-700 outline-none mt-2" placeholder="Ganesh Steels Ltd" value={partyData.name} onChange={(e)=>setPartyData({...partyData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Mobile (10 Digits Only)</label>
                    <div className="flex gap-3 mt-2">
                      <input required type="tel" className="flex-1 p-5 rounded-[1.5rem] bg-[#F8F9FA] border-none focus:ring-2 focus:ring-[#FF5722] font-black text-slate-700 outline-none" placeholder="98XXXXXXXX" value={partyData.mobile} onChange={handleMobileChange} />
                      {partyData.mobile.length === 10 && (
                        <a href={`tel:${partyData.mobile}`} className="bg-green-500 text-white p-5 rounded-2xl shadow-lg shadow-green-200 hover:scale-110 transition-transform">📞</a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Total Pay</p>
                      <input type="number" className="w-full bg-transparent border-b border-slate-700 py-2 text-xl font-black outline-none focus:border-[#FF5722]" value={partyData.totalAmount} onChange={(e)=>setPartyData({...partyData, totalAmount: Number(e.target.value)})} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Advance</p>
                      <input type="number" className="w-full bg-transparent border-b border-slate-700 py-2 text-xl font-black outline-none focus:border-[#FF5722]" value={partyData.advance} onChange={(e)=>setPartyData({...partyData, advance: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-800">
                    <p className="text-[10px] font-black uppercase text-[#FF5722] tracking-[0.2em] mb-1">Total Balance Due</p>
                    <p className="text-5xl font-black tracking-tighter italic">₹{partyData.totalAmount - partyData.advance}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">New Call Feedback</label>
                <textarea rows={3} className="w-full p-6 rounded-[2rem] bg-[#F8F9FA] border-none focus:ring-2 focus:ring-[#FF5722] font-bold text-slate-700 outline-none mt-2" placeholder="Write current feedback here..." value={partyData.feedback} onChange={(e)=>setPartyData({...partyData, feedback: e.target.value})}></textarea>
              </div>

              <button type="submit" className="w-full bg-[#FF5722] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-sm shadow-2xl shadow-[#FF5722]/30 active:scale-[0.98] transition-all">
                Update Party & Log Call
              </button>
            </form>

            <div className="mt-10 mb-12">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0F172A] italic">Party Directory</h3>
                 <div className="w-full md:w-64">
                    <input 
                      type="text" 
                      placeholder="Search Name or Mobile..." 
                      className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#FF5722] shadow-sm"
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                    />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredParties.length > 0 ? filteredParties.map((p, idx) => {
                    const balance = p.total_amount - p.advance_paid;
                    const isPaid = balance <= 0;
                    return (
                      <div key={idx} className={`bg-white p-6 rounded-[2rem] shadow-sm border-2 flex justify-between items-center group transition-all ${isPaid ? 'border-green-100' : 'border-slate-50 hover:border-[#FF5722]'}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-slate-800 uppercase text-sm">{p.party_name}</h4>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${isPaid ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                              {isPaid ? 'PAID' : 'PENDING'}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400">{p.mobile_no}</p>
                          <div className="flex gap-3 mt-2">
                             <button onClick={() => setPartyData({...partyData, mobile: p.mobile_no})} className="text-[9px] font-black text-[#FF5722] uppercase">Edit/Logs</button>
                             <button onClick={() => deleteParty(p.id)} className="text-[9px] font-black text-slate-300 hover:text-red-500 uppercase">Delete</button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                          <p className={`text-xl font-black ${isPaid ? 'text-green-600' : 'text-slate-800'}`}>₹{balance}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full p-10 text-center text-slate-300 font-bold uppercase text-xs bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                      No Records Found
                    </div>
                  )}
               </div>
            </div>

            {partyHistory.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <span className="h-px w-12 bg-slate-200"></span> Previous Call Logs
                    </h3>
                    <div className="space-y-4">
                        {partyHistory.map((log, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
                                <div className="bg-[#FF5722]/10 text-[#FF5722] p-3 rounded-2xl font-black text-[10px]">
                                    {new Date(log.call_date).toLocaleDateString()}
                                </div>
                                <div>
                                    <p className="text-slate-700 font-bold text-sm leading-relaxed">{log.feedback_text}</p>
                                    <p className="text-[9px] text-slate-300 font-black uppercase mt-1 tracking-tighter">Logged at {new Date(log.call_date).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Trip Details - UPDATED FOR PRINT & METADATA */}
      {selectedImg && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[100] p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0" onClick={() => setSelectedImg(null)}>
          <div className="bg-white p-8 rounded-[3rem] max-w-lg w-full max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:w-full print:p-10" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-8 text-slate-800 text-center uppercase tracking-tighter italic border-b-2 border-slate-100 pb-4">Ganesh Enterprises. Trip Report</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 text-sm border-b border-slate-50 pb-4">
                <div><p className="text-slate-400 font-black uppercase text-[9px]">Driver</p><p className="font-black text-slate-800 text-lg">{selectedImg.full_name}</p></div>
                <div className="text-right"><p className="text-slate-400 font-black uppercase text-[9px]">Vehicle</p><p className="font-black text-slate-800 text-lg uppercase">{selectedImg.vehicle_no}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <p className="text-slate-500 font-bold uppercase text-[10px]">Diesel Expense</p> <p className="text-right font-black">₹{selectedImg.diesel_amt}</p>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Bhatta Amount</p> <p className="text-right font-black">₹{selectedImg.bhatta}</p>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Party Phone</p> <p className="text-right font-black">{selectedImg.party_number || 'N/A'}</p>
              </div>
              <div className="bg-red-50 border border-red-100 p-5 rounded-[2rem] flex justify-between items-center">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em]">Driver Bal.</p>
                <p className="text-2xl font-black tracking-tighter text-red-600">₹{selectedImg.driver_balance || 0}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
               {['loading', 'unloading'].map(type => selectedImg[`${type}_photo`] && (
                 <div key={type} className="space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">{type} Verification</p>
                    <div 
                      className="relative group cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-slate-100 shadow-lg h-40"
                      onClick={() => setFullPreview({
                        url: selectedImg[`${type}_photo`],                        type: type === 'loading' ? 'LOADING PHOTO' : 'UNLOADING PHOTO',
                        time: type === 'loading' ? new Date(selectedImg.capture_time).toLocaleString() : (selectedImg.unloading_date ? new Date(selectedImg.unloading_date).toLocaleString() : 'N/A'),
                        loc: type === 'loading' ? selectedImg.location_name : (selectedImg.unloading_location || 'Address not available')
                      })}
                    >
                      <img src={selectedImg[`${type}_photo`]} className="w-full h-full object-cover" alt={type} />
                    </div>
                    {/* SHOWING DATE & LOCATION DIRECTLY ON REPORT */}
                    <div className="px-1 text-center">
                        <p className="text-[7px] font-black text-slate-800">📅 {type === 'loading' ? new Date(selectedImg.capture_time).toLocaleString() : (selectedImg.unloading_date ? new Date(selectedImg.unloading_date).toLocaleString() : 'N/A')}</p>
                        <p className="text-[7px] font-black text-[#FF5722] truncate">📍 {type === 'loading' ? selectedImg.location_name : (selectedImg.unloading_location || 'Address N/A')}</p>
                    </div>
                 </div>
               ))}
            </div>
            
            <div className="mt-8 flex gap-4 no-print">
               <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Print Report</button>
               <button onClick={() => setSelectedImg(null)} className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-400">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full Image Preview */}
      {fullPreview && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-4 md:p-10 no-print" onClick={() => setFullPreview(null)}>
          <div className="relative w-full max-w-5xl h-full flex flex-col bg-[#1a1a1a] rounded-[3rem] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black">
              <img src={fullPreview.url} className="max-h-full max-w-full object-contain" alt="Full Preview" />
            </div>
            <div className="bg-white p-6 md:p-10 w-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[#FF5722] font-black text-xs md:text-sm tracking-widest uppercase mb-1">{fullPreview.type}</h3>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 italic uppercase leading-none">{selectedImg.vehicle_no}</p>
                </div>
                <button onClick={() => setFullPreview(null)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">Close</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6 text-sm font-bold">
                <p>📅 {fullPreview.time}</p>
                <p className="text-[#FF5722]">📍 {fullPreview.loc}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        
@media print {
  body { background: white !important; margin: 0 !important; padding: 0 !important; }
  body > div:first-child { display: none !important; } /* Hide the main app entirely */
  .no-print { display: none !important; }
  
  .fixed.inset-0 { 
    position: static !important; /* Removes flex centering for print */
    display: block !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .bg-white { 
    box-shadow: none !important; 
    border: none !important; 
    width: 100% !important; 
    max-width: 100% !important;
    padding-top: 0 !important; /* Forces content to the very top */
    margin-top: 0 !important;
  }
}      
      `}</style>
    </div>
  );
}