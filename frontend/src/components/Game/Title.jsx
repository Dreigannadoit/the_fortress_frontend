import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HoverSoundButton from '../UI/HoverSoundButton';
import { typewritter } from '../../assets';

const Title = () => {
    const navigate = useNavigate();

    const Story = [
        "  Press F11 to Enter Fullscreen (Recommended)",
        "  Every 300 years a hero is born, but with them, come great evil; The Demon Lord. For as long as time has existed in the lands of Alcarnus, the Demon Lord has been terrorizing the world. Leaving only Suffering and Despair in their wake.",
        " It is up to the hero and their team of warriors of exceptional skills to defeat the demon lord and bring peace to the land.",
        " You are not the chosen hero...",
        " You are the hero's best friend, left to guard the walls of your home. Protecting it...",
        " Until They Return",
    ];

    const [index, setIndex] = useState(0);
    const [visibleText, setVisibleText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    const audioRef = useRef(null); // persistent audio reference
    const intervalRef = useRef(null); // track interval to clear when needed

    useEffect(() => {
        const fullText = Story[index];
        let i = 0;
        setVisibleText('');
        setIsTyping(true);

        // Reset audio instance
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        intervalRef.current = setInterval(() => {
            if (i < fullText.length) {
                setVisibleText(prev => prev + fullText.charAt(i));
                if (fullText.charAt(i) !== ' ') {
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                    }
                    const newAudio = new Audio(typewritter);
                    newAudio.volume = 0.4;
                    newAudio.play().catch(() => {});
                    audioRef.current = newAudio;
                }
                i++;
            } else {
                clearInterval(intervalRef.current);
                setIsTyping(false);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
            }
        }, 30);

        return () => {
            clearInterval(intervalRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [index]);

    const handleNext = () => {
        if (isTyping) return;

        if (index < Story.length - 1) {
            setIndex(index + 1);
        } else {
            navigate('/');
        }
    };

    const handleSkip = () => {
        navigate('/');
    };

    return (
        <div className='story'>
            <div className='story_container'>
                <p className={`${index === Story.length - 1 ? 'last_slide' : ''}`}>{visibleText}</p>
                <HoverSoundButton onClick={handleNext} disabled={isTyping}>
                    {index < Story.length - 1 ? 'Next' : 'Continue'}
                </HoverSoundButton>
                <button className={`skip ${index === Story.length - 1 ? 'last_slide' : ''}`} onClick={handleSkip}>
                    Skip
                </button>
            </div>
        </div>
    );
};

export default Title;
