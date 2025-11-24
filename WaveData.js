const WAVES = [
    {
        // Wave 1: Intro
        enemies: [
            { delay: 60, z: 7000, type: 'diver', x: 0 },
            { delay: 120, z: 7000, type: 'diver', x: -200 },
            { delay: 180, z: 7000, type: 'diver', x: 200 },
            { delay: 300, z: 7000, type: 'weaver', x: 0 },
            // More enemies with center bias
            ...Array.from({ length: 10 }, (_, i) => ({
                delay: 400 + i * 100,
                z: 7000,
                type: Math.random() > 0.5 ? 'diver' : 'weaver',
                x: (Math.random() - 0.5) * 3000 * (Math.random() * 0.5) // Center bias
            }))
        ],
        obstacles: [
            // 2.5x more obstacles (~50 per wave)
            ...Array.from({ length: 50 }, (_, i) => ({
                delay: i * 30, // Rapid fire obstacles
                z: 7000,
                type: Math.random() > 0.7 ? 'crystal' : 'pyramid',
                x: (Math.random() - 0.5) * 3000
            }))
        ]
    },
    {
        // Wave 2: Ramp up
        enemies: [
            ...Array.from({ length: 20 }, (_, i) => ({
                delay: 60 + i * 80,
                z: 7000,
                type: Math.random() > 0.3 ? 'sweeper' : 'diver',
                x: (Math.random() - 0.5) * 3000 * (Math.random() * 0.5) // Center bias
            }))
        ],
        obstacles: [
            ...Array.from({ length: 60 }, (_, i) => ({
                delay: i * 25,
                z: 7000,
                type: Math.random() > 0.6 ? 'crystal' : 'pyramid',
                x: (Math.random() - 0.5) * 3000
            }))
        ]
    },
    {
        // Wave 3: Chaos
        enemies: [
            ...Array.from({ length: 30 }, (_, i) => ({
                delay: 60 + i * 60,
                z: 7000,
                type: ['diver', 'weaver', 'sweeper'][Math.floor(Math.random() * 3)],
                x: (Math.random() - 0.5) * 3000 * (Math.random() * 0.5) // Center bias
            }))
        ],
        obstacles: [
            ...Array.from({ length: 80 }, (_, i) => ({
                delay: i * 20,
                z: 7000,
                type: Math.random() > 0.5 ? 'crystal' : 'pyramid',
                x: (Math.random() - 0.5) * 3000
            }))
        ]
    }
];
