        /* ======================================================================
           ACTIVE MUSIC GAME REGISTRY
           ----------------------------------------------------------------------
           Add, modify, or update game listings below. Make sure paths match 
           exactly.
           ====================================================================== */
        // Games that have a published video. The PUBLIC arcade (arcade.html) lists only these; the full
        // arcade (music_arcade.html, for teacher/testing devices) lists everything. Add a file name here
        // the day its video goes live.
        const PUBLISHED = ['name_that_part.html'];

        const GAMES = [
            {
                title: "Line & Space Safari",
                description: "Help Melody and Barnaby sort notes! Perfect for visual training on whether notes sit on a line or cozy in a space.",
                emoji: "🦒",
                color: "#f97316", // Orange accent
                file: "line_and_space_safari.html",
                comingSoon: false
            },
            {
                title: "Stave Explorer",
                description: "Learn notes step-by-step from Middle C onwards. Featuring progressive levels, health hearts, and treble vs bass staves.",
                emoji: "🎼",
                color: "#10b981", // Green accent
                file: "stave_explorer_game.html",
                comingSoon: false
            },
            {
                title: "Find the piano note",
                description: "Locate the note on a piano keyboard.",
                emoji: "🎹",
                color: "#ec4899", // Pink accent
                file: "stave_piano_explorer.html",
                comingSoon: false
            },
            {
                title: "Alphabet Elevator",
                description: "Ride the elevator through the music alphabet - only 7 letters, A to G, then it loops right back round!",
                emoji: "🔤",
                color: "#14b8a6", // Teal accent
                file: "alphabet_elevator.html",
                comingSoon: false
            },
            {
                title: "Black Key Patterns",
                description: "Spot the black keys in their cozy groups of two and three to find your way around the keyboard.",
                emoji: "🎹",
                color: "#06b6d4", // Cyan accent
                file: "black_key_patterns.html",
                comingSoon: false
            },
            {
                title: "C Hunt",
                description: "Track down every hiding C on the keyboard before the clock runs out on the hardest stage!",
                emoji: "🔍",
                color: "#84cc16", // Lime accent
                file: "c_hunt.html",
                comingSoon: false
            },
            {
                title: "Clef Detective",
                description: "Put on your detective hat and crack the case - is it a treble clef or a bass clef?",
                emoji: "🕵️",
                color: "#6366f1", // Indigo accent
                file: "clef_detective.html",
                comingSoon: false
            },
            {
                title: "Finger Number Fun",
                description: "Thumb is 1, pinky is 5 - match the finger number to the right key on the keyboard.",
                emoji: "🖐️",
                color: "#d946ef", // Fuchsia accent
                file: "finger_numbers.html",
                comingSoon: false
            },
            {
                title: "Higher, Lower or Same?",
                description: "Compare two notes on the stave and decide: is the second one higher, lower, or just the same?",
                emoji: "↕️",
                color: "#f43f5e", // Rose accent
                file: "higher_lower_same.html",
                comingSoon: false
            },
            {
                title: "Name That Part",
                description: "Something on the stave is glowing - is it the stave, the clef, a note, a line, a space or a ledger line? Name it!",
                emoji: "🏷️",
                color: "#ca8a04", // Amber accent
                file: "name_that_part.html",
                comingSoon: false
            },
            {
                title: "How Long Is the Note?",
                description: "Crotchet, minim or semibreve? Look at the note and name how long it lasts.",
                emoji: "⏱️",
                color: "#e11d48", // Rose accent
                file: "note_lengths.html",
                comingSoon: false
            },
            {
                title: "White Note Step or Skip",
                description: "Using only the white keys, work out whether you're hearing a step or a skip.",
                emoji: "👣",
                color: "#0ea5e9", // Sky accent
                file: "step_or_skip.html",
                comingSoon: false
            },
            {
                title: "Space Face",
                description: "The treble clef's spaces spell F-A-C-E — learn to name every one, then the lines around them.",
                emoji: "😀",
                color: "#7c3aed", // Violet accent
                file: "space_face.html",
                comingSoon: false
            },
            {
                title: "Moo Clef",
                description: "All Cows Eat Grass! Name the bass clef's spaces (A-C-E-G), then the lines around them.",
                emoji: "🐄",
                color: "#92400e", // Amber/brown accent
                file: "moo_clef.html",
                comingSoon: false
            },
            {
                title: "Face Finder",
                description: "Same F-A-C-E notes as Space Face, now find them for real on a piano keyboard.",
                emoji: "🎹",
                color: "#2563eb", // Blue accent
                file: "face_finder.html",
                comingSoon: false
            },
            {
                title: "Moo Keys",
                description: "Same A-C-E-G notes as Moo Clef, now find them for real on a piano keyboard.",
                emoji: "🎹",
                color: "#dc2626", // Red accent
                file: "moo_keys.html",
                comingSoon: false
            },
            {
                title: "Ear Training Island",
                description: "Listen closely to beautiful melodic intervals played by our guides and try to match the correct sequence.",
                emoji: "👂",
                color: "#3b82f6", // Blue accent
                file: "ear_island.html",
                comingSoon: true
            },
            {
                title: "Circle of Fifths Spin",
                description: "Spin the magic wheel to discover chord matching families, relative key minors, and sharp/flat patterns.",
                emoji: "🎡",
                color: "#eab308", // Yellow accent
                file: "circle_fifths.html",
                comingSoon: true
            },
            {
                title: "Mascots' Sandbox Piano",
                description: "Play your favorite songs on a digital interactive mini-keyboard with feedback from Melody and Barnaby.",
                emoji: "🎹",
                color: "#8b5cf6", // Purple accent
                file: "sandbox_piano.html",
                comingSoon: true
            }
        ];

        function hexToRgba(hex, alpha) {
            const h = hex.replace('#','');
            const r = parseInt(h.substring(0,2),16);
            const g = parseInt(h.substring(2,4),16);
            const b = parseInt(h.substring(4,6),16);
            return `rgba(${r},${g},${b},${alpha})`;
        }

        const grid = document.getElementById('games-grid');

        document.querySelectorAll('[data-mascot]').forEach(el => { el.outerHTML = MASCOTS.html(el.dataset.mascot, el.dataset.class); });
        const MODE = window.ARCADE_MODE || 'all';
        const VISIBLE = MODE === 'published' ? GAMES.filter(g => PUBLISHED.includes(g.file) && !g.comingSoon) : GAMES;
        if (MODE === 'published') {
            grid.className = 'flex flex-wrap justify-center gap-8';   // a few cards: centre them
            const foot = document.querySelector('footer');
            if (foot) foot.textContent = '🎶 A new game arrives with every new video - see you next Nugget!';
        }

        VISIBLE.forEach(game => {
            // Build the card
            const card = document.createElement('div');
            card.className = 'card relative p-6 flex flex-col items-center text-center' + (MODE === 'published' ? ' w-full sm:w-80' : '');

            // "Coming Soon" badge
            if (game.comingSoon) {
                const ribbon = document.createElement('div');
                ribbon.className = 'absolute top-4 right-4 bg-yellow-400 text-yellow-950 font-black text-xs px-3 py-1 rounded-full shadow-sm uppercase tracking-wide';
                ribbon.textContent = 'Coming soon';
                card.appendChild(ribbon);
            } else if (typeof GameProgress !== 'undefined') {
                // Completion / progress-toward-completion badge, read from the
                // same localStorage each game itself writes to via
                // GameProgress.stageCleared() - see game-progress.js.
                const gameId = game.file.replace(/\.html?$/i, '');
                const entry = GameProgress.getSummary()[gameId];
                if (entry && entry.completed) {
                    const ribbon = document.createElement('div');
                    ribbon.className = 'absolute top-4 right-4 bg-emerald-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-sm uppercase tracking-wide';
                    ribbon.textContent = '✓ Complete';
                    card.appendChild(ribbon);
                } else if (entry && entry.clefs && (entry.clefs.treble.stagesCleared.length > 0 || entry.clefs.bass.stagesCleared.length > 0)) {
                    // Clef-tracking games (see game-progress.js) only count as
                    // complete once BOTH clefs clear every stage, so the
                    // in-progress badge shows both counts, not one flat total.
                    const ribbon = document.createElement('div');
                    ribbon.className = 'absolute top-4 right-4 bg-white text-slate-700 font-black text-xs px-3 py-1 rounded-full shadow-sm uppercase tracking-wide border-2 border-slate-200 text-right leading-tight';
                    ribbon.innerHTML = `🎼${entry.clefs.treble.stagesCleared.length}/${entry.totalStages || 3}<br>𝄢${entry.clefs.bass.stagesCleared.length}/${entry.totalStages || 3}`;
                    card.appendChild(ribbon);
                } else if (entry && entry.stagesCleared.length > 0) {
                    const ribbon = document.createElement('div');
                    ribbon.className = 'absolute top-4 right-4 bg-white text-slate-700 font-black text-xs px-3 py-1 rounded-full shadow-sm uppercase tracking-wide border-2 border-slate-200';
                    ribbon.textContent = `Stage ${entry.stagesCleared.length}/${entry.totalStages || 3}`;
                    card.appendChild(ribbon);
                }
            }

            // Game Emoji Icon Badge with styled background gradient
            const badge = document.createElement('div');
            badge.className = 'w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-md';
            badge.style.background = `linear-gradient(180deg, ${hexToRgba(game.color, 0.2)}, ${hexToRgba(game.color, 0.55)})`;
            badge.style.border = `3px solid ${game.color}`;
            badge.textContent = game.emoji;
            card.appendChild(badge);

            // Title
            const title = document.createElement('h2');
            title.className = 'text-xl font-bold text-slate-800 mb-2';
            title.textContent = game.title;
            card.appendChild(title);

            // Description
            const p = document.createElement('p');
            p.className = 'text-slate-500 text-sm font-semibold mb-6 flex-grow leading-relaxed';
            p.textContent = game.description;
            card.appendChild(p);

            // Play button link
            const btn = document.createElement('a');
            btn.className = 'play-btn w-full py-3 px-6 rounded-2xl font-extrabold text-white text-md border-b-4 hover:brightness-105 active:scale-95 transition-all' + (game.comingSoon ? ' opacity-50 cursor-not-allowed pointer-events-none' : '');
            btn.textContent = game.comingSoon ? 'Locked' : 'Play Adventure ▶';
            
            // Set dynamic button gradient coloring
            btn.style.background = `linear-gradient(180deg, ${game.color}, ${hexToRgba(game.color, 0.85)})`;
            btn.style.borderColor = hexToRgba(game.color, 0.9);

            if (!game.comingSoon) {
                // Same tab, not target="_blank" - the game replaces this
                // screen, and back-link.js (in every game) is the way back.
                btn.href = game.file;
            } else {
                btn.href = '#';
                btn.addEventListener('click', e => e.preventDefault());
            }
            card.appendChild(btn);

            grid.appendChild(card);
        });
    