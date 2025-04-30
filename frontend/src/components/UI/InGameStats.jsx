import React from 'react'
import { RockSpell, rockSpellSound, Slingshot, slingshotSound, WizardWand, wizardWandSound } from '../../assets';

const InGameStats = ({
    currentWeapon,
    currentAmmo,
    isReloading,
    reloadTime,
    playerHealth,
    playerInitialHealth,
    baseHealth,
    baseInitialHealth,
    score,
    timeElapsed,
    gameDuration
}) => {
    const timeLeft = Math.max(0, gameDuration - timeElapsed);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    const playerHealthPercentage = (playerHealth / playerInitialHealth) * 100;
    const baseHealthPercentage = (baseHealth / baseInitialHealth) * 100;
    return (
        <div className='game_gui '>
            <PlayerGameDisplay playerHealthPercentage={playerHealthPercentage} />


            <BaseGameDisplay baseHealthPercentage={baseHealthPercentage} />

            <CountDownDisplay minutes={minutes} seconds={seconds} />

            <WeaponDisplay currentWeapon={currentWeapon} currentAmmo={currentAmmo} isReloading={isReloading} reloadTime={reloadTime} />
        </div>
    );
}

const ScoreDisplay = ({ score }) => {
    return (
        <div>Score: {score}</div>
    )
}

const CountDownDisplay = ({ minutes, seconds }) => {
    return (
        <div className='countdown'>{minutes}:{seconds.toString().padStart(2, '0')}</div>
    )
}

const WeaponDisplay = ({ currentWeapon, currentAmmo, isReloading, reloadTime }) => {
    return (
        <>
            <div className="current_weapon_preview">
                <img
                    src={
                        currentWeapon.name === 'pistol' ? Slingshot :
                            currentWeapon.name === 'shotgun' ? WizardWand :
                                currentWeapon.name === 'machinegun' ? RockSpell :
                                    ''
                    }
                    alt=""
                />
            </div>

            <h3 className="current_weapon_preview_text">
                {`${currentWeapon.name === 'pistol' ? "Slingshot" :
                    currentWeapon.name === 'shotgun' ? "Wizard Wand" :
                        currentWeapon.name === 'machinegun' ? "Rock Spell" : ""
                    }`}
            </h3>
            <p className="current_ammo_text">Ammo: {currentAmmo} / {currentWeapon.maxAmmo}</p>

            <div
                className={`reloading_display ${isReloading ? "Relaoding" : ""}`}
            >
                <p>{isReloading ? `Reloading` : ""}</p>
                <p>{Math.ceil(reloadTime)}ms</p>
            </div>
        </>
    )
}

const PlayerGameDisplay = ({ playerHealthPercentage }) => {
    return (
        <div className='healthbar'>
            <div style={{
                width: '100%',
                height: '20px',
                backgroundColor: '#ddd',
                overflow: 'hidden',
            }}>
                <p>Player Health</p>
                <div style={{
                    width: `${playerHealthPercentage}%`,
                    height: '100%',
                    backgroundColor: playerHealthPercentage > 50 ? 'gold' : playerHealthPercentage > 20 ? 'orange' : 'red',
                    transition: 'width 0.3s ease'
                }} />
            </div>
        </div>
    )
}

const BaseGameDisplay = ({ baseHealthPercentage }) => {
    return (
        <div className='baseHealth'>
            <div style={{
                width: '100%',
                height: '20px',
                backgroundColor: '#ddd',
                overflow: 'hidden',
            }}>
                <p>Wall Durability</p>
                <div style={{
                    width: `${baseHealthPercentage}%`,
                    height: '100%',
                    backgroundColor: baseHealthPercentage > 50 ? 'skyblue' : baseHealthPercentage > 20 ? 'orange' : 'red',
                    transition: 'width 0.3s ease'
                }} />
            </div>
        </div>
    )
}



export default InGameStats