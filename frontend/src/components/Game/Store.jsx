import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreItems } from '../../utils/api'; 
const Store = ({ playerData, purchaseItemAndRefresh, setGameActive }) => {
    const [selectedCategory, setSelectedCategory] = useState('weapons');
    const [storeItems, setStoreItems] = useState({ // Structure to hold fetched items
        weapons: [],
        turrets: [],
        orbs: [],
        skills: [],
        ultimates: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchaseError, setPurchaseError] = useState(null); // Specific error for purchases
    const navigate = useNavigate();

    // Fetch store items from API on component mount
    useEffect(() => {
        const fetchItems = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await getStoreItems();
                // Group items by category
                const itemsByCategory = response.data.reduce((acc, item) => {
                    const category = item.category.toLowerCase();
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    // Map to the structure your component expects
                    acc[category].push({
                        id: item.id, // This is the unique itemId or weapon name
                        name: item.name,
                        price: item.price,
                        description: item.description,
                        category: category, // Store category for purchase call
                        available: item.available,
                    });
                    return acc;
                }, { weapons: [], turrets: [], orbs: [], skills: [], ultimates: [] }); // Ensure all categories exist

                setStoreItems(itemsByCategory);
            } catch (err) {
                console.error("Failed to fetch store items:", err);
                setError("Could not load store items. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchItems();
    }, []);


    const handleExit = () => {
        // setGameActive(false); // Decide if this state is still needed
        navigate('/');
    };

    const handlePurchase = async (item) => {
        setPurchaseError(null); // Clear previous purchase error
        if (playerData.currency < item.price) {
             alert("Not enough currency!"); // Keep simple alert or use state for message
             return;
        }
        if (!item.available) {
            alert("This item is not currently available.");
            return;
        }

        try {
             console.log(`Attempting purchase: ID=${item.id}, Category=${item.category}`);
            // Call the function passed from App.js which handles API call + refresh
            await purchaseItemAndRefresh(item.id, item.category);
            console.log(`Purchased ${item.name}!`);
            // Play success sound or show temporary success message
        } catch (err) {
            console.error(`Purchase failed for ${item.name}:`, err);
             // Display the specific error message from the API if available
             setPurchaseError(err.message || "Purchase failed. Please try again.");
             // Optionally show an alert: alert("Purchase failed!");
        }
    };

    const isItemOwned = (itemId, category) => {
        if (!playerData || !playerData.ownedItems) return false;

        if (category === 'weapons') {
            return playerData.ownedItems.weapons?.includes(itemId);
        }
        // Check other categories
        const ownedCategoryItems = playerData.ownedItems[category];
        return ownedCategoryItems?.includes(itemId);
      };

    // --- Render Logic ---
    if (isLoading) {
        return <div className="store-container"><h2>Loading Store...</h2></div>;
    }
    if (error) {
        return <div className="store-container"><h2>{error}</h2><button onClick={handleExit}>Back</button></div>;
    }


    return (
        <div className="store-container">
            <div className="store-header">
                <h2>STORE</h2>
                <div className="currency-display">
                    {/* Display currency from playerData prop */}
                    <span>Currency: {playerData?.currency ?? 0}</span>
                </div>
                <button onClick={handleExit} className="exit-button">Exit Store</button>
            </div>
            {purchaseError && <p className="error-message purchase-error">{purchaseError}</p>}

            <div className="store-categories">
                {/* Buttons to select category */}
                 {Object.keys(storeItems).map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={selectedCategory === category ? 'active' : ''}
                    >
                        {/* Capitalize category name for display */}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                ))}
            </div>

            <div className="store-items">
                 {storeItems[selectedCategory] && storeItems[selectedCategory].length > 0 ? (
                     storeItems[selectedCategory].map(item => {
                        const owned = isItemOwned(item.id, item.category);
                        const canAfford = playerData && playerData.currency >= item.price;
                        return (
                            <div
                                key={item.id}
                                className={`store-item ${owned ? 'owned' : ''} ${!item.available ? 'unavailable' : ''}`}
                            >
                                <h3>{item.name}</h3>
                                <p>{item.description}</p>
                                <div className="item-footer">
                                    <span>Price: {item.price}</span>
                                    {item.available ? (
                                        owned ? (
                                            <span className="owned-label">OWNED</span>
                                        ) : (
                                            <button
                                                onClick={() => handlePurchase(item)}
                                                disabled={!canAfford}
                                                className="buy-button"
                                            >
                                                Buy
                                            </button>
                                        )
                                    ) : (
                                        <span className="coming-soon">Unavailable</span>
                                    )}
                                </div>
                            </div>
                        );
                     })
                 ) : (
                    <p>No items available in this category.</p>
                 )}
            </div>

        </div>
    );
};

export default Store;