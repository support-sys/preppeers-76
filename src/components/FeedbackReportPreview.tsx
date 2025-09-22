import React, { useState } from 'react';
import { Eye, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const FeedbackReportPreview = () => {
  const [showFullPDF, setShowFullPDF] = useState(false);
  const [selectedPage, setSelectedPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 100) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 100) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 md:p-12 shadow-2xl">
      <div className="text-center mb-12">
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">No more guessing what went wrong.</h3>
        <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto">Detailed feedback report after every mock interview</p>
      </div>
      
      {/* All Images Grid - Aligned at Same Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Page 1 */}
        <div className="relative group cursor-pointer md:col-span-2 lg:col-span-1" onClick={() => { setSelectedPage(1); setShowFullPDF(true); }}>
          <div className="overflow-hidden rounded-xl shadow-2xl">
            <img 
              src="/page1.png" 
              alt="Feedback Report Preview"
              className="w-full h-[300px] object-cover transform transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Eye className="w-5 h-5 text-gray-800" />
              <span className="text-gray-800 font-medium">Preview</span>
            </div>
          </div>
        </div>

        {/* Page 2 */}
        <div className="relative group cursor-pointer" onClick={() => { setSelectedPage(2); setShowFullPDF(true); }}>
          <div className="overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300">
            <img 
              src="/page2.png" 
              alt="Feedback Report Section 2"
              className="w-full h-[300px] object-cover transform transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Eye className="w-5 h-5 text-gray-800" />
              <span className="text-gray-800 font-medium">Preview</span>
            </div>
          </div>
        </div>

        {/* Page 3 */}
        <div className="relative group cursor-pointer" onClick={() => { setSelectedPage(3); setShowFullPDF(true); }}>
          <div className="overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300">
            <img 
              src="/page3.png" 
              alt="Feedback Report Section 3"
              className="w-full h-[300px] object-cover transform transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Eye className="w-5 h-5 text-gray-800" />
              <span className="text-gray-800 font-medium">Preview</span>
            </div>
          </div>
        </div>

        {/* Page 4 */}
        <div className="relative group cursor-pointer" onClick={() => { setSelectedPage(4); setShowFullPDF(true); }}>
          <div className="overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300">
            <img 
              src="/page4.png" 
              alt="Feedback Report Section 4"
              className="w-full h-[300px] object-cover transform transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Eye className="w-5 h-5 text-gray-800" />
              <span className="text-gray-800 font-medium">Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Preview Modal */}
      {showFullPDF && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-6xl max-h-[95vh] overflow-hidden w-full shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-white rounded-t-xl">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Feedback Report - Page {selectedPage}
              </h3>
              <div className="flex items-center space-x-2">
                {/* Zoom Controls */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button 
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="px-2 py-1 text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                    {zoomLevel}%
                  </span>
                  <button 
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={handleResetZoom}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <button 
                  onClick={() => setShowFullPDF(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            <div 
              className="flex-1 overflow-auto bg-gray-50 relative"
              onWheel={handleWheel}
            >
              <div 
                className="flex items-center justify-center min-h-full p-4"
                style={{ 
                  cursor: zoomLevel > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default' 
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img 
                  src={`/page${selectedPage}.png`}
                  alt={`Feedback Report Page ${selectedPage}`}
                  className="rounded-lg shadow-lg select-none"
                  style={{
                    transform: `scale(${zoomLevel / 100}) translate(${imagePosition.x / (zoomLevel / 100)}px, ${imagePosition.y / (zoomLevel / 100)}px)`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                  }}
                  draggable={false}
                />
              </div>
            </div>
            <div className="p-4 bg-gray-100 rounded-b-xl">
              <p className="text-sm text-gray-600 text-center">
                Use mouse wheel to zoom • Drag to pan when zoomed • Click buttons to control zoom
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackReportPreview;
