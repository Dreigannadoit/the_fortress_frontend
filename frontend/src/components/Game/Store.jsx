import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreItems, purchaseItemApi } from '../../utils/api'; 
import { AppContext } from '../../App'; 
import LoadingSpinner from '../UI/LoadingSpinner';

const Store = ({ setGameActive, fetchData }) => { 
    const { playerData } = useContext(AppContext); 
    const [selectedCategory, setSelectedCategory] = useState('weapons');
    const [storeItems, setStoreItems] = useState(null); // Use state for API items
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchaseError, setPurchaseError] = useState(null); // Specific error for purchases
    const [isPurchasing, setIsPurchasing] = useState(false); // Loading state for purchase button

    const navigate = useNavigate();

    // Fetch store items on mount
    useEffect(() => {
        const fetchItems = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await getStoreItems();
                // Group items by category for easier access
                const groupedItems = response.data.reduce((acc, item) => {
                    const category = item.category.toLowerCase();
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push(item);
                    return acc;
                }, {});
                setStoreItems(groupedItems);
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
        setGameActive(false); // This prop might be removable if App level handles routes better
        navigate('/');
    };

    const handlePurchase = async (item) => {
        setIsPurchasing(true);
        setPurchaseError(null); // Clear previous purchase errors
        try {
            // Call the API to purchase
            await purchaseItemApi(item.id, item.category);
            // Refresh player data from the server to update currency and owned items
            await fetchData(false); // Fetch data without global loading indicator
            console.log(`Purchased ${item.name}!`);
            // Optional: Show success message
        } catch (err) {
            console.error("Purchase failed:", err);
            const errorMsg = err.response?.data || "Purchase failed. Not enough currency or item already owned?";
            setPurchaseError(errorMsg); // Display error message near the button or globally
            alert(errorMsg); // Simple alert for now
        } finally {
            setIsPurchasing(false);
        }
    };

    // Check ownership based on playerData from context
    const isItemOwned = (itemId, category) => {
        if (!playerData || !playerData.ownedItems) return false;

        if (category === 'weapons') {
            return playerData.ownedItems.weapons?.includes(itemId);
        } else {
            return playerData.ownedItems[category]?.includes(itemId);
        }
        // const ownedCategoryList = category === 'weapons'
        //     ? playerData.ownedItems.weapons
        //     : playerData.ownedItems[category];

        // return ownedCategoryList?.includes(itemId) ?? false;
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="store-container error-message">{error}</div>;
    }

    // Get items for the currently selected category
    const currentCategoryItems = storeItems ? (storeItems[selectedCategory] || []) : [];

    return (
        <div className="store-container">
            <div className="store-header">
                <h2>STORE</h2>
                <div className="currency-display">
                    {/* Use playerData from context */}
                    <span>Currency: {playerData?.currency ?? 0}</span>
                </div>
                <button onClick={handleExit} className="exit-button">Exit Store</button>
            </div>
             {purchaseError && <div className="purchase-error">{purchaseError}</div>} {/* Display purchase errors */}


            <div className="store-categories">
                {/* Make buttons dynamic based on fetched categories if needed */}
                 {storeItems && Object.keys(storeItems).map(category => (
                     <button
                         key={category}
                         onClick={() => setSelectedCategory(category)}
                         className={selectedCategory === category ? 'active' : ''}
                         // Capitalize first letter for display
                         style={{ textTransform: 'capitalize'}}
                     >
                         {/* Replace underscores if your categories have them */}
                         {category.replace('_', ' ')}
                     </button>
                 ))}
            </div>

            <div className="store-items">
                {currentCategoryItems.length > 0 ? currentCategoryItems.map(item => (
                    <div
                        key={item.id}
                        className={`store-item ${isItemOwned(item.id, item.category) ? 'owned' : ''} ${!item.available ? 'unavailable' : ''}`}
                        style={{ backgroundColor: !item.available ? 'rgba(255, 0, 0, 0.4)' : '' }}
                    >
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="item-footer">
                            <span>Price: {item.price}</span>
                            {item.available ? (
                                isItemOwned(item.id, item.category) ? (
                                    <span className="owned-label">OWNED</span>
                                ) : (
                                    <button
                                        onClick={() => handlePurchase(item)}
                                        disabled={playerData.currency < item.price || isPurchasing}
                                    >
                                        {isPurchasing ? 'Buying...' : 'Buy'}
                                    </button>
                                )
                            ) : (
                                <span className="coming-soon">Will be added in future updates</span>
                            )}
                        </div>
                    </div>
                )) : (
                    <p>No items available in this category.</p>
                )}
            </div>
        </div>
    );
};

export default Store;