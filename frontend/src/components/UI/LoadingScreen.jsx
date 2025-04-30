import { useEffect, useState } from 'react';

const LoadingScreen = ({ onLoaded, assets }) => {
    const [progress, setProgress] = useState(0);
    const [loadedAssets, setLoadedAssets] = useState([]);
    const [showLoading, setShowLoading] = useState(true);

    useEffect(() => {
        if (!assets || assets.length === 0) {
            onLoaded();
            return;
        }

        let loadedCount = 0;
        const totalAssets = assets.length;

        const handleAssetLoad = () => {
            loadedCount++;
            const newProgress = Math.floor((loadedCount / totalAssets) * 100);
            setProgress(newProgress);
            setLoadedAssets(prev => [...prev, assets[loadedCount - 1]]);

            if (loadedCount === totalAssets) {
                setTimeout(() => {
                    setShowLoading(false);
                    setTimeout(onLoaded, 500); // Small delay for fade-out animation
                }, 500);
            }
        };

        assets.forEach(asset => {
            const img = new Image();
            img.src = asset;
            img.onload = handleAssetLoad;
            img.onerror = () => {
                console.error(`Failed to load asset: ${asset}`);
                handleAssetLoad(); // Continue even if some assets fail
            };
        });
    }, [assets, onLoaded]);

    if (!showLoading) return null;

    return (
        <div className="loading-screen">
            <div className="loading-container">
                <h2>Loading Game Assets</h2>
                <div className="progress-bar">
                    <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="progress-text">{progress}%</div>
                
                <div className="loaded-assets">
                    {loadedAssets.slice(-5).map((asset, index) => (
                        <div key={index} className="loaded-asset">
                            ✓ {asset.split('/').pop()}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;