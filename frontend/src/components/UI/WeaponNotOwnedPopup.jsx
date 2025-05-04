import React from 'react';

const WeaponNotOwnedPopup = ({ weaponName }) => {
    return (
        <div className="weapon-not-owned-popup pixel-border">
            <h3 className="pixel-font">WEAPON LOCKED</h3>
            <p className="pixel-font">{`${weaponName.toUpperCase()} NOT OWNED`}</p>
        </div>
    );
};

export default WeaponNotOwnedPopup;