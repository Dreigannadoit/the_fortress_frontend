import React from 'react'

const PassiveSkillCheckboxes = ({ skills, toggleSkill }) => (
    <div className="passive-skills-ui">
        {Object.entries(skills).map(([skill, isActive]) => (
            <label key={skill}>
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleSkill(skill)}sa
                />
                {skill.charAt(0).toUpperCase() + skill.slice(1)}
            </label>
        ))}
    </div>
);

export default PassiveSkillCheckboxes