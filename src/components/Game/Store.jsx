import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Store = ({ playerData, setPlayerData, setGameActive }) => {
    const [selectedCategory, setSelectedCategory] = useState('weapons');
    const navigate = useNavigate();

    // Store inventory
    const storeItems = {
        weapons: [
            { id: 'shotgun', name: 'Wizard Wand', price: 500, description: 'Wide spread, high damage at close range', category: 'weapons' },
            { id: 'machinegun', name: 'Rock Spell', price: 800, description: 'Rapid fire with moderate damage', category: 'weapons' }
        ],
        turrets: [
            { id: 'basic_turret', name: 'Basic Turret', price: 1000, description: 'Automatic targeting with moderate damage', category: 'turrets' },
            { id: 'sniper_turret', name: 'Sniper Turret', price: 1500, description: 'High damage, low rate of fire', category: 'turrets' }
        ],
        orbs: [
            { id: 'defense_orb', name: 'Defense Orb', price: 600, description: 'Protects player from incoming damage', category: 'orbs' },
            { id: 'attack_orb', name: 'Attack Orb', price: 700, description: 'Attacks nearby enemies', category: 'orbs' },
            { id: 'healing_orb', name: 'Healing Orb', price: 800, description: 'Periodically heals player', category: 'orbs' },
            { id: 'support_orb', name: 'Support Orb', price: 900, description: 'Boosts player stats', category: 'orbs' }
        ],
        skills: [
            { id: 'recovery', name: 'Recovery', price: 400, description: 'Slowly regenerate health over time', category: 'skills' },
            { id: 'lifeSteal', name: 'Life Steal', price: 600, description: 'Heal when dealing damage to enemies', category: 'skills' },
            { id: 'thorns', name: 'Thorns', price: 500, description: 'Reflect some damage back to attackers', category: 'skills' },
            { id: 'momentum', name: 'Momentum', price: 450, description: 'Move faster the longer you travel in one direction', category: 'skills' },
            { id: 'fastReload', name: 'Fast Reload', price: 550, description: 'Reduce reload time by 30%', category: 'skills' }
        ]
    };

    const handleExit = () => {
        setGameActive(false);
        navigate('/');
    };

    const handlePurchase = (item) => {
        if (playerData.currency >= item.price) {
            setPlayerData(prev => ({
                ...prev,
                currency: prev.currency - item.price,
                ownedItems: {
                    ...prev.ownedItems,
                    [item.category]: [...prev.ownedItems[item.category], item.id]
                }
            }));
            
            // Play purchase sound or show confirmation
            console.log(`Purchased ${item.name}!`);
        } else {
            // Play error sound or show message
            alert("Not enough currency!");
        }
    };

    const isItemOwned = (itemId) => {
        return playerData.ownedItems[selectedCategory].includes(itemId);
    };

    return (
        <div className="store-container">
            <div className="store-header">
                <h2>STORE</h2>
                <div className="currency-display">
                    {/* Changed from playerCurrency to playerData.currency */}
                    <span>Currency: {playerData.currency}</span>
                </div>
                <button onClick={handleExit} className="exit-button">Exit Store</button>
            </div>

            <div className="store-categories">
                <button
                    onClick={() => setSelectedCategory('weapons')}
                    className={selectedCategory === 'weapons' ? 'active' : ''}
                >
                    Weapons
                </button>
                <button
                    onClick={() => setSelectedCategory('turrets')}
                    className={selectedCategory === 'turrets' ? 'active' : ''}
                >
                    Turrets
                </button>
                <button
                    onClick={() => setSelectedCategory('orbs')}
                    className={selectedCategory === 'orbs' ? 'active' : ''}
                >
                    Orbs
                </button>
                <button
                    onClick={() => setSelectedCategory('skills')}
                    className={selectedCategory === 'skills' ? 'active' : ''}
                >
                    Passive Skills
                </button>
            </div>

            <div className="store-items">
                {storeItems[selectedCategory].map(item => (
                    <div key={item.id} className={`store-item ${isItemOwned(item.id) ? 'owned' : ''}`}>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="item-footer">
                            <span>Price: {item.price}</span>
                            {isItemOwned(item.id) ? (
                                <span className="owned-label">OWNED</span>
                            ) : (
                                <button
                                    onClick={() => handlePurchase(item)}
                                    // Changed from playerCurrency to playerData.currency
                                    disabled={playerData.currency < item.price}
                                >
                                    Buy
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Store;