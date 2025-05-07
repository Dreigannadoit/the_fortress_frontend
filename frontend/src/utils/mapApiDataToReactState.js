// Helper to map API response to React state structure
const mapApiDataToReactState = (apiData) => {
    if (!apiData) return null;
    return {
        currency: apiData.currency,
        level: apiData.level,
        kills: apiData.kills,
        highestScore: apiData.highestScore,
        ownedItems: {
            weapons: apiData.ownedWeaponNames || ['pistol'], // Default to pistol if empty
            turrets: apiData.ownedItemsByCategory?.turrets || [],
            orbs: apiData.ownedItemsByCategory?.orbs || [],
            skills: apiData.ownedItemsByCategory?.skills || [],
            ultimates: apiData.ownedItemsByCategory?.ultimates || [],
        },
        currentWeapon: apiData.currentWeaponName || 'pistol',
        activeSkills: apiData.activeSkillIds || [],
    };
};

export default mapApiDataToReactState;