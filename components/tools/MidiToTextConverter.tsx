import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FileUp, Download, Play, Pause, Square, Music, FileText, Settings, Search, RefreshCw, Layers, Copy, Check, Filter } from 'lucide-react';

// Formats
type ExportFormat = 'text' | 'csv' | 'json' | 'yaml' | 'midicsv';

// Encoding types for metadata strings
type StringEncoding = 'utf-8' | 'shift-jis' | 'ascii';

interface MidiHeader {
  format: number;
  numTracks: number;
  ticksPerBeat: number;
}

interface MidiEvent {
  id: number;
  tick: number;
  timeSec: number;
  track: number;
  type: string;
  channel?: number;
  note?: number;
  noteName?: string;
  velocity?: number;
  controller?: number;
  value?: number;
  program?: number;
  pitch?: number;
  metaType?: number;
  metaName?: string;
  text?: string;
  data?: Uint8Array;
}

// CC controller name mapper
const CC_NAMES: Record<number, string> = {
  0: 'Bank Select (MSB)',
  1: 'Modulation Wheel (MSB)',
  2: 'Breath Controller',
  4: 'Foot Controller',
  5: 'Portamento Time',
  6: 'Data Entry (MSB)',
  7: 'Channel Volume (MSB)',
  8: 'Balance',
  10: 'Pan',
  11: 'Expression Controller (MSB)',
  32: 'Bank Select (LSB)',
  38: 'Data Entry (LSB)',
  64: 'Damper Pedal On/Off (Sustain)',
  65: 'Portamento On/Off',
  66: 'Sostenuto On/Off',
  67: 'Soft Pedal On/Off',
  68: 'Legato Footswitch',
  69: 'Hold 2',
  91: 'Reverb Send Level',
  93: 'Chorus Send Level',
  120: 'All Sound Off',
  121: 'Reset All Controllers',
  122: 'Local Control On/Off',
  123: 'All Notes Off',
};

