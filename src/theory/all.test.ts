import { Chord, ChordBook, ChordSet, Note, NewAbstractNote, AbstractNote } from "./chords";

test('sortNotes', () => {

});

test('recognisingCMajor', () => {
    var b = new ChordBook()
    var notes: Array<Note> = [
        nn("c", 4),
        nn("e", 4),
        nn("g", 4),
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

function nn(note: string, octave: number) {
    var an = NewAbstractNote(note);
    return new Note((an), octave)
}