'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Lock, Trash, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number, title?: string) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [title, setTitle] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current date in the format shown in design
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setRecordedBlob(audioBlob);
        
        // Check if recording is too short
        if (duration < 2) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
        }
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Ensure we have at least 1 second of recording
      if (duration === 0) {
        setDuration(1); // Set minimum duration to 1 second
      }
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        startTimer();
      } else {
        mediaRecorderRef.current.pause();
        stopTimer();
      }
      setIsPaused(!isPaused);
    }
  };

  const startTimer = () => {
    // Start with 1 second immediately to avoid 0 duration
    setDuration(1);
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playPauseAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const resetRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
    setDuration(0);
    setIsPlaying(false);
    setTitle('');
    setRecordedBlob(null);
    setShowWarning(false);
  };

  const saveRecording = () => {
    if (recordedBlob && duration >= 2) {
      onRecordingComplete(recordedBlob, duration, title.trim() || undefined);
      resetRecording();
      
      // Show success toast
      toast({
        title: "Audio recording saved successfully!",
        description: "Your voice journal has been safely recorded."
      });
    } else {
      // Show error toast if recording is too short
      toast({
        title: "Recording too short",
        description: "Please record for at least 2 seconds before saving.",
        variant: "destructive"
      });
    }
  };

  const discardRecording = () => {
    resetRecording();
  };

  return (
    <>
    <div className="space-y-4 sm:space-y-6">
      {/* Title Input */}
      {/* <div className="mb-4 sm:mb-6">
      <input
        type="text"
        placeholder="Give your entry a title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm sm:text-base disabled:bg-gray-50"
        disabled={isRecording}
      />
    </div> */}
      <div className="bg-white p-2 sm:p-3 rounded-[32px] -mt-3 border border-slate-100 shadow-sm">
        <input
          type="text"
          placeholder="Give your entry a title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full h-10 sm:h-12 px-4 sm:px-6 rounded-[32px] bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-sm sm:text-base"
          disabled={isRecording} />
      </div>
    </div>
    <div className="bg-white mt-2 rounded-[32px] p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center">
              <img src="/selfhelptools/journaling/Mic.svg" alt="Editor" className="w-[35px] h-[35px] sm:w-[63px] sm:h-[63px]" />
            </div>
            <div className='-ml-2 sm:ml-2'>
              <h3 className="font-bold text-[#2F3D43] text-[14px] sm:text-[24px]">Today's Entry</h3>
              <p className="text-[#686D70] text-[10px] sm:text-[14px] font-medium">{getCurrentDate()}</p>
            </div>
          </div>

          {/* Privacy Indicator */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[24px] text-slate-400 text-sm bg-[#F1FAFF]">
            <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ">This recording is private</span>
            <span className="sm:hidden text-[10px] -ml-1">Private</span>
          </div>
        </div>

        {/* Recording Interface */}
        <div className="text-center space-y-8">
          {/* Recording Indicator */}
          <div className="relative inline-flex items-center sm:mt-6 justify-center">
            {/* Concentric circles for recording state */}
            <div className="absolute w-32 h-32 sm:w-[209px] sm:h-[209px] bg-blue-100 rounded-full opacity-30"></div>
            {/* <div className="absolute w-28 h-28 sm:w-[259px] sm:h-[259px] bg-[#F1FAFF] rounded-full opacity-50"></div> */}
            <div className="relative w-24 h-24 sm:w-[129px] sm:h-[129px] bg-[#D8F2FF] rounded-full flex items-center justify-center shadow-lg">
              <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-[#155A85]" />
            </div>
          </div>

          {/* Timer */}
          <div className="text-4xl sm:text-[36px] sm:mt-6 font-bold text-slate-900 ">
            {formatTime(duration)}
          </div>

          {/* Start Recording Button */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-full h-[47px] sm:h-[57px] max-w-xs mx-auto bg-gradient-to-l from-[#4FC1F9] to-[#1B9EE0] hover:from-[#4FC1F9] hover:to-[#1B9EE0] text-white rounded-[24px] font-medium text-base sm:text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Start Recording
            </button>
          ) : (
            <div className="space-y-4">
              {/* Recording Status */}
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-500 font-medium text-sm sm:text-base">
                  {isPaused ? 'Recording Paused' : 'Recording...'}
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={pauseRecording}
                  className="px-6 py-3 sm:pl-15 border border-[#1B9EE0] text-[#1B9EE0] sm:w-[199px] sm:h-[57px] rounded-[24px] font-medium transition-colors hover:bg-blue-50 flex items-center gap-2 text-sm sm:text-base"
                >
                  {isPaused ? <Play className="w-4 h-4 items-center" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={stopRecording}
                  className="px-6 sm:pl-15 sm:w-[199px] sm:h-[57px] py-3 bg-gradient-to-b from-[#4FC1F9] to-[#1B9EE0] hover:bg-blue-600 text-white rounded-[24px] font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Warning Message */}
          {showWarning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
              Recording is too short. Please record for at least 2 seconds.
            </div>
          )}

          {/* Audio Playback */}
          {audioURL && !isRecording && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <audio
                ref={audioRef}
                src={audioURL}
                onEnded={() => setIsPlaying(false)}
                className="hidden" />
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={playPauseAudio}
                  className="w-12 h-12 bg-gradient-to-b from-[#4FC1F9] to-[#1B9EE0] hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={saveRecording}
                  disabled={duration < 2}
                  className="py-2 px-3  sm:px-6 sm:py-3 border border-[#1B9EE0] text-[#1B9EE0] sm:w-[199px] sm:h-[57px] rounded-[24px]  font-medium transition-colors text-sm sm:text-base"
                >
                  Save Recording
                </button>
                <button
                  onClick={discardRecording}
                  className="px-3 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors text-sm sm:text-base"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
    </>
  );
}
