import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Store = ({ playerData, setPlayerData, setGameActive }) => {
    const [selectedCategory, setSelectedCategory] = useState('weapons');
    const navigate = useNavigate();

    // Store inventory
    const storeItems = {
        weapons: [
            { id: 'shotgun', available: true, name: 'Wizard Wand', price: 500, description: 'Wide spread, high damage at close range', category: 'weapons' },
            { id: 'machinegun', available: true, name: 'Rock Spell', price: 800, description: 'Rapid fire with moderate damage', category: 'weapons' }
        ],
        turrets: [
            { id: 'basic_turret', available: true, name: 'Basic Turret', price: 1000, description: 'Automatic targeting with moderate damage', category: 'turrets' },
            { id: 'sniper_turret', available: false, name: 'Sniper Turret', price: 1500, description: 'High damage, low rate of fire', category: 'turrets' }
        ],
        orbs: [
            { id: 'defense_orb', available: false, name: 'Defense Orb', price: 600, description: 'Protects player from incoming damage', category: 'orbs' },
            { id: 'attack_orb', available: true, name: 'Attack Orb', price: 700, description: 'Attacks nearby enemies', category: 'orbs' },
            { id: 'healing_orb', available: false, name: 'Healing Orb', price: 800, description: 'Periodically heals player', category: 'orbs' },
            { id: 'support_orb', available: false, name: 'Support Orb', price: 900, description: 'Boosts player stats', category: 'orbs' }
        ],
        skills: [
            { id: 'recovery', available: true, name: 'Recovery', price: 400, description: 'Slowly regenerate health over time', category: 'skills' },
            { id: 'lifeSteal', available: true, name: 'Life Steal', price: 600, description: 'Heal when dealing damage to enemies', category: 'skills' },
            { id: 'thorns', available: true, name: 'Thorns', price: 500, description: 'Reflect some damage back to attackers', category: 'skills' },
            { id: 'momentum', available: true, name: 'Momentum', price: 450, description: 'Move faster the longer you travel in one direction', category: 'skills' },
            { id: 'fastReload', available: true, name: 'Fast Reload', price: 550, description: 'Reduce reload time by 30%', category: 'skills' }
        ],
        ultimates: [
            { id: 'dragons_breath', available: false, name: 'Dragons Breath', price: 5000, description: 'Call in a dragon to clear a massive amount of enemies at once', category: 'ultimates' }
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
        const ownedCategory = playerData.ownedItems[selectedCategory];
        if (!ownedCategory) return false;
        return ownedCategory.includes(itemId);
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
                <button
                    onClick={() => setSelectedCategory('ultimates')}
                    className={selectedCategory === 'ultimates' ? 'active' : ''}
                >
                    Ultimates
                </button>
            </div>

            <div className="store-items">
                {storeItems[selectedCategory].map(item => (
                    <div
                        key={item.id}
                        className={`store-item ${isItemOwned(item.id) ? 'owned' : ''} ${!item.available ? 'unavailable' : ''}`}
                        style={{ backgroundColor: !item.available ? 'rgba(255, 0, 0, 0.4)' : '' }} // light transparent red
                    >
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="item-footer">
                            <span>Price: {item.price}</span>
                            {item.available ? (
                                isItemOwned(item.id) ? (
                                    <span className="owned-label">OWNED</span>
                                ) : (
                                    <button
                                        onClick={() => handlePurchase(item)}
                                        disabled={playerData.currency < item.price}
                                    >
                                        Buy
                                    </button>
                                )
                            ) : (
                                <span className="coming-soon">Will be added in future updates</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default Store;