import React from 'react'

const CreditsBlock = ({showCredits, setShowCredits}) => {
    return (
        <div className={`pixel-credits-tab ${showCredits ? 'show' : ''}`}>
            <div className="pixel-credits-header">
                <h2>🎮 CREDITS</h2>
                <button className="pixel-close-btn" onClick={() => setShowCredits(false)}>✕</button>
            </div>

            <div className="pixel-section">
                <h3>👨‍💻 DEVELOPMENT</h3>
                <ul>
                    <li>
                        <strong>ROBERT BAMBA</strong> – DEVELOPER<br />
                        <a href="https://dreiabmab.com" target="_blank" rel="noreferrer">Portfolio</a>
                    </li>
                </ul>
            </div>


            <div className="pixel-section">
                <h3>🎵 MUSIC</h3>
                <ul>
                    <li>
                        <strong>DJARTMUSIC</strong> – The Return Of The 8-bit Era<br />
                        <a href="https://pixabay.com/music/search/genre/video%20games/" target="_blank" rel="noreferrer">pixabay.com/music</a>
                    </li>
                    <li>
                        <strong>DJARTMUSIC</strong> – Best Game Console<br />
                        <a href="https://pixabay.com/music/search/genre/video%20games/" target="_blank" rel="noreferrer">pixabay.com/music</a>
                    </li>
                    <li>
                        <strong>Grand_Project</strong> – Breath of Life (10 min)<br />
                        <a href="https://pixabay.com/music/meditationspiritual-breath-of-life-10-minutes-320859/" target="_blank" rel="noreferrer">pixabay.com/music</a>
                    </li>
                </ul>
            </div>

            <div className="pixel-section">
                <h3>🔊 SFX</h3>
                <a href="https://pixabay.com" target="_blank" rel="noreferrer">pixabay.com</a>
            </div>

            <div className="pixel-section">
                <h3>🎨 GRAPHICS</h3>
                <ul>
                    <li>
                        pixel-boy – Ninja Adventure<br />
                        <a href="https://pixel-boy.itch.io/ninja-adventure-asset-pack" target="_blank" rel="noreferrer">itch.io</a>
                    </li>
                    <li>
                        Sideshop by faxdoc<br />
                        <a href="https://www.deviantart.com/faxdoc/art/Sideshop-566561669" target="_blank" rel="noreferrer">deviantart.com</a>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default CreditsBlock