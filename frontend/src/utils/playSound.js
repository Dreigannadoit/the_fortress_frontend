function playSound(audio) {
    const clone = audio.cloneNode(); 
    clone.volume = 0.5;
    clone.play();
}

export default playSound;