// General MIDI instruments mapper
const GM_INSTRUMENTS: string[] = [
  // 0-7: Piano
  'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano', 'Honky-tonk Piano', 'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavi',
  // 8-15: Chromatic Percussion
  'Celesta', 'Glockenspiel', 'Music Box', 'Vibraphone', 'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
  // 16-23: Organ
  'Drawbar Organ', 'Percussive Organ', 'Rock Organ', 'Church Organ', 'Reed Organ', 'Accordion', 'Harmonica', 'Tango Accordion',
  // 24-31: Guitar
  'Acoustic Guitar (nylon)', 'Acoustic Guitar (steel)', 'Electric Guitar (jazz)', 'Electric Guitar (clean)', 'Electric Guitar (muted)', 'Overdriven Guitar', 'Distortion Guitar', 'Guitar harmonics',
  // 32-39: Bass
  'Acoustic Bass', 'Electric Bass (finger)', 'Electric Bass (pick)', 'Fretless Bass', 'Slap Bass 1', 'Slap Bass 2', 'Synth Bass 1', 'Synth Bass 2',
  // 40-47: Strings
  'Violin', 'Viola', 'Cello', 'Contrabass', 'Tremolo Strings', 'Pizzicato Strings', 'Orchestral Harp', 'Timpani',
  // 48-55: Ensemble
  'String Ensemble 1', 'String Ensemble 2', 'SynthStrings 1', 'SynthStrings 2', 'Choir Aahs', 'Voice Oohs', 'Synth Voice', 'Orchestra Hit',
  // 56-63: Brass
  'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet', 'French Horn', 'Brass Section', 'SynthBrass 1', 'SynthBrass 2',
  // 64-71: Reed
  'Soprano Sax', 'Alto Sax', 'Tenor Sax', 'Baritone Sax', 'Oboe', 'English Horn', 'Bassoon', 'Clarinet',
  // 72-79: Pipe
  'Piccolo', 'Flute', 'Recorder', 'Pan Flute', 'Blown Bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
  // 80-87: Synth Lead
  'Lead 1 (square)', 'Lead 2 (sawtooth)', 'Lead 3 (calliope)', 'Lead 4 (chiff)', 'Lead 5 (charang)', 'Lead 6 (voice)', 'Lead 7 (fifths)', 'Lead 8 (bass+lead)',
  // 88-95: Synth Pad
  'Pad 1 (new age)', 'Pad 2 (warm)', 'Pad 3 (polysynth)', 'Pad 4 (choir)', 'Pad 5 (bowed)', 'Pad 6 (metallic)', 'Pad 7 (halo)', 'Pad 8 (sweep)',
  // 96-103: Synth Effects
  'FX 1 (rain)', 'FX 2 (soundtrack)', 'FX 3 (crystal)', 'FX 4 (atmosphere)', 'FX 5 (brightness)', 'FX 6 (goblins)', 'FX 7 (echoes)', 'FX 8 (sci-fi)',
  // 104-111: Ethnic
  'Sitar', 'Banjo', 'Shamisen', 'Koto', 'Kalimba', 'Bag pipe', 'Fiddle', 'Shanai',
  // 112-119: Percussive
  'Tinkle Bell', 'Agogo', 'Steel Drums', 'Woodblock', 'Taiko Drum', 'Melodic Tom', 'Synth Drum', 'Reverse Cymbal',
  // 120-127: Sound Effects
  'Guitar Fret Noise', 'Breath Noise', 'Seashore', 'Bird Tweet', 'Telephone Ring', 'Helicopter', 'Applause', 'Gunshot'
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteName(noteNum: number): string {
  const octave = Math.floor(noteNum / 12) - 1;
  const name = NOTE_NAMES[noteNum % 12];
  return `${name}${octave}`;
}

const MidiToTextConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Parse results
  const [header, setHeader] = useState<MidiHeader | null>(null);
  const [events, setEvents] = useState<MidiEvent[]>([]);

  // Filtering / Search States
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [encoding, setEncoding] = useState<StringEncoding>('utf-8');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Duration Limit States
  const [useMaxDurationLimit, setUseMaxDurationLimit] = useState(false);
  const [maxDurationLimit, setMaxDurationLimit] = useState<number>(30);

  // Audio elements
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<Record<string, { osc: OscillatorNode; gain: GainNode }>>({});
  const playTimerRef = useRef<number | null>(null);
  const playTimeRef = useRef<number>(0);
  const nextEventIndexRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Handle file drop / select
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Re-trigger parse if encoding changes
  useEffect(() => {
    if (file) {
      processFile(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encoding]);

  const processFile = async (selectedFile: File) => {
    // Validate MIDI
    if (!selectedFile.name.toLowerCase().endsWith('.mid') && !selectedFile.name.toLowerCase().endsWith('.midi') && selectedFile.type !== 'audio/midi') {
      setError('有効なMIDIファイル（.mid, .midi）を選択してください。');
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    stopPlayback();

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const view = new DataView(arrayBuffer);
      
      const parsedHeader = parseMidiHeader(view);
      setHeader(parsedHeader);
      
      const parsedEvents = parseMidiEvents(view, parsedHeader.ticksPerBeat);
      setEvents(parsedEvents);
      
      // Calculate total duration in seconds
      if (parsedEvents.length > 0) {
        const totalDuration = parsedEvents[parsedEvents.length - 1].timeSec;
        setDuration(totalDuration);
        setMaxDurationLimit(Math.ceil(totalDuration));
        setUseMaxDurationLimit(false);
      } else {
        setDuration(0);
        setMaxDurationLimit(30);
        setUseMaxDurationLimit(false);
      }
      
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setError(`MIDI解析エラー: ${err.message || 'ファイルが壊れているか、サポートされていない形式です。'}`);
      setHeader(null);
      setEvents([]);
      setDuration(0);
    } finally {
      setLoading(false);
    }
  };

  const parseMidiHeader = (view: DataView): MidiHeader => {
    // Check MThd signature
    if (view.getUint32(0) !== 0x4D546864) { // 'MThd' in ASCII hex
      throw new Error('MIDIヘッダー署名(MThd)が見つかりません。これは正しいStandard MIDI File (SMF)ではありません。');
    }

    const headerLength = view.getUint32(4);
    if (headerLength < 6) {
      throw new Error(`不正なヘッダー長さ: ${headerLength}`);
    }

    const format = view.getUint16(8);
    const numTracks = view.getUint16(10);
    const division = view.getUint16(12);

    if (format !== 0 && format !== 1) {
      throw new Error(`サポートされていないMIDIフォーマットです(Format ${format})。Format 0または1のファイルを指定してください。`);
    }

    // division format: if MSB is 0, it is ticks per beat (quarter note). If MSB is 1, SMPTE.
    if (division & 0x8000) {
      throw new Error('SMPTEタイムコードを格納したMIDIファイルは現在サポートされていません。');
    }

    return {
      format,
      numTracks,
      ticksPerBeat: division & 0x7FFF
    };
  };

  const parseMidiEvents = (view: DataView, ticksPerBeat: number): MidiEvent[] => {
    let offset = 14; // Header starts from byte 14 in basic midi
    const eventsList: MidiEvent[] = [];
    let eventIdCounter = 0;

    // Helper reader
    const reader = {
      getUint8() {
        if (offset >= view.byteLength) throw new Error('ファイルを読み込み中に予期しないファイルの終端に達しました。');
        return view.getUint8(offset++);
      },
      getBytes(len: number) {
        if (offset + len > view.byteLength) throw new Error('ファイルを読み込み中に予期しないファイルの終端に達しました。');
        const slice = new Uint8Array(view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + len));
        offset += len;
        return slice;
      },
      readVLQ() {
        let value = 0;
        while (true) {
          const b = this.getUint8();
          value = (value << 7) + (b & 0x7f);
          if (!(b & 0x80)) break;
        }
        return value;
      }
    };

    // Keep track of decoders
    const textDecoder = new TextDecoder(encoding, { fatal: false, ignoreBOM: true });

    for (let trackIndex = 0; trackIndex < (header?.numTracks || 999); trackIndex++) {
      if (offset >= view.byteLength) break;

      // Check MTrk signature
      const sig = view.getUint32(offset);
      if (sig !== 0x4D54726B) { // 'MTrk' inside hex ASCII
        // Scan for next 'MTrk' in case there is some padding or unknown chunks
        let found = false;
        for (let searchOffset = offset; searchOffset < view.byteLength - 8; searchOffset++) {
          if (view.getUint32(searchOffset) === 0x4D54726B) {
            offset = searchOffset;
            found = true;
            break;
          }
        }
        if (!found) break; // No more track chunks
      }

      offset += 4; // skip 'MTrk'
      const trackLength = view.getUint32(offset);
      offset += 4;

      const trackEndOffset = offset + trackLength;
      let tick = 0;
      let runningStatus: number | null = null;

      while (offset < trackEndOffset) {
        const delta = reader.readVLQ();
        tick += delta;

        let status = reader.getUint8();

        // Handle Running Status
        if (status < 0x80) {
          if (runningStatus === null) {
            throw new Error(`ステータスバイトの欠損: オフセット ${offset - 1} でランニングステータスが未指定です。`);
          }
          status = runningStatus;
          offset--; // push back the byte to consume it as data payload
        }

        const highNibble = status & 0xF0;
        const channel = status & 0x0F;

        if (status === 0xFF) {
          // Meta Event
          const metaType = reader.getUint8();
          const len = reader.readVLQ();
          const metaData = reader.getBytes(len);

          let text = '';
          let metaName = 'Unknown Meta Event';

          switch (metaType) {
            case 0x00:
              metaName = 'Sequence Number';
              text = metaData.length >= 2 ? ((metaData[0] << 8) | metaData[1]).toString() : '';
              break;
            case 0x01:
              metaName = 'Text Event';
              text = textDecoder.decode(metaData);
              break;
            case 0x02:
              metaName = 'Copyright Notice';
              text = textDecoder.decode(metaData);
              break;
            case 0x03:
              metaName = 'Sequence/Track Name';
              text = textDecoder.decode(metaData);
              break;
            case 0x04:
              metaName = 'Instrument Name';
              text = textDecoder.decode(metaData);
              break;
            case 0x05:
              metaName = 'Lyric';
              text = textDecoder.decode(metaData);
              break;
            case 0x06:
              metaName = 'Marker';
              text = textDecoder.decode(metaData);
              break;
            case 0x07:
              metaName = 'Cue Point';
              text = textDecoder.decode(metaData);
              break;
            case 0x20:
              metaName = 'MIDI Channel Prefix';
              text = metaData.length > 0 ? `Channel ${metaData[0]}` : '';
              break;
            case 0x2F:
              metaName = 'End of Track';
              text = '';
              break;
            case 0x51: {
              metaName = 'Set Tempo';
              if (metaData.length >= 3) {
                const tempoVal = (metaData[0] << 16) | (metaData[1] << 8) | metaData[2];
                const bpm = Math.round((60000000 / tempoVal) * 100) / 100;
                text = `${bpm} BPM (${tempoVal} μs/qn)`;
              }
              break;
            }
            case 0x54:
              metaName = 'SMPTE Offset';
              text = Array.from(metaData).map(b => b.toString().padStart(2, '0')).join(':');
              break;
            case 0x58:
              metaName = 'Time Signature';
              if (metaData.length >= 2) {
                const denom = Math.pow(2, metaData[1]);
                text = `${metaData[0]}/${denom}`;
              }
              break;
            case 0x59: {
              metaName = 'Key Signature';
              if (metaData.length >= 2) {
                const sharpsFlats = metaData[0] > 127 ? metaData[0] - 256 : metaData[0];
                const isMinor = metaData[1] === 1;
                const scale = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'][sharpsFlats + 7] || `${sharpsFlats} sharps/flats`;
                text = `${scale} ${isMinor ? 'Minor' : 'Major'}`;
              }
              break;
            }
            case 0x7F:
              metaName = 'Sequencer Specific';
              text = Array.from(metaData).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
              break;
            default:
              metaName = `Meta Event (0x${metaType.toString(16).padStart(2, '0').toUpperCase()})`;
              text = Array.from(metaData).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
              break;
          }

          eventsList.push({
            id: eventIdCounter++,
            tick,
            timeSec: 0, // calculated later
            track: trackIndex,
            type: 'meta',
            metaType,
            metaName,
            text,
            data: metaData
          });

        } else if (status === 0xF0 || status === 0xF7) {
          // Sysex Event
          const len = reader.readVLQ();
          const sysexData = reader.getBytes(len);
          eventsList.push({
            id: eventIdCounter++,
            tick,
            timeSec: 0,
            track: trackIndex,
            type: 'sysex',
            data: sysexData
          });
        } else {
          // Channel Event
          runningStatus = status;

          if (highNibble === 0x80) {
            // Note Off
            const note = reader.getUint8();
            const velocity = reader.getUint8();
            eventsList.push({
              id: eventIdCounter++,
              tick,
              timeSec: 0,
              track: trackIndex,
              type: 'note_off',
              channel,
              note,
              noteName: getNoteName(note),
              velocity
            });
          } else if (highNibble === 0x90) {
            // Note On
            const note = reader.getUint8();
            const velocity = reader.getUint8();
            eventsList.push({
              id: eventIdCounter++,
              tick,
              timeSec: 0,
              track: trackIndex,
              type: velocity === 0 ? 'note_off' : 'note_on', // Note On with velocity 0 is note off
              channel,
              note,
              noteName: getNoteName(note),
              velocity
            });
          } else if (highNibble === 0xA0) {
            // Polyphonic Pressure
            const note = reader.getUint8();
            const pressure = reader.getUint8();
            eventsList.push({
              id: eventIdCounter++,
              tick,
              timeSec: 0,
              track: trackIndex,
              type: 'poly_pressure',
              channel,
              note,
              noteName: getNoteName(note),
              value: pressure
            });
          } else if (highNibble === 0xB0) {
            // Control Change
            const ctrl = reader.getUint8();
            const val = reader.getUint8();
            eventsList.push({
              id: eventIdCounter++,
              tick,
              timeSec: 0,
              track: trackIndex,
              type: 'cc',
              channel,
              controller: ctrl,
              value: val
            });
          } else if (highNibble === 0xC0) {
            // Program Change
            const prog = reader.getUint8();
            eventsList.push({
              id: eventIdCounter++,
              tick,
              timeSec: 0,
              track: trackIndex,
              type: 'pc',
              channel,
              program: prog
            });
          } else if (highNibble === 0xD0) {
            // Channel Pressure
            const press = reader.getUint8();
            eventsList.push({
              id: eventIdCounter++,
              tick,
              timeSec: 0,
              track: trackIndex,
              type: 'channel_pressure',
              channel,
              value: press
            });
          } else if (highNibble === 0xE0) {
            // Pitch Bend
            const lsb = reader.getUint8();
            const msb = reader.getUint8();
            const pitchValue = (msb << 7) | lsb; // 14-bit unsigned int
            eventsList.push({
              id: eventIdCounter++,
              tick,
              timeSec: 0,
              track: trackIndex,
              type: 'pitch_bend',
              channel,
              pitch: pitchValue
            });
          } else {
            throw new Error(`無効またはサポートされていないMIDIバイト(0x${status.toString(16).toUpperCase()})：位置 ${offset - 1}`);
          }
        }
      }
    }

    // Sort events by absolute tick
    eventsList.sort((a, b) => a.tick - b.tick);

    // Calculate real elapsed time in seconds for each event using tempo events chronologically
    let currentTempo = 500000; // default 120 BPM (500,000 microseconds per quarter note)
    let lastTick = 0;
    let elapsedSeconds = 0;

    eventsList.forEach(ev => {
      const deltaTicks = ev.tick - lastTick;
      // seconds per tick = tempo / (1,000,000 * ticksPerBeat)
      const secsPerTick = currentTempo / (1000000 * ticksPerBeat);
      elapsedSeconds += deltaTicks * secsPerTick;
      ev.timeSec = elapsedSeconds;
      lastTick = ev.tick;

      // Update tempo if this event is a Set Tempo change
      if (ev.type === 'meta' && ev.metaType === 0x51 && ev.data && ev.data.length >= 3) {
        currentTempo = (ev.data[0] << 16) | (ev.data[1] << 8) | ev.data[2];
      }
    });

    return eventsList;
  };

  // Safe sound synthesizer note trigger
  const playNoteSound = (noteNum: number, velocity: number, channel: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const freq = 440 * Math.pow(2, (noteNum - 69) / 12);
      const key = `${channel}-${noteNum}`;

      // Stop existing if any overlap
      if (activeOscillatorsRef.current[key]) {
        try {
          activeOscillatorsRef.current[key].osc.disconnect();
        } catch {}
        delete activeOscillatorsRef.current[key];
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Timbral selection based on MIDI channel to make it sound full & multitimbral!
      if (channel === 9) {
        // Percussions block: short noise or triangle burst
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80 + Math.random() * 40, ctx.currentTime);
      } else {
        const typeSelectNum = channel % 4;
        if (typeSelectNum === 0) osc.type = 'sine';
        else if (typeSelectNum === 1) osc.type = 'triangle';
        else if (typeSelectNum === 2) osc.type = 'square';
        else osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(freq, ctx.currentTime);
      }

      // Convert velocity (0-127) to standard gain scale
      const vol = (velocity / 127) * 0.08;
      gain.gain.setValueAtTime(vol, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      activeOscillatorsRef.current[key] = { osc, gain };
    } catch (err) {
      console.error('Audio node play error:', err);
    }
  };

  const stopNoteSound = (noteNum: number, channel: number) => {
    try {
      const key = `${channel}-${noteNum}`;
      const voice = activeOscillatorsRef.current[key];
      if (voice && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        // smooth decay
        voice.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        const osc = voice.osc;
        setTimeout(() => {
          try {
            osc.stop();
          } catch {}
        }, 150);

        delete activeOscillatorsRef.current[key];
      }
    } catch {}
  };

  const stopAllNotes = () => {
    Object.keys(activeOscillatorsRef.current).forEach(key => {
      try {
        activeOscillatorsRef.current[key].osc.stop();
      } catch {}
    });
    activeOscillatorsRef.current = {};
  };

  // Playback ticking master loop
  const startPlayback = () => {
    if (events.length === 0) return;
    
    // Initialise audio context
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    setIsPlaying(true);
    
    // Resume from current playhead context
    const effectiveDuration = useMaxDurationLimit ? Math.min(duration, maxDurationLimit) : duration;
    const currentPos = playTimeRef.current >= effectiveDuration ? 0 : playTimeRef.current;
    playTimeRef.current = currentPos;
    setPlayTime(currentPos);
    
    // Find index of first event that matches this time
    let idx = 0;
    while (idx < events.length && events[idx].timeSec < currentPos) {
      idx++;
    }
    
    nextEventIndexRef.current = idx;
    startTimeRef.current = performance.now() - (currentPos * 1000);

    const tickHandler = () => {
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      
      playTimeRef.current = elapsed;
      setPlayTime(elapsed);

      // Trigger all events scheduled up to this point
      const activeIdx = nextEventIndexRef.current;
      let nextIdx = activeIdx;
      
      while (nextIdx < events.length && events[nextIdx].timeSec <= elapsed) {
        const ev = events[nextIdx];
        if (ev.type === 'note_on') {
          playNoteSound(ev.note || 0, ev.velocity || 0, ev.channel || 0);
        } else if (ev.type === 'note_off') {
          stopNoteSound(ev.note || 0, ev.channel || 0);
        }
        nextIdx++;
      }
      nextEventIndexRef.current = nextIdx;

      // Handle reproduction termination
      const currentEffectiveDuration = useMaxDurationLimit ? Math.min(duration, maxDurationLimit) : duration;
      if (elapsed >= currentEffectiveDuration || nextIdx >= events.length) {
        stopPlayback();
        playTimeRef.current = 0;
        setPlayTime(0);
      } else {
        playTimerRef.current = requestAnimationFrame(tickHandler);
      }
    };

    playTimerRef.current = requestAnimationFrame(tickHandler);
  };

  const pausePlayback = () => {
    if (playTimerRef.current) {
      cancelAnimationFrame(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
    stopAllNotes();
  };

  const stopPlayback = () => {
    if (playTimerRef.current) {
      cancelAnimationFrame(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
    playTimeRef.current = 0;
    setPlayTime(0);
    stopAllNotes();
  };

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) {
        cancelAnimationFrame(playTimerRef.current);
      }
      stopAllNotes();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    playTimeRef.current = newVal;
    setPlayTime(newVal);
    stopAllNotes();

    if (isPlaying) {
      // restart timer loop
      if (playTimerRef.current) cancelAnimationFrame(playTimerRef.current);
      startTimeRef.current = performance.now() - (newVal * 1000);
      let idx = 0;
      while (idx < events.length && events[idx].timeSec < newVal) {
        idx++;
      }
      nextEventIndexRef.current = idx;
      
      const tickHandler = () => {
        const now = performance.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        playTimeRef.current = elapsed;
        setPlayTime(elapsed);

        let nextIdx = nextEventIndexRef.current;
        while (nextIdx < events.length && events[nextIdx].timeSec <= elapsed) {
          const ev = events[nextIdx];
          if (ev.type === 'note_on') {
            playNoteSound(ev.note || 0, ev.velocity || 0, ev.channel || 0);
          } else if (ev.type === 'note_off') {
            stopNoteSound(ev.note || 0, ev.channel || 0);
          }
          nextIdx++;
        }
        nextEventIndexRef.current = nextIdx;

        const currentEffectiveDuration = useMaxDurationLimit ? Math.min(duration, maxDurationLimit) : duration;
        if (elapsed >= currentEffectiveDuration || nextIdx >= events.length) {
          stopPlayback();
          playTimeRef.current = 0;
          setPlayTime(0);
        } else {
          playTimerRef.current = requestAnimationFrame(tickHandler);
        }
      };
      playTimerRef.current = requestAnimationFrame(tickHandler);
    }
  };

  // Get events within the time limit
  const timeLimitedEvents = useMemo(() => {
    if (!useMaxDurationLimit) return events;
    return events.filter(ev => ev.timeSec <= maxDurationLimit);
  }, [events, useMaxDurationLimit, maxDurationLimit]);

  // Dynamic filter lists for track indexes & event types
  const filterOptions = useMemo(() => {
    const tracksSet = new Set<number>();
    const channelsSet = new Set<number>();
    const typesSet = new Set<string>();

    events.forEach(ev => {
      tracksSet.add(ev.track);
      if (ev.channel !== undefined) channelsSet.add(ev.channel);
      typesSet.add(ev.type);
    });

    return {
      tracks: Array.from(tracksSet).sort((a, b) => a - b),
      channels: Array.from(channelsSet).sort((a, b) => a - b),
      types: Array.from(typesSet).sort()
    };
  }, [events]);

  // Apply filters & search queries to event arrays
  const filteredEvents = useMemo(() => {
    return timeLimitedEvents.filter(ev => {
      // Track Filter: 'all' or explicit track index
      if (selectedTrack !== 'all' && ev.track !== parseInt(selectedTrack)) return false;

      // Channel Filter: 'all' or explicit channel index
      if (selectedChannel !== 'all') {
        if (ev.channel === undefined || ev.channel !== parseInt(selectedChannel)) return false;
      }

      // Event Type Filter
      if (selectedType !== 'all') {
        const typeMatch = selectedType === 'meta'
          ? ev.type === 'meta'
          : selectedType === 'sysex'
          ? ev.type === 'sysex'
          : ev.type === selectedType;
        if (!typeMatch) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const typeString = ev.type.toLowerCase();
        const noteString = ev.note !== undefined ? `midi ${ev.note}` : '';
        const noteNameString = ev.noteName ? ev.noteName.toLowerCase() : '';
        const textString = ev.text ? ev.text.toLowerCase() : '';
        const metaNameString = ev.metaName ? ev.metaName.toLowerCase() : '';
        const chString = ev.channel !== undefined ? `ch${ev.channel}` : '';
        const trString = `t${ev.track}`;

        const matches = 
          typeString.includes(query) ||
          noteString.includes(query) ||
          noteNameString.includes(query) ||
          textString.includes(query) ||
          metaNameString.includes(query) ||
          chString.includes(query) ||
          trString.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [timeLimitedEvents, selectedTrack, selectedChannel, selectedType, searchQuery]);

  // Paginated elements
  const pageCount = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page);
    }
  };

  // Human Readable Format Generator functions
  const generateStringOutput = (format: ExportFormat): string => {
    if (events.length === 0) return '';

    switch (format) {
      case 'csv': {
        const lines = ['Index,Tick,Time(Sec),Track,Channel,Type,Note,NoteName,Velocity,Controller/Program,Value,Detail'];
        filteredEvents.forEach((ev, i) => {
          const detail = ev.text ? `"${ev.text.replace(/"/g, '""')}"` : '';
          const line = [
            i + 1,
            ev.tick,
            ev.timeSec.toFixed(4),
            ev.track,
            ev.channel !== undefined ? ev.channel : '',
            ev.type,
            ev.note !== undefined ? ev.note : '',
            ev.noteName || '',
            ev.velocity !== undefined ? ev.velocity : '',
            ev.controller !== undefined ? ev.controller : ev.program !== undefined ? ev.program : '',
            ev.value !== undefined ? ev.value : ev.pitch !== undefined ? ev.pitch : '',
            detail
          ].join(',');
          lines.push(line);
        });
        return lines.join('\n');
      }

      case 'json': {
        // Serialise with minimal payload, omitting arrays to keep it fast
        const sanitized = filteredEvents.map(({ id, tick, timeSec, track, type, channel, note, noteName, velocity, controller, value, program, pitch, metaName, text }) => ({
          tick,
          timeSec: parseFloat(timeSec.toFixed(5)),
          track,
          type,
          channel,
          note,
          noteName,
          velocity,
          controller,
          value,
          program,
          pitch,
          metaName,
          text
        }));
        return JSON.stringify(sanitized, null, 2);
      }

      case 'yaml': {
        let text = '---\nmetadata:\n';
        text += `  file: "${file?.name || 'parsed.mid'}"\n`;
        text += `  format: ${header?.format}\n`;
        text += `  tracksCount: ${header?.numTracks}\n`;
        text += `  ticksPerQuarterNote: ${header?.ticksPerBeat}\n`;
        text += `  totalDurationSeconds: ${duration.toFixed(3)}\n`;
        text += `  eventsMatched: ${filteredEvents.length}\n`;
        text += 'events:\n';
        
        filteredEvents.forEach((ev) => {
          let chunk = `  - tick: ${ev.tick}\n`;
          chunk += `    time: ${ev.timeSec.toFixed(5)}\n`;
          chunk += `    track: ${ev.track}\n`;
          chunk += `    type: "${ev.type}"\n`;
          if (ev.channel !== undefined) chunk += `    channel: ${ev.channel}\n`;
          if (ev.note !== undefined) {
            chunk += `    note: ${ev.note}\n`;
            chunk += `    noteName: "${ev.noteName}"\n`;
          }
          if (ev.velocity !== undefined) chunk += `    velocity: ${ev.velocity}\n`;
          if (ev.controller !== undefined) chunk += `    controller: ${ev.controller}\n`;
          if (ev.value !== undefined) chunk += `    value: ${ev.value}\n`;
          if (ev.program !== undefined) chunk += `    program: ${ev.program}\n`;
          if (ev.pitch !== undefined) chunk += `    pitch: ${ev.pitch}\n`;
          if (ev.metaName) chunk += `    metaName: "${ev.metaName}"\n`;
          if (ev.text) chunk += `    text: "${ev.text.replace(/"/g, '\\"')}"\n`;
          text += chunk;
        });
        return text;
      }

      case 'midicsv': {
        // Format compatible with standard midicsv (0,0,Header,format,tracks,division)
        const lines: string[] = [];
        lines.push(`0, 0, Header, ${header?.format}, ${header?.numTracks}, ${header?.ticksPerBeat}`);
        
        filteredEvents.forEach(ev => {
          const track = ev.track + 1;
          const tick = ev.tick;
          let detail = '';

          switch (ev.type) {
            case 'note_on':
              detail = `Note_on_c, ${ev.channel}, ${ev.note}, ${ev.velocity}`;
              break;
            case 'note_off':
              detail = `Note_off_c, ${ev.channel}, ${ev.note}, ${ev.velocity}`;
              break;
            case 'cc':
              detail = `Control_c, ${ev.channel}, ${ev.controller}, ${ev.value}`;
              break;
            case 'pc':
              detail = `Program_c, ${ev.channel}, ${ev.program}`;
              break;
            case 'pitch_bend':
              detail = `Pitch_bend_c, ${ev.channel}, ${ev.pitch}`;
              break;
            case 'meta':
              if (ev.metaType === 0x2F) {
                detail = 'End_track';
              } else if (ev.metaType === 0x51 && ev.data) {
                const micro = (ev.data[0] << 16) | (ev.data[1] << 8) | ev.data[2];
                detail = `Tempo, ${micro}`;
              } else if (ev.metaType === 0x58 && ev.data) {
                detail = `Time_signature, ${ev.data[0]}, ${ev.data[1]}, 24, 8`;
              } else if (ev.metaType === 0x59 && ev.data) {
                const sharpsFlats = ev.data[0] > 127 ? ev.data[0] - 256 : ev.data[0];
                detail = `Key_signature, ${sharpsFlats}, ${ev.data[1] === 1 ? '"minor"' : '"major"'}`;
              } else {
                detail = `Title_t, "${ev.text || ''}"`;
              }
              break;
            default:
              detail = `Unknown_event, ${ev.type}`;
              break;
          }
          lines.push(`${track}, ${tick}, ${detail}`);
        });
        lines.push(`0, 0, End_of_file`);
        return lines.join('\n');
      }

      case 'text':
      default: {
        let text = `========= MIDI TEXT ANALYSIS REPORT =========\n`;
        text += `ファイル名: ${file?.name || 'unknown.mid'}\n`;
        text += `ファイル形式: Format ${header?.format}\n`;
        text += `トラック総数: ${header?.numTracks}\n`;
        text += `時間精度 (Division): ${header?.ticksPerBeat} ticks per beat\n`;
        text += `総イベント数: ${events.length} (フィルターマッチ: ${filteredEvents.length})\n`;
        text += `総演奏時間: ${duration.toFixed(3)} 秒 (${Math.floor(duration / 60)}分${(duration % 60).toFixed(1)}秒)\n`;
        text += `==============================================\n\n`;

        text += `${'TIME(Sec)'.padEnd(12)} | ${'TICK'.padEnd(10)} | ${'TR'.padEnd(3)} | ${'CH'.padEnd(3)} | ${'EVENT TYPE'.padEnd(16)} | ${'DETAILS'.padEnd(30)}\n`;
        text += `${'-'.repeat(12)}-+-${'-'.repeat(10)}-+-${'-'.repeat(3)}-+-${'-'.repeat(3)}-+-${'-'.repeat(16)}-+-${'-'.repeat(30)}\n`;

        filteredEvents.forEach(ev => {
          let detail = '';
          const chStr = ev.channel !== undefined ? ev.channel.toString() : '-';
          
          if (ev.type === 'note_on') {
            detail = `Note On: ${ev.noteName} (MIDI ${ev.note}), Velocity: ${ev.velocity}`;
          } else if (ev.type === 'note_off') {
            detail = `Note Off: ${ev.noteName} (MIDI ${ev.note})`;
          } else if (ev.type === 'cc') {
            const ccName = CC_NAMES[ev.controller || 0] || 'Unknown CC';
            detail = `Control Change: CC #${ev.controller} (${ccName}), Value: ${ev.value}`;
          } else if (ev.type === 'pc') {
            const instName = GM_INSTRUMENTS[ev.program || 0] || 'Unknown Instrument';
            detail = `Program Change: #${ev.program} (${instName})`;
          } else if (ev.type === 'pitch_bend') {
            detail = `Pitch Bend: ${ev.pitch} (Center: 8192)`;
          } else if (ev.type === 'meta') {
            detail = `${ev.metaName}: ${ev.text}`;
          } else {
            detail = `System Exclusive Packet, Bytes: ${ev.data?.length || 0}`;
          }

          const timeString = ev.timeSec.toFixed(5).padEnd(12);
          const tickString = ev.tick.toString().padEnd(10);
          const trString = ev.track.toString().padEnd(3);
          const chString = chStr.padEnd(3);
          const typeString = ev.type.toUpperCase().padEnd(16);

          text += `${timeString} | ${tickString} | ${trString} | ${chString} | ${typeString} | ${detail}\n`;
        });
        return text;
      }
    }
  };

  const handleDownload = (format: ExportFormat) => {
    const payload = generateStringOutput(format);
    if (!payload) return;

    let mime = 'text/plain';
    let ext = '.txt';

    if (format === 'csv' || format === 'midicsv') {
      mime = 'text/csv';
      ext = '.csv';
    } else if (format === 'json') {
      mime = 'application/json';
      ext = '.json';
    } else if (format === 'yaml') {
      mime = 'text/yaml';
      ext = '.yaml';
    }

    const blob = new Blob([payload], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name ? file.name.replace(/\.[^/.]+$/, "") : "midi_parsed"}_converted${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const payload = generateStringOutput('text');
    if (!payload) return;

    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearFile = () => {
    stopPlayback();
    setFile(null);
    setHeader(null);
    setEvents([]);
    setError(null);
    setPlayTime(0);
    setDuration(0);
  };

  // Helper values to show details
  const stats = useMemo(() => {
    if (timeLimitedEvents.length === 0) return { notes: 0, ccs: 0, tempos: 0, pcs: 0 };
    let notes = 0;
    let ccs = 0;
    let tempos = 0;
    let pcs = 0;

    timeLimitedEvents.forEach(ev => {
      if (ev.type === 'note_on') notes++;
      if (ev.type === 'cc') ccs++;
      if (ev.type === 'pc') pcs++;
      if (ev.type === 'meta' && ev.metaType === 0x51) tempos++;
    });

    return { notes, ccs, tempos, pcs };
  }, [timeLimitedEvents]);

  const playerMax = useMaxDurationLimit ? Math.min(duration, maxDurationLimit) : duration;

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden animate-fade-in-up">
      {/* Banner */}
      <div className="p-6 md:p-8 border-b border-indigo-50 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
              <Music className="w-6 h-6" />
            </span>
            MIDI テキスト変換ツール
          </h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Standard MIDI File (.mid / .midi) を解析し、ミリ秒単位の正確なイベント内容を human-readable なテキストや CSV 形式に変換。ブラウザ完結の再生機能付き。
          </p>
        </div>
        
        {/* Encoding selector */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-2 rounded-xl border border-slate-200/50 text-xs font-bold leading-none select-none">
          <span className="text-slate-500">文字コード:</span>
          <select 
            value={encoding} 
            onChange={(e) => setEncoding(e.target.value as StringEncoding)}
            className="bg-transparent border-none font-bold text-slate-700 outline-none cursor-pointer focus:ring-0"
          >
            <option value="utf-8">UTF-8</option>
            <option value="shift-jis">Shift-JIS (日本語)</option>
            <option value="ascii">ASCII</option>
          </select>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {!file ? (
          /* File Upload Box */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`cursor-pointer group flex flex-col items-center justify-center border-3 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 rounded-3xl p-12 md:p-16 transition-all relative ${
              isDragOver ? 'border-indigo-500 bg-indigo-50/20 scale-[0.99] text-indigo-500' : ''
            }`}
          >
            <input
              type="file"
              accept=".mid,.midi,audio/midi"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-20 h-20 bg-white rounded-3xl shadow-md border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors mb-6 group-hover:scale-105 transform">
              <FileUp className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2 group-hover:text-indigo-600 transition-colors">
              MIDI ファイルをドラッグ＆ドロップ、または選択
            </h3>
            <p className="text-slate-400 text-sm max-w-md text-center leading-relaxed">
              標準MIDIファイル (.mid または .midi 形式、Format 0/1) に対応しています。ファイルは収集されず、安全にブラウザ上で解析されます。
            </p>
          </div>
        ) : (
          /* Main Workspace View */
          <div className="space-y-8">
            {/* Top Stats Cards & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Leftmost Column - File Summary */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FILE SUMMARY</span>
                    <button 
                      onClick={clearFile}
                      className="text-xs hover:text-red-500 font-bold text-slate-500 transition-colors flex items-center gap-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 px-2.5 py-1 rounded-lg"
                    >
                      別のファイルを選択
                    </button>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 break-all leading-tight max-h-12 overflow-hidden mb-1">
                    {file.name}
                  </h4>
                  <p className="text-slate-500 text-xs">
                    サイズ: {(file.size / 1024).toFixed(1)} KB | フォーマット: Format {header?.format}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200/50">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">トラック数</span>
                    <p className="text-xl font-extrabold text-slate-700">{header?.numTracks}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">分解能 (Division)</span>
                    <p className="text-xl font-extrabold text-slate-700">{header?.ticksPerBeat} ppq</p>
                  </div>
                </div>
              </div>

              {/* Event counter metrics */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">総イベント</span>
                  <p className="text-xl font-extrabold text-slate-700 mt-1">
                    {timeLimitedEvents.length}{useMaxDurationLimit ? ` / ${events.length}` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ノート音数</span>
                  <p className="text-xl font-extrabold text-slate-700 mt-1">{stats.notes}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">コントロール(CC)</span>
                  <p className="text-xl font-extrabold text-slate-700 mt-1">{stats.ccs}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">音色・テンポ</span>
                  <p className="text-xl font-extrabold text-slate-700 mt-1">{stats.pcs + stats.tempos}</p>
                </div>
              </div>

              {/* MIDI Real-time Player Controller */}
              <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">MIDI PLAYER</span>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-white border border-indigo-100 px-2 py-0.5 rounded-md shadow-sm">
                      {Math.floor(playTime / 60)}:{(playTime % 60).toFixed(1).padStart(4, '0')} / {Math.floor(playerMax / 60)}:{(playerMax % 60).toFixed(0).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs leading-normal">
                    ブラウザに搭載された内蔵シンセサイザーを使用してMIDIを簡易再生できます。
                  </p>
                </div>

                <div className="space-y-3 mt-4">
                  {/* Progress scrub bar */}
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={playerMax || 1}
                      step={0.1}
                      value={playTime}
                      onChange={handleProgressChange}
                      className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    {isPlaying ? (
                      <button
                        onClick={pausePlayback}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Pause className="w-3.5 h-3.5 fill-white" /> 一時停止
                      </button>
                    ) : (
                      <button
                        onClick={startPlayback}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> 再生開始
                      </button>
                    )}
                    <button
                      onClick={stopPlayback}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center text-xs"
                      title="リセット"
                    >
                      <Square className="w-3.5 h-3.5 fill-slate-500 stroke-none" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Duration Limit Config Bar */}
            <div className="bg-amber-50/40 border border-amber-100/60 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in-up">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/10">
                  <Settings className="w-5 h-5 stroke-[2]" />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-1.5">
                    変換秒数の制限 (再生・出力範囲)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans leading-relaxed">
                    変換してダンプ・表示・保存するMIDIイベントの最大秒数をコントロールします。長尺なMIDIの特定区間のみを取り出したいときに便利です。
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3.5 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/50 shadow-sm self-stretch md:self-auto justify-between md:justify-start">
                <label className="flex items-center gap-2.5 text-xs font-extrabold text-slate-600 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={useMaxDurationLimit}
                    onChange={(e) => {
                      setUseMaxDurationLimit(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded border-slate-350 text-amber-500 focus:ring-amber-200 w-4.5 h-4.5 cursor-pointer accent-amber-500"
                  />
                  <span>範囲制限を有効にする</span>
                </label>

                {useMaxDurationLimit && (
                  <div className="flex items-center gap-2 border-l border-slate-200/80 pl-3.5 animate-fade-in pb-0.5">
                    <input
                      type="number"
                      min={0.1}
                      max={Math.ceil(duration) || 9999}
                      step={1}
                      value={maxDurationLimit}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setMaxDurationLimit(isNaN(val) ? 0 : val);
                        setCurrentPage(1);
                      }}
                      className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-black text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 text-center"
                    />
                    <span className="text-xs font-bold text-slate-500">秒まで</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event List Viewer & Export Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Table (Left 2 Col) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-slate-700 text-sm">イベントのフィルタ書き出し</h3>
                  </div>
                  
                  <div className="flex gap-2 text-xs font-bold self-end md:self-auto">
                    <span className="text-slate-400 py-1.5">マッチ: {filteredEvents.length}件</span>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
                  {/* Track selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">トラック</label>
                    <select
                      value={selectedTrack}
                      onChange={(e) => { setSelectedTrack(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                    >
                      <option value="all">すべて ({filterOptions.tracks.length}個)</option>
                      {filterOptions.tracks.map(t => (
                        <option key={t} value={t}>トラック {t + 1}</option>
                      ))}
                    </select>
                  </div>

                  {/* Channel selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">MIDI チャンネル</label>
                    <select
                      value={selectedChannel}
                      onChange={(e) => { setSelectedChannel(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                    >
                      <option value="all">すべて ({filterOptions.channels.length}個)</option>
                      {filterOptions.channels.map(ch => (
                        <option key={ch} value={ch}>チャンネル {ch === 9 ? '10 (ドラム)' : ch + 1}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">イベント種別</label>
                    <select
                      value={selectedType}
                      onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                    >
                      <option value="all">すべて</option>
                      <option value="note_on">Note On (発音)</option>
                      <option value="note_off">Note Off (消音)</option>
                      <option value="cc">Control Change</option>
                      <option value="pc">Program Change</option>
                      <option value="pitch_bend">Pitch Bend</option>
                      <option value="meta">Meta Event</option>
                      <option value="sysex">System Exclusive</option>
                    </select>
                  </div>

                  {/* Search query input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">フリー検索</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="C4, テンポ, テキスト等..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-2.5 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none placeholder:text-slate-400 text-slate-700"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Render Table Events */}
                <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="py-3 px-4 w-20">タイム (秒)</th>
                          <th className="py-3 px-3 w-16">TICK</th>
                          <th className="py-3 px-2 w-12 text-center">TR</th>
                          <th className="py-3 px-2 w-12 text-center">CH</th>
                          <th className="py-3 px-4 w-28">種別</th>
                          <th className="py-3 px-4">詳細内容</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {paginatedEvents.length > 0 ? (
                          paginatedEvents.map(ev => {
                            let detail = '';
                            let badgeClass = 'bg-slate-100 text-slate-600';

                            if (ev.type === 'note_on') {
                              detail = `ノートON: ${ev.noteName} (MIDI: ${ev.note}), ベロシティ: ${ev.velocity}`;
                              badgeClass = 'bg-green-100/70 text-green-700 font-bold';
                            } else if (ev.type === 'note_off') {
                              detail = `ノートOFF: ${ev.noteName} (MIDI: ${ev.note})`;
                              badgeClass = 'bg-slate-100 text-slate-500';
                            } else if (ev.type === 'cc') {
                              const ccName = CC_NAMES[ev.controller || 0] || 'Unknown CC';
                              detail = `コントロール#${ev.controller} (${ccName}): 値 ${ev.value}`;
                              badgeClass = 'bg-blue-100/70 text-blue-700';
                            } else if (ev.type === 'pc') {
                              const instName = GM_INSTRUMENTS[ev.program || 0] || 'Unknown Instrument';
                              detail = `音色変更: #${ev.program} (${instName})`;
                              badgeClass = 'bg-purple-100/70 text-purple-700';
                            } else if (ev.type === 'pitch_bend') {
                              detail = `ピッチベンド: ${ev.pitch} (中央: 8192)`;
                              badgeClass = 'bg-amber-100/70 text-amber-700';
                            } else if (ev.type === 'meta') {
                              detail = `「${ev.metaName}」 ${ev.text}`;
                              badgeClass = 'bg-pink-100/70 text-pink-700';
                            } else if (ev.type === 'sysex') {
                              detail = `システム・エクスクルーシブ (${ev.data?.length || 0} bytes)`;
                              badgeClass = 'bg-slate-100 text-slate-700 border border-slate-200';
                            }

                            // Dynamic highlighting during active playhead!
                            const isAtPlayhead = isPlaying && 
                              (playTime >= ev.timeSec - 0.05) && 
                              (playTime <= ev.timeSec + 0.15);

                            return (
                              <tr 
                                key={ev.id} 
                                className={`transition-colors hover:bg-slate-50/50 ${isAtPlayhead ? 'bg-indigo-50/60 font-bold border-l-2 border-indigo-500' : ''}`}
                              >
                                <td className="py-2.5 px-4 text-slate-500 font-bold">{ev.timeSec.toFixed(4)}s</td>
                                <td className="py-2.5 px-3 text-slate-400">{ev.tick}</td>
                                <td className="py-2.5 px-2 text-center text-slate-500">{ev.track + 1}</td>
                                <td className="py-2.5 px-2 text-center text-slate-400 font-bold">{ev.channel !== undefined ? ev.channel + 1 : '-'}</td>
                                <td className="py-2.5 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${badgeClass}`}>
                                    {ev.type.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-slate-700 break-words max-w-sm">{detail}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 font-sans font-bold">
                              フィルタ条件に一致するMIDIイベントがありません
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination controller */}
                  {pageCount > 1 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500 font-sans">
                      <span>
                        全 {filteredEvents.length} 件 | {currentPage} / {pageCount} ページ
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(1)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 disabled:opacity-40 transition-colors"
                        >
                          最初
                        </button>
                        <button
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 disabled:opacity-40 transition-colors"
                        >
                          前へ
                        </button>

                        {/* Direct input jumper */}
                        <input
                          type="number"
                          min={1}
                          max={pageCount}
                          value={currentPage}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 1 && val <= pageCount) handlePageChange(val);
                          }}
                          className="w-12 text-center bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-xs outline-none focus:border-indigo-400"
                        />

                        <button
                          disabled={currentPage === pageCount}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 disabled:opacity-40 transition-colors"
                        >
                          次へ
                        </button>
                        <button
                          disabled={currentPage === pageCount}
                          onClick={() => handlePageChange(pageCount)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 disabled:opacity-40 transition-colors"
                        >
                          最後
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">表示数:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                          className="bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-xs outline-none focus:border-indigo-400"
                        >
                          <option value={50}>50件</option>
                          <option value={100}>100件</option>
                          <option value={200}>200件</option>
                          <option value={500}>500件</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Download / Export Options (Right 1 Col) */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
                  <h3 className="text-lg font-extrabold flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    テキスト出力＆保存
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">
                    フィルタで絞り込んだ {filteredEvents.length} 個のMIDIイベントを、ご希望のデータフォーマットで書き込み・出力します。
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleDownload('text')}
                      className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-indigo-500/50 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-extrabold text-left">標準テキスト形式 (.txt)</p>
                          <p className="text-[10px] text-slate-400 font-normal">読みやすいタイムテーブル表記</p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </button>

                    <button
                      onClick={() => handleDownload('csv')}
                      className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-indigo-500/50 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-50 group-hover:text-white transition-colors">
                          <Download className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-extrabold text-left">互換CSVファイル (.csv)</p>
                          <p className="text-[10px] text-slate-400 font-normal">Excel、スプレッドシートへの貼り付けに</p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-green-450 transition-colors" />
                    </button>

                    <button
                      onClick={() => handleDownload('midicsv')}
                      className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-indigo-500/50 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-50 group-hover:text-white transition-colors">
                          <Layers className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-extrabold text-left">midicsv 互換フォーマット (.csv)</p>
                          <p className="text-[10px] text-slate-400 font-normal">一般的なMIDI/CSV相互変換ツール仕様</p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </button>

                    <button
                      onClick={() => handleDownload('json')}
                      className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-indigo-500/50 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-50 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-extrabold text-left">JSONオブジェクト配列 (.json)</p>
                          <p className="text-[10px] text-slate-400 font-normal">プログラミング・Web開発への組み込み用</p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    </button>

                    <button
                      onClick={() => handleDownload('yaml')}
                      className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-indigo-500/50 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-50 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-extrabold text-left">YAML データファイル (.yaml)</p>
                          <p className="text-[10px] text-slate-400 font-normal">構造化されたキレイな文書定義形式</p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-rose-450 transition-colors" />
                    </button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-800 flex gap-4">
                    <button
                      onClick={handleCopyClipboard}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" /> コピー完了！
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> テキストをコピー
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Technical Note / Explanation card */}
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <Settings className="w-4 h-4" />
                    ツールチップ ＆ 技術情報
                  </h4>
                  <ul className="text-xs text-slate-500 space-y-2.5 list-disc list-inside leading-relaxed">
                    <li>
                      <span className="font-bold text-slate-700">再生ピッチ:</span> 内蔵シンセは標準平均律 (A4 = 440Hz) に準拠します。
                    </li>
                    <li>
                      <span className="font-bold text-slate-700">変量長 quantity (VLQ):</span> MIDIでのデルタタイム計算に完全にネイティブ対応。テンポの追従はリアルタイムで行われます。
                    </li>
                    <li>
                      <span className="font-bold text-slate-700">ファイルサイズ制限:</span> ブラウザ上での処理となるため、数MB、約数十万音までのファイルのロードを推奨します。
                    </li>
                    <li>
                      <span className="font-bold text-slate-700">ランニング・ステータス:</span> SMFで頻出するイベント省略圧縮に完全対応、正確にバグなく復元します。
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning messages */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-bold animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {error}
          </div>
        )}
      </div>

      {/* Helpful Instructions footer */}
      <div className="bg-slate-50 p-6 border-t border-slate-100">
        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12" y1="8" y2="8"/></svg>
          MIDI TEXT について
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          MIDIファイル (.mid) は音声波形ではなく電子楽器の演奏情報を記録したバイナリデータです。本ツールは、このバイナリデータを「人間が読み書きできる文字列（テキスト）」へと逆パースします。シーケンサーのデバッグ、演奏情報のデータ抽出・解析、プログラムへの記述貼り付け、DTM用のイベントリスト分析にお役立てください。
        </p>
      </div>
    </div>
  );
};

export default MidiToTextConverter;
