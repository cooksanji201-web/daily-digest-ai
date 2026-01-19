import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, SkipForward } from 'lucide-react';

const AudioPlayer = ({ title, audioUrl, text }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const utteranceRef = useRef(null);

    useEffect(() => {
        // Cleanup previous audio/speech
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        synthRef.current.cancel();
        setIsPlaying(false);

        if (audioUrl) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        } else if (text) {
            // Setup TTS
            utteranceRef.current = new SpeechSynthesisUtterance(text);
            utteranceRef.current.rate = 1.0;
            utteranceRef.current.pitch = 1.0;

            // Try to select a good voice (Edge/Chrome natural voices pref)
            const voices = synthRef.current.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Microsoft'));
            if (preferredVoice) utteranceRef.current.voice = preferredVoice;

            utteranceRef.current.onend = () => setIsPlaying(false);
        }
    }, [audioUrl, text]);

    const togglePlay = () => {
        if (audioUrl && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        } else if (text && utteranceRef.current) {
            if (isPlaying) {
                synthRef.current.pause();
            } else {
                if (synthRef.current.paused) {
                    synthRef.current.resume();
                } else {
                    synthRef.current.speak(utteranceRef.current);
                }
            }
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="player-bar glass">
            <div className="flex items-center gap-4 w-full">
                <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                >
                    {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
                </button>

                <div className="flex-1">
                    <p className="text-xs text-purple-300 font-medium mb-1">NOW PLAYING (Daily Digest)</p>
                    <h4 className="text-sm text-white font-semibold truncate">{title}</h4>
                </div>

                <div className="flex items-center gap-4">
                    {/* Mock Visualizer */}
                    <div className="hidden sm:flex gap-1 h-8 items-center">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-1 bg-purple-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-2'}`}
                                style={{ height: '16px' }}
                            />
                        ))}
                    </div>

                    <button className="text-slate-400 hover:text-white">
                        <Volume2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
