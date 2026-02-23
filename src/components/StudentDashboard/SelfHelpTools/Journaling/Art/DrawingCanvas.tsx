'use client';
import * as React from 'react';
import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { Lock, ChevronDown, Pen, Eraser, Trash2, Sliders, Link, Undo, Redo } from 'lucide-react';
import { ArtJournal } from '@/src/generated/prisma/client';
import { toast } from 'sonner';

interface DrawingCanvasProps {
  onSave?: (imageDataUrl: string) => void;
  loading?: boolean;
  config?: {
    enableUndo?: boolean;
    enableRedo?: boolean;
    enableClearCanvas?: boolean;
    enableColorPalette?: boolean;
  };
}

export default function DrawingCanvas({ onSave, loading = false, config }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(true);
  const [opacity, setOpacity] = useState(100);
  const [currentColor, setCurrentColor] = useState('#1F4B43');
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [artJournals, setArtJournals] = useState<ArtJournal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Undo/Redo functionality
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  

  const colors = [
    '#1F4B43', // Dark Green
    '#6B5B95', // Purple
    '#FEB236', // Orange/Yellow
    '#F0656B', // Pink/Red
    '#5DADE2', // Blue
    '#58D68D', // Green
  ];

  const paletteGrid = {
    Reds: ['#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],
    Oranges: ['#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100'],
    Yellows: ['#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17'],
    Greens: ['#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],
    Teals: ['#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40'],
    Blues: ['#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],
    Purples: ['#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'],
    Pinks: ['#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F'],
    Neutrals: ['#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121', '#000000'],
  };

  // Initialize canvas and fetch art journals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Set initial canvas background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save initial state to history
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([imageData]);
    setHistoryStep(0);
    
    // Fetch art journals on component mount
    fetchArtJournals();
  }, []);

const fetchArtJournals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/student/journals/art');
      const result = await response.json();
      
      if (result.success) {
        setArtJournals(result.data);
      } else {
        toast.error('Failed to fetch art journals');
      }
    } catch (error) {
      console.error('Error fetching art journals:', error);
      toast.error('Error loading art journals');
    } finally {
      setIsLoading(false);
    }
  };

  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.globalAlpha = opacity / 100;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      saveToHistory();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save state before clearing
    saveToHistory();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Save current canvas state to history
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // Undo function
  const undo = () => {
    if (historyStep <= 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep - 1;
    const imageData = history[newStep];
    
    ctx.putImageData(imageData, 0, 0);
    setHistoryStep(newStep);
  };

  // Redo function
  const redo = () => {
    if (historyStep >= history.length - 1) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep + 1;
    const imageData = history[newStep];
    
    ctx.putImageData(imageData, 0, 0);
    setHistoryStep(newStep);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;

    const imageDataUrl = canvas.toDataURL('image/png');
    onSave(imageDataUrl);
  };

  return (
    <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 relative -mt-4">
      {/* Header */}
      
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div className="flex gap-2 sm:gap-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-xl sm:text-2xl">
            🎨
          </div>
          <div>
              <h3 className="font-bold text-[#2F3D43] text-[18px] sm:text-[24px]">Today's Entry</h3>
              <p className="text-[10px] sm:text-[16px] text-[#686D70] font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>
        <div className="bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 font-medium border border-gray-100">
          
          <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden xs:block sm:block">Your drawing is private</span>
          <span className="block xs:hidden sm:hidden">Private</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 relative">
        {/* Colors */}
        <div className="flex items-center gap-1 sm:gap-2 ml-2">
          <div className="hidden sm:flex gap-1 sm:gap-2">
            {colors.map((color, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentColor(color)}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 ${currentColor === color ? 'border-gray-400' : 'border-white'} shadow-sm hover:scale-110 transition-transform`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          {config?.enableColorPalette !== false && (
            <button 
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#1F4B43] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            >
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        <div className="h-px -mr-2 sm:h-px w-px bg-gray-200"></div>
        {/* Brush Size */}
        <div className="flex items-center gap-2 sm:gap-3">
          {[4, 8, 12, 16, 20].map((size) => (
                <button 
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`rounded-full hover:bg-gray-700 transition-colors ${brushSize === size ? 'bg-black' : 'bg-gray-400'}`}
                  style={{ width: size, height: size }}
                />
          ))}
        </div>

      <div className="h-px sm:h-px w-px bg-gray-200"></div>
        {/* Opacity */}
        <div className="flex items-center gap-2 -ml-3 sm:gap-3 flex-1">
          <span className="text-xs sm:text-sm text-gray-500">Opacity</span>
          <div className="relative h-2 w-[50px] sm:w-[152px] sm:h-2 bg-gray-100 rounded-full">
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="absolute inset-0 sm:w-[152px] h-full opacity-1 cursor-pointer"
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4 sm:h-4 bg-[#1B9EE0] rounded-full shadow-sm cursor-pointer"
              style={{ left: `${opacity}%` }}
            />
          </div>
          <span className="text-xs sm:text-sm text-gray-500 sm:ml-2 w-6 sm:w-8">{opacity}%</span>
        </div>
      </div>

      {/* Tools & Canvas Container */}
      <div className="relative">
        {/* Floating Tools */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex gap-1 sm:gap-2 z-10">
          {config?.enableUndo !== false && (
            <button 
              onClick={undo}
              disabled={historyStep <= 0}
              className={`w-8 h-8 sm:w-10 sm:h-10 ${historyStep <= 0 ? 'bg-gray-100 text-gray-300' : 'bg-white text-gray-600 border border-gray-100'} rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all disabled:cursor-not-allowed`}
            >
              <Undo className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
          {config?.enableRedo !== false && (
            <button 
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className={`w-8 h-8 sm:w-10 sm:h-10 ${historyStep >= history.length - 1 ? 'bg-gray-100 text-gray-300' : 'bg-white text-gray-600 border border-gray-100'} rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all disabled:cursor-not-allowed`}
            >
              <Redo className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
          <button 
            onClick={() => setCurrentTool('pen')}
            className={`w-8 h-8 sm:w-10 sm:h-10 ${currentTool === 'pen' ? 'bg-[#2D9CDB]' : 'bg-white text-gray-400 border border-gray-100'} rounded-xl flex items-center justify-center shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-1`}
          >
            <Pen className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={() => setCurrentTool('eraser')}
            className={`w-8 h-8 sm:w-10 sm:h-10 ${currentTool === 'eraser' ? 'bg-[#2D9CDB] text-white' : 'bg-white text-gray-400 border border-gray-100'} rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all`}
          >
            <Eraser className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          {config?.enableClearCanvas !== false && (
            <button 
              onClick={clearCanvas}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white text-red-400 border border-red-100 rounded-xl flex items-center justify-center shadow-sm hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        {/* Color Picker Modal */}
        {showColorPicker && config?.enableColorPalette !== false && (
          <div className="absolute top-12 sm:top-16 left-0 sm:left-2 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-4 w-[280px] sm:w-[320px] animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-2 sm:mb-3">
                 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Color Palette</h4>
                 <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#1F4B43]"></div>
                 </div>
             
             <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                 {Object.entries(paletteGrid).map(([category, shades]) => (
                     <div key={category} className="flex gap-1 sm:gap-2 items-center">
                         <span className="text-[8px] sm:text-xs text-gray-400 w-8 sm:w-10 text-right pr-2">{category}</span>
                         <div className="flex gap-1 sm:gap-2 flex-1">
                             {shades.map((shade, i) => (
                                 <button
                                    key={i}
                                    onClick={() => {
                                        setCurrentColor(shade);
                                        setShowColorPicker(false);
                                    }}
                                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-[2px] hover:scale-125 transition-transform"
                                    style={{ backgroundColor: shade }}
                                 />
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
             <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-100">
                 <span className="text-gray-400">
                     <Pen className="w-3 h-3 sm:w-4 sm:h-4" />
                 </span>
                 <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-md shadow-inner" style={{ backgroundColor: currentColor }}></div>
                 <input 
                    type="text" 
                    value={currentColor} 
                    readOnly 
                    className="bg-transparent text-xs sm:text-sm font-mono text-gray-600 outline-none flex-1"
                 />
             </div>
          </div>
        )}

        {/* Canvas Area */}
        <canvas
          ref={canvasRef}
          className="w-full h-[300px] sm:h-[400px] border border-orange-200 rounded-2xl bg-white cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}
