import React, { useState, useEffect, useRef } from 'react';
import { boss, boss_grunts, text_sfx } from '../../assets';

const DialogueBox = ({ text, onNext, onSkip }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isShaking, setIsShaking] = useState(false);
    const typingSpeed = 30;
    const dialogueBoxRef = useRef(null);
    const activeAudioInstances = useRef([]);

    // Function to play sound without interrupting others
    const playSound = (soundFile, volume = 1.0) => {
        const audio = new Audio(soundFile);
        audio.volume = volume;

        // Add to active instances
        activeAudioInstances.current.push(audio);

        // Play and handle cleanup when done
        audio.play().catch(e => console.log("Audio play error:", e));
        audio.onended = () => {
            // Remove from active instances when finished
            activeAudioInstances.current = activeAudioInstances.current.filter(a => a !== audio);
        };

        return audio;
    };

    // Clean up all audio when component unmounts
    useEffect(() => {
        return () => {
            activeAudioInstances.current.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
            activeAudioInstances.current = [];
        };
    }, []);

    useEffect(() => {
        // Preload sounds
        [text_sfx, boss_grunts].forEach(sound => {
            const audio = new Audio(sound);
            audio.volume = 0;
            audio.play().then(() => audio.pause()).catch(() => { });
        });
    }, []);

    useEffect(() => {
        // Reset the displayed text and index when the text prop changes
        setDisplayedText('');
        setCurrentIndex(0);

        // Play new line sound and trigger shake effect
        playSound(boss_grunts, 0.5);
        setIsShaking(true);
        const shakeTimer = setTimeout(() => setIsShaking(false), 500);

        return () => {
            clearTimeout(shakeTimer);
        };
    }, [text]);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                const newIndex = currentIndex + 1;
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(newIndex);

                // Play typewriter sound only for odd-numbered characters (1st, 3rd, 5th, etc.)
                if (text[currentIndex] !== ' ' && newIndex % 2 === 1) {
                    playSound(text_sfx, 0.3);
                }
            }, typingSpeed);

            return () => clearTimeout(timer);
        }
    }, [currentIndex, text]);

    const handleSkipAll = (e) => {
        e.stopPropagation();
        onSkip();
    };

    const handleClick = (e) => {
        e.stopPropagation();
        
        // If text is complete, go to next line
        if (currentIndex >= text.length) {
            onNext();
        }
    };

    return (
        <div className="dialogue-overlay" onClick={handleClick}>
            <div
                ref={dialogueBoxRef}
                className={`dialogue-box ${isShaking ? 'shake' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="boss_img">
                    <img src={boss} alt="" />
                </div>
                <div className="dialogue-chat">
                    <h1 style={{color:"lightBlue"}}>Vorgash Ghor’zul P. Zogthar-Gnarltooth</h1>
                    <p style={{color:"#ccc"}}><i>The Blue Herald, Demonlord’s Siege-Master</i></p>
                    <div className="dialogue-text">{displayedText}</div>
                    <div className="dialogue-controls">
                        <button className="dialogue-next" onClick={handleClick}>
                            {currentIndex < text.length ? '...' : 'Next'}
                        </button>
                        <button className="dialogue-skip" onClick={handleSkipAll}>
                            Skip All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DialogueBox;