/* The opening of eight traditional carols (all out of copyright), in C, for Name That Carol (the game and the Shorts).
 * notes: [midi, beats]  (60 = Middle C).  beat: seconds per crotchet.  time: beats per bar (for the stave).
 * Arrangements simplified for young ears; dotted rhythms kept where they are the tune's fingerprint.
 * Checked against the carols as sung in the UK. Used by name_that_carol.html and shorts/name_that_carol.html. */
window.CAROLS = [
  { id: "jingle", title: "Jingle Bells", emoji: "🔔", color: "#c8102e", beat: 0.42, time: 4,
    notes: [[64,1],[64,1],[64,2],[64,1],[64,1],[64,2],[64,1],[67,1],[60,1.5],[62,0.5],[64,4]] },
  { id: "silent", title: "Silent Night", emoji: "🌟", color: "#2e2a6b", beat: 0.52, time: 3,
    notes: [[67,1.5],[69,0.5],[67,1],[64,3],[67,1.5],[69,0.5],[67,1],[64,3]] },
  { id: "deck", title: "Deck the Halls", emoji: "🌿", color: "#1f7a4d", beat: 0.36, time: 4,
    notes: [[67,1.5],[65,0.5],[64,1],[62,1],[60,1],[62,1],[64,1],[60,1],[62,0.5],[64,0.5],[65,0.5],[62,0.5],[64,1.5],[62,0.5],[60,1],[59,1],[60,2]] },
  { id: "wish", title: "We Wish You a Merry Christmas", emoji: "🎁", color: "#db2777", beat: 0.4, time: 3,
    notes: [[67,1],[72,1],[72,0.5],[74,0.5],[72,0.5],[71,0.5],[69,1],[69,1],[69,1],[74,1],[74,0.5],[76,0.5],[74,0.5],[72,0.5],[71,1],[67,1]] },
  { id: "joy", title: "Joy to the World", emoji: "🌍", color: "#0d9488", beat: 0.45, time: 4,
    notes: [[72,2],[71,1.5],[69,0.5],[67,3],[65,1],[64,2],[62,2],[60,4]] },
  { id: "hark", title: "Hark! The Herald Angels Sing", emoji: "👼", color: "#f59e0b", beat: 0.45, time: 4,
    notes: [[67,1],[72,1],[72,1.5],[71,0.5],[72,1],[76,1],[76,1],[74,1],[79,1],[79,1],[79,1.5],[77,0.5],[76,1],[74,1],[76,2]] },
  { id: "wenceslas", title: "Good King Wenceslas", emoji: "👑", color: "#7c3aed", beat: 0.42, time: 4,
    notes: [[60,1],[60,1],[60,1],[62,1],[60,1],[60,1],[55,2],[57,1],[55,1],[57,1],[59,1],[60,2],[60,2]] },
  { id: "twelve", title: "The Twelve Days of Christmas", emoji: "🐦", color: "#ea580c", beat: 0.38, time: 4,
    notes: [[67,0.5],[67,0.5],[67,1],[72,0.5],[72,0.5],[72,1],[71,0.5],[72,0.5],[74,0.5],[76,0.5],[77,0.5],[74,0.5],[76,2]] },
];
window.NOTE_NAME = m => ["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"][m % 12];
