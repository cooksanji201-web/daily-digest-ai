import { Play, Pause, FastForward, Rewind, Volume2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function AudioPlayer({ audioUrl, title, date }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.8;
        }
    }, []);

    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        if (total) {
            setDuration(total);
            setProgress((current / total) * 100);
        }
    };

    const handleSeek = (e) => {
        const width = e.target.clientWidth;
        const clickX = e.nativeEvent.offsetX;
        const percentage = (clickX / width);
        if (duration) {
            audioRef.current.currentTime = percentage * duration;
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Controls & Title */}
            <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                    onClick={togglePlay}
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>

                <div className="flex-col hidden md:flex min-w-[180px]">
                    <h3 className="text-white font-medium truncate">{title}</h3>
                    <span className="text-xs text-slate-400">{date}</span>
                </div>
            </div>

            {/* Progress Bar (Expands to fill) */}
            <div className="flex-1 w-full flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-10 text-right hidden md:block">{formatTime(audioRef.current?.currentTime)}</span>

                <div className="h-2 flex-1 bg-white/10 rounded-full cursor-pointer relative group/bar overflow-hidden" onClick={handleSeek}>
                    {/* Hover preview could go here */}
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100 ease-linear group-hover/bar:bg-blue-400"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <span className="text-xs font-mono text-slate-400 w-10 hidden md:block">{formatTime(duration)}</span>
            </div>

            {/* Volume / Extras (Hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2 text-slate-400">
                <Volume2 size={16} />
                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-slate-500 rounded-full" />
                </div>
            </div>
        </div>
    );
}
