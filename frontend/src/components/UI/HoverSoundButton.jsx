import React from 'react';
import { buttons } from '../../assets';

const HoverSoundButton = ({ children, className = '', ...props }) => {
  const playHoverSound = () => {
    const audio = new Audio(buttons); // Create a new instance each time
    audio.currentTime = 0; // Rewind to start (optional)
    audio.play().catch((e) => console.log('Sound blocked', e));
  };

  return (
    <button
      {...props}
      onMouseEnter={playHoverSound}
      onTouchStart={playHoverSound}
      className={`menu-button ${className}`}
    >
      {children}
    </button>
  );
};

export default HoverSoundButton;