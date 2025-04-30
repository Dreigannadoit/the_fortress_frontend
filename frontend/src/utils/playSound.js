function playSound(audio) {
    const clone = audio.cloneNode(); // Create a new instance
    clone.volume = 0.4; // optional: set volume
    clone.play();
}

export default playSound;