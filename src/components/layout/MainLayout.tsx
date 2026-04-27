import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white text-zinc-900 font-sans antialiased">
      {/* Background with abstract colorful theme similar to yesz.in or the provided image */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400 rounded-full blur-[100px] opacity-60 mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[50%] bg-pink-400 rounded-full blur-[120px] opacity-50 mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-blue-300 rounded-full blur-[100px] opacity-60 mix-blend-multiply"></div>
      </div>
      
      {/* Pixelated/Noise Overlay for texture */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      ></div>

      <Navbar />

      <main className="flex-1 flex flex-col z-10 p-4 md:p-8 relative w-full max-w-[1600px] mx-auto h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
