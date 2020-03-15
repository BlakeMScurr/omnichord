import { Chord, ChordBook, ChordSet, Note, NewAbstractNote, AbstractNote, sortNotes, squashNotes, NoteOrder } from "./chords";

test('invert', () => {
    var b = new ChordBook()
    var firstInversion = new Chord(nn("e", 4))
    firstInversion.inversion = 1
    firstInversion.symbol = "C"
    firstInversion.stack("Minor3rd")
    firstInversion.stack("Perfect4th")
    firstInversion.root = nn("c", 4)
    expect(b.make(nn("c", 4), "", true, true).invert(1)).toEqual(firstInversion)
})

test('inversions', ()=>{
    var b = new ChordBook()
    var c = b.make(nn("c", 4), "", true, true)
    expect(c.inversions().map((inv: Chord)=>{return inv.string()})).toEqual(["C", "C/E", "C/G"])
})

test('stack', () => {
    var b = new ChordBook()
    var c = new Chord(nn("b", 4))
    c.stack("Semitone")
    expect(c.highest()).toEqual(nn("c", 5))

    c = new Chord(nn("g", 4))
    c.stack("Perfect4th")
    expect(c.highest()).toEqual(nn("c", 5))
})

test('newabstractnote', () => {
    expect(NoteOrder.indexOf(nn("c", 4).abstract)).toBe(0)
    expect(NoteOrder.indexOf(nn("a", 4).abstract)).toBe(9)
})

test('lower', () => {
    expect(nn("c", 4).lowerThan(nn("c", 5))).toBe(true)
    expect(nn("f", 3).lowerThan(nn("c", 4))).toBe(true)
    expect(nn("f", 5).lowerThan(nn("c", 4))).toBe(false)
    expect(nn("f", 4).lowerThan(nn("c", 4))).toBe(false)
});

test('sorting', () => {
    expect(sortNotes([nn("a", 5), nn("f", 5), nn("d", 5)])).toEqual([nn("d", 5), nn("f", 5), nn("a", 5)])
    expect(sortNotes([nn("c", 5), nn("a", 4), nn("f", 4)])).toEqual([nn("f", 4), nn("a", 4), nn("c", 5)])
    expect(sortNotes([nn("f", 4), nn("a", 4), nn("c", 5)])).toEqual([nn("f", 4), nn("a", 4), nn("c", 5)])
    expect(sortNotes([nn("f", 5), nn("a", 4), nn("c", 5)])).toEqual([nn("a", 4), nn("c", 5), nn("f", 5)])
})

test('recognisingCMajor', () => {
    var b = new ChordBook()
    var notes: Array<Note> = [
        nn("c", 4),
        nn("g", 4),
        nn("e", 4),
    ]
    var recognisedChord = b.recognise(notes)
    var c4MajorTriad = b.make(nn("c", 4), "", true, true)
    var c3MajorTriad = b.make(nn("c", 3), "", true, true)

    expect(recognisedChord).toEqual(c4MajorTriad)
    expect(recognisedChord?.symbol).toEqual(c3MajorTriad.symbol)
});

test('recognisingFMajor', () => {
    var b = new ChordBook()
    var notes: Array<Note> = [
        nn("f", 4),
        nn("a", 4),
        nn("c", 5),
    ]
    var recognisedChord = b.recognise(notes)
    var f4MajorTriad = b.make(nn("f", 4), "", true, true)
    var f3MajorTriad = b.make(nn("f", 3), "", true, true)

    expect(recognisedChord).toEqual(f4MajorTriad)
    expect(recognisedChord?.symbol).toEqual(f3MajorTriad.symbol)
});

test('recognisingFMajorFirstInversion', () => {
    var b = new ChordBook()
    var notes: Array<Note> = [
        nn("f", 5),
        nn("a", 4),
        nn("c", 5),
    ]
    var recognisedChord = b.recognise(notes)
    var f4MajorTriad1st = b.make(nn("f", 5), "", true, true).invert(1)

    expect(recognisedChord).toEqual(f4MajorTriad1st)
});

test('squashingClassicFinalChord', () => {
    expect(squashNotes([
        nn("c", 4),nn("g", 4),nn("e", 5),nn("c", 6)]
    )).toEqual(
        [nn("c", 4),nn("e", 4),nn("g", 4)]
    )

    expect(squashNotes(
        [nn("e", 6), nn("g", 4), nn("g", 5), nn("c", 6)]
    )).toEqual(
        [nn("g", 4), nn("c", 5), nn("e", 5)]
    )
})

test('recognisingExoticVoicings', () => {
    var b = new ChordBook()

    var c4MajorTriad = b.make(nn("c", 4), "", true, true)
    var notes: Array<Note> = [nn("c", 4),nn("g", 4),nn("e", 5),nn("c", 6)]
    var recognisedChord = b.recognise(notes)
    expect(recognisedChord).toEqual(c4MajorTriad)

    var c5MajorTriad = b.make(nn("c", 5), "", true, true)
    notes = [nn("e", 6), nn("g", 4), nn("g", 5), nn("c", 6)]
    var recognisedChord = b.recognise(notes)
    expect(recognisedChord).toEqual(c5MajorTriad.invert(2))
})

function nn(note: string, octave: number) {
    var an = NewAbstractNote(note);
    return new Note((an), octave)
}