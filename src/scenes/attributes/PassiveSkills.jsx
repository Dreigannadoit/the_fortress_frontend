export const PassiveSkills = {
    // Recovery: Heal after 5 seconds without taking damage
    recovery: (player, isActive) => {
        if (!isActive) return;
        const now = Date.now();
        const timeSinceDamage = now - player.lastDamageTime;
    
        if (timeSinceDamage >= 5000) { // Start healing after 10s
            if (!player.lastHealTime || now - player.lastHealTime >= 15000) { // Heal every 1s
                const healAmount = player.maxHealth * 0.005;
                player.heal(healAmount);
                player.lastHealTime = now;
            }
        }
    },

    // Life Steal: Heal percentage of damage dealt
    lifeSteal: (damageDealt, isActive) => {
        if (!isActive) return 0;
        return damageDealt * 0.05; // 5% of damage as healing
    },

    // Thorns: Reflect damage to attacker
    thorns: (damageReceived, attacker, isActive) => {
        if (!isActive || !attacker) return;
        const reflectedDamage = damageReceived * 0.2;
        attacker.takeDamage(reflectedDamage);
    },

    // Momentum: Increase speed after not taking damage
    momentum: (player, isActive) => {
        if (!isActive) return 1.0;
        const timeSinceDamage = Date.now() - player.lastDamageTime;
        return timeSinceDamage > 3000 ? 2 : 1.0; // 30% boost
    },

    fastReload: (player, isActive) => {},
};