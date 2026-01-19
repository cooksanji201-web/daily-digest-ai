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
        setDuration(total);
        setProgress((current / total) * 100);
    };

    const handleSeek = (e) => {
        const width = e.target.clientWidth;
        const clickX = e.nativeEvent.offsetX;
        const percentage = (clickX / width);
        audioRef.current.currentTime = percentage * duration;
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className="glass-panel rounded-3xl p-8 mb-12 relative overflow-hidden group">
            {/* Background Gradient Animation */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl -z-10" />

            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />

            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Info */}
                <div className="text-center md:text-left space-y-2">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-medium tracking-wider uppercase">
                        Daily Digest
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
                    <p className="text-gray-400 text-sm">{date}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => audioRef.current.currentTime -= 10}
                        className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <Rewind size={24} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="p-6 rounded-full bg-white text-black hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>

                    <button
                        onClick={() => audioRef.current.currentTime += 10}
                        className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <FastForward size={24} />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-10 group/progress cursor-pointer" onClick={handleSeek}>
                <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono">
                    <span>{formatTime(audioRef.current?.currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden relative">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
