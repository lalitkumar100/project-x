import React from 'react';
import CustomLoader from '@/components/CustomLoader';

const LoaderReviewPage = () => {
  return (
    <div className="min-h-screen w-full bg-[#000300] relative flex items-center justify-center">
      {/* Absolute positioning to test fullScreen={false} variation if needed, but here we just show fullScreen */}
      <CustomLoader fullScreen={true} text="Initializing TradeCore Subsystems..." />
    </div>
  );
};

export default LoaderReviewPage;
