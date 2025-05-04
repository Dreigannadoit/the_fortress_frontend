import React from 'react'
import { RockSpell, Slingshot, WizardWand } from '../../assets'

const PlayerStats = ({ active, ownedWeapons, playerData, ownedSkills, username }) => {
    return (
        <div className={`stats_player ${active ? 'active' : ''}`}>
            <div className="stats_player__title">
                <h1>Player Details</h1>
            </div>
            <div className="stats_player__content">
                <div className="stats_player__content__item">
                    Username: {username || 'Player'}
                </div>
                <div className="stats_player__content__item">
                    Level: {playerData?.level || 0}
                </div>
                <div className="stats_player__content__item">
                    Highest Score: {playerData?.highestScore || 0}
                </div>
                <div className="stats_player__content__item">Kills: {playerData?.kills || 0}</div>
                <div className="stats_player__content__item">
                    Unlocked Weapons:
                    {ownedWeapons.length > 0 ? (
                        <div>
                            {ownedWeapons.map((weapon, index) => (
                                <div className="img" key={index}>
                                    <img src={
                                        weapon === 'pistol' ? Slingshot :
                                            weapon === 'shotgun' ? WizardWand :
                                                weapon === 'machinegun' ? RockSpell : null
                                    } alt="" />
                                    <p>
                                        {
                                            weapon === 'pistol' ? "Slingshot" :
                                                weapon === 'shotgun' ? "WizardWand" :
                                                    weapon === 'machinegun' ? "RockSpell" : ""
                                        }
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span> None</span>
                    )}
                </div>
                <div className="stats_player__content__item">
                    Active Skills: 
                    <div>
                            {ownedSkills.map((skills, index) => (
                                <ul key={index}>
                                    <li>{skills}</li>
                                </ul>
                            ))}
                        </div>
                </div>
            </div>
        </div>
    )
}

export default PlayerStats