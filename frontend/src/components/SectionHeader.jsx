import React from "react";

const SectionHeader = ({ title, description }) => {
  return (
    <div className="bg-linear-to-r from-cyan-100 to-teal-100 rounded-lg p-6 border border-cyan-100 mb-4">
      <h1 className="text-lg font-bold text-gray-800 mb-1">
        {title}
      </h1>
      <p className="text-sm text-gray-600">
        {description}
      </p>
    </div>
  );
};

export default SectionHeader;
