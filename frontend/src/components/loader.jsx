import React from 'react';
// Make sure to import your gif here
import loaderGif from './logoloader.gif'; 

const Loader = ({ message }) => {
  return (
    <div className="flex flex-1 bg-cyan-50 items-center justify-center h-screen w-full">
      <div className="text-center">
        <img 
          src={loaderGif} 
          alt="Loading" 
          className="h-36 w-36 mx-auto" 
        />
        <p className="mt-3 text-sm font-semibold tracking-wide text-teal-600 animate-pulse">
          {/* Using the prop passed in, or default to "Loading..." */}
          {message || "Loading..."}
        </p>
      </div>
    </div>
  );
};

export default Loader;