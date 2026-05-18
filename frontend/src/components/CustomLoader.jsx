import React, { useEffect, useState } from 'react';
import './CustomLoader.css'; // We will create this CSS file

const CustomLoader = ({ fullScreen = true, text = "Loading..." }) => {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-50 flex flex-col justify-center items-center bg-[#000300]" 
    : "w-full h-full min-h-[300px] flex flex-col justify-center items-center bg-transparent";

  return (
    <div className={containerClasses}>
      <div className="cude-loader">
        {/* Rotating Ring */}
        <div className="ring-wrapper">
          <img
            src="/assets/ring.svg"
            alt="Rotating Ring"
            className="ring"
          />
        </div>

        {/* Still Cube */}
        <img
          src="/assets/cude.svg"
          alt="Cube"
          className="cube"
        />
      </div>
      
      {text && (
        <p className="mt-8 text-cyan-400 font-mono text-sm tracking-widest animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default CustomLoader;
