export const getRandomEnemyType = () => {
    const spawnRates = {
        normal: ENEMY_NORMAL_WEIGHT,
        fast: ENEMY_FAST_WEIGHT,
        tank: ENEMY_TANK_WEIGHT,
    };
    const random = Math.random();
    let cumulative = 0;
    for (const type in spawnRates) {
        cumulative += spawnRates[type];
        if (random < cumulative) {
            return type;
        }
    }
    return 'normal';
};