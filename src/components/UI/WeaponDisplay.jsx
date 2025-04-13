import React from 'react'

const WeaponDisplay = ({
    currentWeapon,
    currentAmmo,
    isReloading,
    reloadTime,
    playerHealth,
    baseHealth,
    score,
    timeElapsed,
    gameDuration
}) => {
    const timeLeft = Math.max(0, gameDuration - timeElapsed);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return (
        <div className="weapon_display">
            <div>Score: {score}</div>
            <div>Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}</div>
            <div className="key"
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: "10px"
                }}>
                <p className={`${currentWeapon.name === 'pistol' ? "active" : ""}`}>1</p>
                <p className={`${currentWeapon.name === 'shotgun' ? "active" : ""}`}>2</p>
                <p className={`${currentWeapon.name === 'machinegun' ? "active" : ""}`}>3</p>
            </div>
            <h3>Weapon: {currentWeapon.name}</h3>
            <p>Ammo: {currentAmmo} / {currentWeapon.maxAmmo}</p>
            <p>{isReloading ? `Reloading... ${Math.ceil(reloadTime)}mas` : "Ready to fire"}</p>
            <p>Player Health: {playerHealth}</p>
            <p>Base Health: {baseHealth}</p>
        </div>
    );
};

export default WeaponDisplay