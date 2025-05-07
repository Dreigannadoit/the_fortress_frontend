import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const TransitionWrapper = ({ children }) => {
    const tips = useMemo(() => [
        "Use the W, A, S, D to move",
        "Use the orbs to help support you",
        "Right Click to shoot",
        "Upgrade and Buy Weapons to become Stronger",
        "Ask Drei for 20 pesos, he will not give",
        "You can unlcok passive skills in the store",
        "Upgrade the turret radius to increase its effectiveness",
        "You can hide behind the wall for a bit, but the wall will take damage over time",
        "You will die if your health reaches 0",
        "You will lose if your base health reaches 0",
        "You CANNOT jump in this game",
        "The hero will return, so wait for her",
        '"As the Autumn approaches, I see it, the end of our youth. But do not be sad, for we will be together once more."',
        "You can unlock more weapons as you level up",
        "The slimes are only as strong as a new born infant, its their acid that kills you",
        "The Ogre has a 70% chance to kill you in 1 hit, so be carefull",
        "Make sure to position yourself or you migh get pushed towards a mob",
        "The more damage a weapon has, the harder it is to control",
        "The Orbs maybe expensive, but they are worth it.",
        "Unlike the other monsters, the lizard men have one goal: kill you",
        "The monster can be defeated if you kill them",
        "I don not know how many tips have typos",
        "If you kill enemies, you get a higher score",
        "Does anyone actully read these?",
        "The longer you survive, the more intense the enemies become",
        "The more items you buy, the more powerful you become",
        '"When you return, we will give you the largest celebration the WORLD has ever seen. So stay alive."',
        "You can view your current stats by clicking your name in the start menu",
        "The enemy will start to damage the wall after half a second after contact with the wall",
        "You CANNOT Jump in this game",
        "The game will end if you die or the base dies"
        
    ], []);

    const randomTip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], [tips]);
    const [showOverlay, setShowOverlay] = useState(true);
    const [showContent, setShowContent] = useState(false);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#000'
        }}>
            <AnimatePresence>
                {showContent && (
                    <motion.div
                        key="main-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                                duration: 0.8,
                                ease: [0.33, 1, 0.68, 1]
                            }
                        }}
                        exit={{
                            opacity: 0,
                            y: -20,
                            transition: {
                                duration: 0.5,
                                ease: [0.33, 1, 0.68, 1]
                            }
                        }}
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transition overlay with AnimatePresence */}
            <AnimatePresence onExitComplete={() => setShowContent(true)}>
                {showOverlay && (
                    <motion.div
                        key="transition-overlay"
                        initial={{
                            clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)',
                            opacity: 1
                        }}
                        animate={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
                            transition: {
                                duration: 1.8,
                                ease: [0.33, 1, 0.68, 1],
                                onComplete: () => setShowOverlay(false)
                            }
                        }}
                        exit={{
                            clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
                            opacity: 0,
                            transition: {
                                duration: 0.9,
                                ease: [0.33, 1, 0.68, 1]
                            }
                        }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 2,
                            backgroundColor: '#ccc',
                            pointerEvents: 'none',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                    delay: 0.3,
                                    duration: 0.5,
                                    ease: [0.33, 1, 0.68, 1]
                                }
                            }}
                            exit={{
                                opacity: 0,
                                transition: { duration: 0.2 }
                            }}
                            style={{
                                color: '#000',
                                fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                                textAlign: 'center',
                                padding: '2rem',
                                maxWidth: '800px'
                            }}
                        >
                            <center >
                                <h1>Tip:</h1>
                                <p>{randomTip}</p>
                            </center>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export default TransitionWrapper;