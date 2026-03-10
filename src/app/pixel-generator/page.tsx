'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════
// ICON LIBRARY — Letters, Numbers, Symbols
// ═══════════════════════════════════════════

// Uppercase letters (5x7)
const LETTERS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '01010', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
};

// Lowercase letters (5x7)
const LOWERCASE: Record<string, string[]> = {
  a: ['00000', '00000', '01110', '00001', '01111', '10001', '01111'],
  b: ['10000', '10000', '10110', '11001', '10001', '10001', '11110'],
  c: ['00000', '00000', '01110', '10001', '10000', '10001', '01110'],
  d: ['00001', '00001', '01101', '10011', '10001', '10011', '01101'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01110'],
  f: ['00110', '01001', '01000', '11100', '01000', '01000', '01000'],
  g: ['00000', '01111', '10001', '10001', '01111', '00001', '01110'],
  h: ['10000', '10000', '10110', '11001', '10001', '10001', '10001'],
  i: ['00100', '00000', '01100', '00100', '00100', '00100', '01110'],
  j: ['00010', '00000', '00110', '00010', '00010', '10010', '01100'],
  k: ['10000', '10000', '10010', '10100', '11100', '10010', '10001'],
  l: ['01100', '00100', '00100', '00100', '00100', '00100', '01110'],
  m: ['00000', '00000', '11010', '10101', '10101', '10001', '10001'],
  n: ['00000', '00000', '10110', '11001', '10001', '10001', '10001'],
  o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
  p: ['00000', '11110', '10001', '10001', '11110', '10000', '10000'],
  q: ['00000', '01101', '10011', '10001', '01111', '00001', '00001'],
  r: ['00000', '00000', '10110', '11001', '10000', '10000', '10000'],
  s: ['00000', '00000', '01111', '11000', '00011', '10001', '01110'],
  t: ['01000', '01000', '11100', '01000', '01000', '01001', '00110'],
  u: ['00000', '00000', '10001', '10001', '10001', '10011', '01101'],
  v: ['00000', '00000', '10001', '10001', '10001', '01010', '00100'],
  w: ['00000', '00000', '10001', '10001', '10101', '10101', '01010'],
  x: ['00000', '00000', '10001', '01010', '00100', '01010', '10001'],
  y: ['00000', '10001', '10001', '01111', '00001', '10001', '01110'],
  z: ['00000', '00000', '11111', '00010', '00100', '01000', '11111'],
};

// Bold letters (5x7, thicker strokes)
const BOLD_LETTERS: Record<string, string[]> = {
  A: ['01110', '11011', '11011', '11111', '11011', '11011', '11011'],
  B: ['11110', '11011', '11011', '11110', '11011', '11011', '11110'],
  C: ['01110', '11011', '11000', '11000', '11000', '11011', '01110'],
  D: ['11100', '11010', '11011', '11011', '11011', '11010', '11100'],
  E: ['11111', '11000', '11000', '11110', '11000', '11000', '11111'],
  F: ['11111', '11000', '11000', '11110', '11000', '11000', '11000'],
  G: ['01110', '11011', '11000', '11011', '11011', '11011', '01110'],
  H: ['11011', '11011', '11011', '11111', '11011', '11011', '11011'],
  I: ['11111', '01100', '01100', '01100', '01100', '01100', '11111'],
  J: ['00111', '00011', '00011', '00011', '00011', '11011', '01110'],
  K: ['11011', '11010', '11100', '11100', '11100', '11010', '11011'],
  L: ['11000', '11000', '11000', '11000', '11000', '11000', '11111'],
  M: ['11011', '11111', '11111', '11111', '11011', '11011', '11011'],
  N: ['11011', '11111', '11111', '11011', '11011', '11011', '11011'],
  O: ['01110', '11011', '11011', '11011', '11011', '11011', '01110'],
  P: ['11110', '11011', '11011', '11110', '11000', '11000', '11000'],
  Q: ['01110', '11011', '11011', '11011', '11011', '11110', '01111'],
  R: ['11110', '11011', '11011', '11110', '11110', '11010', '11011'],
  S: ['01111', '11000', '11000', '01110', '00011', '00011', '11110'],
  T: ['11111', '01100', '01100', '01100', '01100', '01100', '01100'],
  U: ['11011', '11011', '11011', '11011', '11011', '11011', '01110'],
  V: ['11011', '11011', '11011', '11011', '11011', '01110', '00100'],
  W: ['11011', '11011', '11011', '11111', '11111', '11111', '11011'],
  X: ['11011', '11011', '01110', '00100', '01110', '11011', '11011'],
  Y: ['11011', '11011', '01110', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00011', '00110', '01100', '01100', '11000', '11111'],
};

// Outline letters (5x7, hollow)
const OUTLINE_LETTERS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '10001', '11111', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
  E: ['11111', '10000', '10000', '11100', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11100', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10101', '10010', '01101', '00001'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '01010', '01010', '00100'],
  W: ['10001', '10001', '10101', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
};

const NUMBERS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['01110', '10001', '00001', '00110', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10001', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '10001', '01110'],
};

// Bold numbers
const BOLD_NUMBERS: Record<string, string[]> = {
  '0': ['01110', '11011', '11011', '11011', '11011', '11011', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '11011', '00011', '00110', '01100', '11000', '11111'],
  '3': ['01110', '11011', '00011', '00110', '00011', '11011', '01110'],
  '4': ['00010', '00110', '01110', '11010', '11111', '00010', '00010'],
  '5': ['11111', '11000', '11110', '00011', '00011', '11011', '01110'],
  '6': ['01110', '11000', '11110', '11011', '11011', '11011', '01110'],
  '7': ['11111', '00011', '00110', '01100', '01100', '01100', '01100'],
  '8': ['01110', '11011', '11011', '01110', '11011', '11011', '01110'],
  '9': ['01110', '11011', '11011', '01111', '00011', '00011', '01110'],
};

// Dice faces (5x5)
const DICE: Record<string, string[]> = {
  '1': ['00000', '00000', '00100', '00000', '00000'],
  '2': ['10000', '00000', '00100', '00000', '00001'],
  '3': ['10000', '00000', '00100', '00000', '00001'],
  '4': ['10001', '00000', '00000', '00000', '10001'],
  '5': ['10001', '00000', '00100', '00000', '10001'],
  '6': ['10001', '00000', '10001', '00000', '10001'],
};

interface SymbolData {
  data: string[];
  tags: string[];
  category?: string;
}

const SYMBOLS: Record<string, SymbolData> = {
  // Media
  play: { data: ['010000', '011000', '011100', '011110', '011100', '011000', '010000'], tags: ['play', 'video', 'media', 'triangle', 'right', 'start'], category: 'Media' },
  pause: { data: ['110011', '110011', '110011', '110011', '110011', '110011', '110011'], tags: ['pause', 'media', 'stop'], category: 'Media' },
  stop: { data: ['0000000', '0111110', '0111110', '0111110', '0111110', '0111110', '0000000'], tags: ['stop', 'square', 'halt', 'end', 'media'], category: 'Media' },
  record: { data: ['0011100', '0111110', '1111111', '1111111', '1111111', '0111110', '0011100'], tags: ['record', 'media', 'circle', 'rec'], category: 'Media' },
  'skip-forward': { data: ['0100010', '0111000', '0111100', '0111000', '0111100', '0111000', '0100010'], tags: ['skip', 'forward', 'next', 'media'], category: 'Media' },
  'skip-back': { data: ['0100010', '0001110', '0011110', '0001110', '0011110', '0001110', '0100010'], tags: ['skip', 'back', 'previous', 'media'], category: 'Media' },
  'fast-forward': { data: ['0100100', '0111000', '0111100', '0111000', '0111100', '0111000', '0100100'], tags: ['fast', 'forward', 'media'], category: 'Media' },
  rewind: { data: ['0010010', '0001110', '0011110', '0001110', '0011110', '0001110', '0010010'], tags: ['rewind', 'back', 'media'], category: 'Media' },
  volume: { data: ['0010000', '0111000', '1111100', '1111100', '1111100', '0111000', '0010000'], tags: ['volume', 'speaker', 'media', 'sound'], category: 'Media' },
  mute: { data: ['0010000', '0111010', '1111100', '1111100', '1111100', '0111010', '0010000'], tags: ['mute', 'volume', 'media', 'sound', 'off'], category: 'Media' },
  
  // Arrows
  'arrow-r': { data: ['0001000', '0000100', '0000010', '1111111', '0000010', '0000100', '0001000'], tags: ['arrow', 'right', 'forward', 'next', 'east'], category: 'Arrows' },
  'arrow-l': { data: ['0001000', '0010000', '0100000', '1111111', '0100000', '0010000', '0001000'], tags: ['arrow', 'left', 'back', 'previous', 'west'], category: 'Arrows' },
  'arrow-u': { data: ['0001000', '0011100', '0101010', '1001001', '0001000', '0001000', '0001000'], tags: ['arrow', 'up', 'north'], category: 'Arrows' },
  'arrow-d': { data: ['0001000', '0001000', '0001000', '1001001', '0101010', '0011100', '0001000'], tags: ['arrow', 'down', 'south', 'download'], category: 'Arrows' },
  'chevron-r': { data: ['0001000', '0001100', '0001110', '0001110', '0001100', '0001000', '0000000'], tags: ['chevron', 'right', 'arrow'], category: 'Arrows' },
  'chevron-l': { data: ['0001000', '0011000', '0111000', '0111000', '0011000', '0001000', '0000000'], tags: ['chevron', 'left', 'arrow'], category: 'Arrows' },
  'chevron-u': { data: ['0001000', '0011100', '0111110', '0000000', '0000000', '0000000', '0000000'], tags: ['chevron', 'up', 'arrow'], category: 'Arrows' },
  'chevron-d': { data: ['0000000', '0000000', '0000000', '0111110', '0011100', '0001000', '0000000'], tags: ['chevron', 'down', 'arrow'], category: 'Arrows' },
  
  // UI Icons
  'heart-icon': { data: ['0100010', '1110111', '1111111', '1111111', '0111110', '0011100', '0001000'], tags: ['heart', 'love', 'like', 'favorite', 'fav'], category: 'UI Icons' },
  star: { data: ['0001000', '0001000', '1111111', '0111110', '0010100', '0101010', '1000001'], tags: ['star', 'favorite', 'rating', 'fav'], category: 'UI Icons' },
  check: { data: ['0000000', '0000010', '0000100', '0001000', '1010000', '0100000', '0000000'], tags: ['check', 'checkmark', 'tick', 'done', 'complete', 'yes', 'correct', 'approve'], category: 'UI Icons' },
  plus: { data: ['0001000', '0001000', '0001000', '1111111', '0001000', '0001000', '0001000'], tags: ['plus', 'add', 'new', 'create', 'positive'], category: 'UI Icons' },
  minus: { data: ['0000000', '0000000', '0000000', '1111111', '0000000', '0000000', '0000000'], tags: ['minus', 'remove', 'subtract', 'negative'], category: 'UI Icons' },
  close: { data: ['1000001', '0100010', '0010100', '0001000', '0010100', '0100010', '1000001'], tags: ['close', 'x', 'cancel', 'delete', 'remove', 'cross', 'multiply'], category: 'UI Icons' },
  lightning: { data: ['0001100', '0011000', '0110000', '1111100', '0001100', '0011000', '0100000'], tags: ['lightning', 'bolt', 'flash', 'power', 'energy', 'electric', 'thunder', 'zap'], category: 'UI Icons' },
  lock: { data: ['0011100', '0100010', '0100010', '1111111', '1101011', '1101011', '1111111'], tags: ['lock', 'secure', 'locked', 'security', 'password', 'private'], category: 'UI Icons' },
  unlock: { data: ['0011100', '0100010', '0000010', '1111111', '1101011', '1101011', '1111111'], tags: ['unlock', 'unlocked', 'open'], category: 'UI Icons' },
  home: { data: ['0001000', '0011100', '0111110', '1111111', '0110110', '0110110', '0111110'], tags: ['home', 'house', 'building', 'main'], category: 'UI Icons' },
  search: { data: ['0111000', '1000100', '1000100', '1000100', '0111000', '0001100', '0000010'], tags: ['search', 'magnify', 'find', 'zoom', 'lookup', 'lens'], category: 'UI Icons' },
  gear: { data: ['0101010', '0111110', '1110111', '0100010', '1110111', '0111110', '0101010'], tags: ['gear', 'settings', 'config', 'preferences', 'cog', 'options'], category: 'UI Icons' },
  wifi: { data: ['0111110', '1000001', '0011100', '0100010', '0001000', '0000000', '0001000'], tags: ['wifi', 'wireless', 'signal', 'network', 'internet', 'connection'], category: 'UI Icons' },
  download: { data: ['0001000', '0001000', '0001000', '0101010', '0010100', '0001000', '1111111'], tags: ['download', 'save', 'export'], category: 'UI Icons' },
  upload: { data: ['0001000', '0010100', '0101010', '0001000', '0001000', '0001000', '1111111'], tags: ['upload', 'import', 'share'], category: 'UI Icons' },
  eye: { data: ['0000000', '0011100', '0100010', '1001001', '0100010', '0011100', '0000000'], tags: ['eye', 'view', 'visible', 'show', 'watch', 'see', 'preview'], category: 'UI Icons' },
  'eye-off': { data: ['0000000', '0011100', '0110010', '1001001', '0100010', '0011100', '0000000'], tags: ['eye', 'off', 'hidden', 'hide'], category: 'UI Icons' },
  mail: { data: ['0000000', '1111111', '1100011', '1010101', '1001001', '1000001', '1111111'], tags: ['mail', 'email', 'envelope', 'message', 'inbox', 'letter'], category: 'UI Icons' },
  bell: { data: ['0001000', '0011100', '0011100', '0100010', '0100010', '1111111', '0001000'], tags: ['bell', 'notification', 'alert', 'alarm', 'ring'], category: 'UI Icons' },
  shield: { data: ['1111111', '1000001', '1000001', '1000001', '0100010', '0010100', '0001000'], tags: ['shield', 'security', 'protect', 'safe', 'guard', 'defense'], category: 'UI Icons' },
  flag: { data: ['1100000', '1111100', '1111100', '1111100', '1100000', '1000000', '1000000'], tags: ['flag', 'report', 'bookmark', 'mark'], category: 'UI Icons' },
  cursor: { data: ['1000000', '1100000', '1010000', '1001000', '1111100', '0001100', '0000100'], tags: ['cursor', 'pointer', 'mouse', 'click', 'select'], category: 'UI Icons' },
  menu: { data: ['0000000', '1111111', '0000000', '1111111', '0000000', '1111111', '0000000'], tags: ['menu', 'hamburger', 'bars', 'navigation', 'nav', 'list'], category: 'UI Icons' },
  refresh: { data: ['0011110', '0100001', '0100000', '0000000', '0000010', '1000010', '0111100'], tags: ['refresh', 'reload', 'sync', 'rotate', 'update'], category: 'UI Icons' },
  power: { data: ['0001000', '0001000', '0100010', '1000001', '1000001', '0100010', '0011100'], tags: ['power', 'on', 'off', 'shutdown', 'switch', 'toggle'], category: 'UI Icons' },
  link: { data: ['0011100', '0100010', '0100000', '0011100', '0000010', '0100010', '0011100'], tags: ['link', 'chain', 'url', 'connect', 'href', 'anchor'], category: 'UI Icons' },
  key: { data: ['0011000', '0100100', '0011000', '0001000', '0001100', '0001000', '0001100'], tags: ['key', 'password', 'access', 'auth', 'token'], category: 'UI Icons' },
  pin: { data: ['0011100', '0100010', '0100010', '0100010', '0011100', '0001000', '0001000'], tags: ['pin', 'location', 'map', 'place', 'marker', 'gps'], category: 'UI Icons' },
  user: { data: ['0011100', '0100010', '0100010', '0011100', '0000000', '0111110', '1000001'], tags: ['user', 'person', 'profile', 'account', 'avatar', 'people'], category: 'UI Icons' },
  users: { data: ['0011000', '0100100', '0100100', '0011000', '1111111', '1000001', '1111111'], tags: ['users', 'people', 'team', 'group'], category: 'UI Icons' },
  folder: { data: ['1110000', '1001111', '1000001', '1000001', '1000001', '1000001', '1111111'], tags: ['folder', 'directory', 'files', 'dir'], category: 'UI Icons' },
  file: { data: ['1111100', '1000110', '1000011', '1000001', '1000001', '1000001', '1111111'], tags: ['file', 'document', 'page', 'doc', 'paper'], category: 'UI Icons' },
  trash: { data: ['0111110', '1111111', '0100010', '0101010', '0101010', '0100010', '0111110'], tags: ['trash', 'delete', 'bin', 'garbage', 'remove', 'waste'], category: 'UI Icons' },
  code: { data: ['0010010', '0100100', '1001000', '0100100', '0010010', '0000000', '0000000'], tags: ['code', 'brackets', 'dev', 'programming', 'terminal', 'script'], category: 'UI Icons' },
  music: { data: ['0000110', '0000101', '0000100', '0000100', '0110100', '1001100', '0110000'], tags: ['music', 'note', 'audio', 'sound', 'song'], category: 'UI Icons' },
  camera: { data: ['0100100', '1111111', '1000001', '1011101', '1010101', '1011101', '1111111'], tags: ['camera', 'photo', 'picture', 'image', 'snapshot'], category: 'UI Icons' },
  bookmark: { data: ['1111111', '1000001', '1000001', '1000001', '1010101', '1101011', '1000001'], tags: ['bookmark', 'save', 'tag', 'label'], category: 'UI Icons' },
  phone: { data: ['0111110', '0100010', '0100010', '0100010', '0100010', '0111110', '0111110'], tags: ['phone', 'mobile', 'call', 'device', 'smartphone'], category: 'UI Icons' },
  database: { data: ['0111110', '1111111', '0111110', '0100010', '0111110', '1111111', '0111110'], tags: ['database', 'db', 'storage', 'data', 'server', 'cylinder'], category: 'UI Icons' },
  clock: { data: ['0111110', '1100011', '1100110', '1101010', '1101001', '1100011', '0111110'], tags: ['clock', 'time', 'watch', 'timer'], category: 'UI Icons' },
  calendar: { data: ['1111111', '1000001', '1011101', '1010101', '1010101', '1011101', '1111111'], tags: ['calendar', 'date', 'schedule', 'event'], category: 'UI Icons' },
  filter: { data: ['1111111', '1000001', '0100010', '0010100', '0001000', '0001000', '0001000'], tags: ['filter', 'funnel', 'sort'], category: 'UI Icons' },
  sort: { data: ['0001000', '0011100', '0111110', '0000000', '0111110', '0011100', '0001000'], tags: ['sort', 'order', 'arrange'], category: 'UI Icons' },
  
  // Weather
  sun: { data: ['0100010', '0011100', '1111111', '0111110', '1111111', '0011100', '0100010'], tags: ['sun', 'light', 'bright', 'day', 'weather'], category: 'Weather' },
  moon: { data: ['0011100', '0100000', '1000000', '1000000', '1000000', '0100000', '0011100'], tags: ['moon', 'dark', 'night', 'sleep', 'crescent', 'weather'], category: 'Weather' },
  cloud: { data: ['0000000', '0011100', '0100010', '1100011', '1111111', '1111111', '0000000'], tags: ['cloud', 'weather', 'storage', 'sky', 'upload'], category: 'Weather' },
  rain: { data: ['0000000', '0011100', '0100010', '1100011', '1111111', '0100010', '0010100'], tags: ['rain', 'weather', 'water', 'storm'], category: 'Weather' },
  snow: { data: ['0000000', '0011100', '0100010', '1100011', '1111111', '0010100', '0100010'], tags: ['snow', 'weather', 'cold', 'winter'], category: 'Weather' },
  
  // Animals
  cat: { data: ['1001001', '1001001', '1111111', '1000001', '1010101', '1000001', '0111110'], tags: ['cat', 'animal', 'pet', 'kitty'], category: 'Animals' },
  dog: { data: ['1001001', '1001001', '0111110', '1000001', '1010101', '1000001', '0111110'], tags: ['dog', 'animal', 'pet', 'puppy'], category: 'Animals' },
  bird: { data: ['0011000', '0100100', '0111110', '1100011', '1000001', '0100010', '0010100'], tags: ['bird', 'animal', 'fly', 'twitter'], category: 'Animals' },
  fish: { data: ['0000000', '0011110', '0111111', '1100011', '0111111', '0011110', '0001000'], tags: ['fish', 'animal', 'sea', 'ocean', 'swim'], category: 'Animals' },
  rabbit: { data: ['0011000', '0011000', '0111110', '1000001', '1010101', '1000001', '0111110'], tags: ['rabbit', 'animal', 'bunny', 'pet'], category: 'Animals' },
  
  // Transport
  rocket: { data: ['0001000', '0011100', '0111110', '1111111', '0111110', '0010100', '0101010'], tags: ['rocket', 'space', 'launch', 'transport', 'ship'], category: 'Transport' },
  car: { data: ['0000000', '0111110', '1111111', '1000001', '1111111', '0101010', '0101010'], tags: ['car', 'vehicle', 'transport', 'auto', 'drive'], category: 'Transport' },
  plane: { data: ['0001000', '0011100', '1111111', '0011100', '0010100', '0001000', '0001000'], tags: ['plane', 'airplane', 'flight', 'transport', 'fly'], category: 'Transport' },
  bike: { data: ['0100010', '1010101', '0101010', '0010100', '0101010', '1010101', '0100010'], tags: ['bike', 'bicycle', 'cycle', 'transport'], category: 'Transport' },
  
  // Shapes
  circle: { data: ['0011100', '0100010', '1000001', '1000001', '1000001', '0100010', '0011100'], tags: ['circle', 'shape', 'round'], category: 'Shapes' },
  square: { data: ['0111110', '0100010', '0100010', '0100010', '0100010', '0100010', '0111110'], tags: ['square', 'shape', 'box'], category: 'Shapes' },
  triangle: { data: ['0001000', '0001000', '0010100', '0010100', '0100010', '0100010', '1111111'], tags: ['triangle', 'shape'], category: 'Shapes' },
  'diamond-shape': { data: ['0001000', '0010100', '0100010', '1000001', '0100010', '0010100', '0001000'], tags: ['diamond', 'shape', 'rhombus'], category: 'Shapes' },
  
  // Currency
  dollar: { data: ['0010100', '0100010', '1111100', '0100010', '0011110', '0100010', '0010100'], tags: ['dollar', 'currency', 'money', 'usd', 'price'], category: 'Currency' },
  euro: { data: ['0011100', '0100000', '1111000', '0100000', '0111100', '0100000', '0011100'], tags: ['euro', 'currency', 'money', 'eur'], category: 'Currency' },
  pound: { data: ['0011100', '0100010', '1110000', '0100000', '0100000', '0100110', '0011000'], tags: ['pound', 'currency', 'money', 'gbp'], category: 'Currency' },
  yen: { data: ['1000001', '1100011', '0111110', '0010100', '0111110', '0010100', '0010100'], tags: ['yen', 'currency', 'money', 'jpy'], category: 'Currency' },
  bitcoin: { data: ['0011100', '0100010', '1101100', '0101000', '1101100', '0100010', '0011100'], tags: ['bitcoin', 'crypto', 'currency', 'btc'], category: 'Currency' },
  
  // Math
  infinity: { data: ['0000000', '0000000', '0110110', '1001001', '0110110', '0000000', '0000000'], tags: ['infinity', 'math', 'forever', 'infinite'], category: 'Math' },
  percent: { data: ['0100000', '1010000', '0100100', '0001010', '0000101', '0000010', '0000000'], tags: ['percent', 'math', 'percentage'], category: 'Math' },
  divide: { data: ['0001000', '0000000', '1111111', '0000000', '0001000', '0000000', '0000000'], tags: ['divide', 'math', 'division'], category: 'Math' },
  equals: { data: ['0000000', '1111111', '0000000', '1111111', '0000000', '0000000', '0000000'], tags: ['equals', 'math', 'equal'], category: 'Math' },
  
  // Emoticons
  smile: { data: ['0000000', '0110110', '0110110', '0000000', '1000001', '0100010', '0011100'], tags: ['smile', 'happy', 'emoticon', 'face'], category: 'Emoticons' },
  sad: { data: ['0000000', '0110110', '0110110', '0000000', '0011100', '0100010', '1000001'], tags: ['sad', 'unhappy', 'emoticon', 'face'], category: 'Emoticons' },
  wink: { data: ['0000000', '0111110', '0110110', '0000000', '1000001', '0100010', '0011100'], tags: ['wink', 'emoticon', 'face'], category: 'Emoticons' },
  cool: { data: ['0000000', '0111110', '0000000', '1000001', '0100010', '0011100', '0000000'], tags: ['cool', 'sunglasses', 'emoticon', 'face'], category: 'Emoticons' },
  
  // Food
  coffee: { data: ['0100010', '0011100', '1111111', '1000001', '1000001', '1000001', '1111111'], tags: ['coffee', 'drink', 'cafe', 'cup', 'beverage'], category: 'Food' },
  pizza: { data: ['0111110', '1100011', '1010101', '1101011', '1010101', '1100011', '0111110'], tags: ['pizza', 'food', 'slice'], category: 'Food' },
  burger: { data: ['0111110', '1000001', '1111111', '1000001', '1111111', '1000001', '0111110'], tags: ['burger', 'food', 'hamburger'], category: 'Food' },
  apple: { data: ['0001000', '0011100', '0111110', '1111111', '1111111', '0111110', '0000000'], tags: ['apple', 'fruit', 'food'], category: 'Food' },
  
  // Sports
  ball: { data: ['0000000', '0011100', '0111110', '1111111', '0111110', '0011100', '0000000'], tags: ['ball', 'sport', 'circle'], category: 'Sports' },
  trophy: { data: ['0011100', '0111110', '0111110', '0011100', '0001000', '0011100', '0011100'], tags: ['trophy', 'award', 'winner', 'sport'], category: 'Sports' },
  medal: { data: ['0001000', '0011100', '0111110', '0111110', '0011100', '0001000', '0001000'], tags: ['medal', 'award', 'prize', 'sport'], category: 'Sports' },
  
  // Chess
  'chess-king': { data: ['0001000', '0011100', '0001000', '0111110', '1111111', '0111110', '0010100'], tags: ['chess', 'king', 'game', 'piece'], category: 'Chess' },
  'chess-queen': { data: ['0101010', '0010100', '0111110', '1111111', '0111110', '0010100', '0010100'], tags: ['chess', 'queen', 'game', 'piece'], category: 'Chess' },
  'chess-rook': { data: ['0111110', '0100010', '0100010', '0100010', '1111111', '0111110', '0010100'], tags: ['chess', 'rook', 'castle', 'game', 'piece'], category: 'Chess' },
  'chess-knight': { data: ['0011000', '0100100', '0111100', '0100010', '1111111', '0111110', '0010100'], tags: ['chess', 'knight', 'horse', 'game', 'piece'], category: 'Chess' },
  'chess-bishop': { data: ['0001000', '0010100', '0100010', '1111111', '0111110', '0010100', '0010100'], tags: ['chess', 'bishop', 'game', 'piece'], category: 'Chess' },
  'chess-pawn': { data: ['0000000', '0001000', '0011100', '1111111', '0111110', '0010100', '0010100'], tags: ['chess', 'pawn', 'game', 'piece'], category: 'Chess' },
  
  // Card Suits
  spade: { data: ['0001000', '0011100', '0111110', '1111111', '0111110', '0010100', '0001000'], tags: ['spade', 'card', 'suit', 'poker'], category: 'Card Suits' },
  heart: { data: ['0100010', '1110111', '1111111', '1111111', '0111110', '0011100', '0001000'], tags: ['heart', 'card', 'suit', 'poker'], category: 'Card Suits' },
  diamond: { data: ['0001000', '0010100', '0100010', '1000001', '0100010', '0010100', '0001000'], tags: ['diamond', 'card', 'suit', 'poker'], category: 'Card Suits' },
  club: { data: ['0010100', '0111110', '1111111', '0111110', '0010100', '0001000', '0001000'], tags: ['club', 'card', 'suit', 'poker'], category: 'Card Suits' },
};

// ═══════════════════════════════════════════
// MATCH ENGINE
// ═══════════════════════════════════════════
interface MatchResult {
  name: string;
  data: string[];
}

function matchIcon(query: string): MatchResult | null {
  const q = query.trim();
  if (!q) return null;

  // Single character match
  if (q.length === 1) {
    // Uppercase letter
    if (/[A-Z]/.test(q) && LETTERS[q]) return { name: q, data: LETTERS[q] };
    // Lowercase letter
    if (/[a-z]/.test(q) && LOWERCASE[q]) return { name: q, data: LOWERCASE[q] };
    // Number
    if (/[0-9]/.test(q) && NUMBERS[q]) return { name: q, data: NUMBERS[q] };
    // Try direct key match for punctuation etc
    for (const [key, icon] of Object.entries(SYMBOLS)) {
      if (icon.tags.includes(q)) return { name: key, data: icon.data };
    }
  }

  // Pattern: "bold X"
  const boldMatch = q.match(/^bold\s+([A-Z0-9])$/i);
  if (boldMatch) {
    const ch = boldMatch[1].toUpperCase();
    if (BOLD_LETTERS[ch]) return { name: `bold ${ch}`, data: BOLD_LETTERS[ch] };
    if (BOLD_NUMBERS[ch]) return { name: `bold ${ch}`, data: BOLD_NUMBERS[ch] };
  }

  // Pattern: "outline X"
  const outlineMatch = q.match(/^outline\s+([A-Z])$/i);
  if (outlineMatch) {
    const ch = outlineMatch[1].toUpperCase();
    if (OUTLINE_LETTERS[ch]) return { name: `outline ${ch}`, data: OUTLINE_LETTERS[ch] };
  }

  // Pattern: "lowercase X" or "lower X"
  const lowerMatch = q.match(/^(?:lower|lowercase)\s+([a-zA-Z])$/i);
  if (lowerMatch) {
    const ch = lowerMatch[1].toLowerCase();
    if (LOWERCASE[ch]) return { name: ch, data: LOWERCASE[ch] };
  }

  // Pattern: "letter X" or "char X"
  const letterMatch = q.match(/^(?:letter|char|character)\s+([a-zA-Z])$/i);
  if (letterMatch) {
    const ch = letterMatch[1].toUpperCase();
    if (LETTERS[ch]) return { name: ch, data: LETTERS[ch] };
  }

  // Pattern: "number X" or "digit X"
  const numMatch = q.match(/^(?:number|digit|num)\s+([0-9])$/i);
  if (numMatch) {
    const d = numMatch[1];
    if (NUMBERS[d]) return { name: d, data: NUMBERS[d] };
  }

  // Pattern: "dice X"
  const diceMatch = q.match(/^dice\s+([1-6])$/i);
  if (diceMatch) {
    const d = diceMatch[1];
    if (DICE[d]) return { name: `dice ${d}`, data: DICE[d] };
  }

  // Exact key match
  const directKey = q.toLowerCase().replace(/\s+/g, '-');
  if (SYMBOLS[directKey]) return { name: directKey, data: SYMBOLS[directKey].data };

  // Keyword search across all icons
  const words = q.toLowerCase().split(/[\s,\/\-_]+/).filter(Boolean);
  let bestKey: string | null = null;
  let bestScore = 0;

  for (const [key, icon] of Object.entries(SYMBOLS)) {
    let score = 0;
    if (key === directKey) score += 10;
    for (const word of words) {
      if (icon.tags.includes(word)) score += 3;
      else if (icon.tags.some((t) => t.includes(word))) score += 2;
      else if (icon.tags.some((t) => word.includes(t))) score += 1;
    }
    const fullQ = q.toLowerCase();
    for (const tag of icon.tags) {
      if (tag.includes(' ') && fullQ.includes(tag)) score += 5;
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  if (bestKey && bestScore >= 2) return { name: bestKey, data: SYMBOLS[bestKey].data };
  return null;
}

function placeIconInGrid(iconData: string[], targetCols: number, targetRows: number): boolean[][] {
  const iH = iconData.length;
  const iW = iconData[0].length;
  const offR = Math.floor((targetRows - iH) / 2);
  const offC = Math.floor((targetCols - iW) / 2);

  const result: boolean[][] = Array.from({ length: targetRows }, () =>
    Array(targetCols).fill(false)
  );
  for (let r = 0; r < iH; r++) {
    for (let c = 0; c < iW; c++) {
      const gr = r + offR;
      const gc = c + offC;
      if (gr >= 0 && gr < targetRows && gc >= 0 && gc < targetCols) {
        result[gr][gc] = iconData[r][c] === '1';
      }
    }
  }
  return result;
}

// ═══════════════════════════════════════════
// ICON LIBRARY FOR BROWSE MODAL
// ═══════════════════════════════════════════
interface IconLibraryItem {
  name: string;
  data: string[];
  category: string;
}

function buildIconLibrary(): IconLibraryItem[] {
  const items: IconLibraryItem[] = [];

  // Add symbols with categories
  for (const [key, icon] of Object.entries(SYMBOLS)) {
    items.push({
      name: key,
      data: icon.data,
      category: icon.category || 'UI Icons',
    });
  }

  // Add uppercase letters
  for (const [key, data] of Object.entries(LETTERS)) {
    items.push({ name: key, data, category: 'Uppercase Letters' });
  }

  // Add lowercase letters
  for (const [key, data] of Object.entries(LOWERCASE)) {
    items.push({ name: key, data, category: 'Lowercase Letters' });
  }

  // Add numbers
  for (const [key, data] of Object.entries(NUMBERS)) {
    items.push({ name: key, data, category: 'Numbers' });
  }

  // Add bold letters
  for (const [key, data] of Object.entries(BOLD_LETTERS)) {
    items.push({ name: `bold ${key}`, data, category: 'Bold Letters' });
  }

  // Add bold numbers
  for (const [key, data] of Object.entries(BOLD_NUMBERS)) {
    items.push({ name: `bold ${key}`, data, category: 'Bold Numbers' });
  }

  // Add outline letters
  for (const [key, data] of Object.entries(OUTLINE_LETTERS)) {
    items.push({ name: `outline ${key}`, data, category: 'Outline Letters' });
  }

  // Add dice
  for (const [key, data] of Object.entries(DICE)) {
    items.push({ name: `dice ${key}`, data, category: 'Dice' });
  }

  return items;
}

// Category order for display
const CATEGORY_ORDER = [
  'UI Icons', 'Media', 'Arrows', 'Emoticons', 'Shapes', 'Weather', 'Animals',
  'Food', 'Transport', 'Sports', 'Currency', 'Math', 'Chess', 'Card Suits',
  'Uppercase Letters', 'Lowercase Letters', 'Numbers', 'Bold Letters', 'Bold Numbers', 'Outline Letters', 'Dice'
];

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
type TabType = 'prompt' | 'upload';
type ToolType = 'paint' | 'erase';

export default function PixelGeneratorPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('prompt');
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [cols, setCols] = useState(9);
  const [rows, setRows] = useState(9);
  const [fillColor, setFillColor] = useState('#3B82F6');
  const [shadowColor, setShadowColor] = useState('#c5cdd8');
  const [radius, setRadius] = useState(20);
  const [gap, setGap] = useState(12);
  const [showShadow, setShowShadow] = useState(true);
  const [shadowOffsetX, setShadowOffsetX] = useState(1);
  const [shadowOffsetY, setShadowOffsetY] = useState(1);
  const [currentTool, setCurrentTool] = useState<ToolType>('paint');
  const [isPainting, setIsPainting] = useState(false);
  const [paintValue, setPaintValue] = useState(true);

  // Prompt tab state
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload tab state
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [uploadCols, setUploadCols] = useState(9);
  const [uploadRows, setUploadRows] = useState(9);
  const [threshold, setThreshold] = useState(50);
  const [detectMode, setDetectMode] = useState<'alpha' | 'luminance' | 'dark'>('alpha');
  const [invertGrid, setInvertGrid] = useState(false);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);

  // Browse modal state
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [browseSearch, setBrowseSearch] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build icon library once
  const iconLibrary = useMemo(() => buildIconLibrary(), []);

  // Filter and group icons by category
  const filteredIcons = useMemo(() => {
    const search = browseSearch.toLowerCase().trim();
    const filtered = search
      ? iconLibrary.filter(
          (icon) =>
            icon.name.toLowerCase().includes(search) ||
            (SYMBOLS[icon.name]?.tags.some((t) => t.includes(search)))
        )
      : iconLibrary;

    // Group by category
    const grouped: Record<string, IconLibraryItem[]> = {};
    for (const icon of filtered) {
      if (!grouped[icon.category]) grouped[icon.category] = [];
      grouped[icon.category].push(icon);
    }

    // Sort by category order
    const sortedCategories = CATEGORY_ORDER.filter((c) => grouped[c]);
    // Add any categories not in the order list
    for (const c of Object.keys(grouped)) {
      if (!sortedCategories.includes(c)) sortedCategories.push(c);
    }

    return { categories: sortedCategories, icons: grouped, total: filtered.length };
  }, [iconLibrary, browseSearch]);

  // Get shadow map
  const getShadowMap = useCallback((): boolean[][] => {
    const s: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r] && grid[r][c]) {
          const sr = r + shadowOffsetY;
          const sc = c + shadowOffsetX;
          if (sr >= 0 && sr < rows && sc >= 0 && sc < cols) {
            s[sr][sc] = true;
          }
        }
      }
    }
    return s;
  }, [grid, rows, cols, shadowOffsetX, shadowOffsetY]);

  // Generate SVG
  const generateSVG = useCallback(
    (size: number): string => {
      const rP = radius / 100;
      const gP = gap / 100;
      const shadow = showShadow ? getShadowMap() : null;

      // Find bounds
      let minR = rows,
        maxR = -1,
        minC = cols,
        maxC = -1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = grid[r]?.[c] || (showShadow && shadow?.[r]?.[c]);
          if (v) {
            minR = Math.min(minR, r);
            maxR = Math.max(maxR, r);
            minC = Math.min(minC, c);
            maxC = Math.max(maxC, c);
          }
        }
      }
      if (maxR < 0) {
        minR = 0;
        maxR = rows - 1;
        minC = 0;
        maxC = cols - 1;
      }

      const vC = maxC - minC + 1;
      const vR = maxR - minR + 1;
      const maxD = Math.max(vC, vR);
      const padC = Math.floor((maxD - vC) / 2);
      const padR = Math.floor((maxD - vR) / 2);
      const cs = size / maxD;
      const g = cs * gP;
      const rs = cs - g;
      const rad = rs * rP;

      let rects = '';
      if (showShadow && shadow) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (shadow[r]?.[c] && !grid[r]?.[c]) {
              const x = (c - minC + padC) * cs + g / 2;
              const y = (r - minR + padR) * cs + g / 2;
              rects += `  <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${rs.toFixed(2)}" height="${rs.toFixed(2)}" rx="${rad.toFixed(2)}" fill="${shadowColor}"/>\n`;
            }
          }
        }
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r]?.[c]) {
            const x = (c - minC + padC) * cs + g / 2;
            const y = (r - minR + padR) * cs + g / 2;
            rects += `  <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${rs.toFixed(2)}" height="${rs.toFixed(2)}" rx="${rad.toFixed(2)}" fill="${fillColor}"/>\n`;
          }
        }
      }
      const s = cs * maxD;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s.toFixed(2)}" height="${s.toFixed(2)}" viewBox="0 0 ${s.toFixed(2)} ${s.toFixed(2)}">\n${rects}</svg>`;
    },
    [grid, rows, cols, fillColor, shadowColor, radius, gap, showShadow, getShadowMap]
  );

  // Generate mini SVG for browse modal
  const generateMiniSVG = (data: string[], size: number): string => {
    const iH = data.length;
    const iW = data[0].length;
    const maxD = Math.max(iW, iH);
    const cell = size / maxD;
    const gapVal = cell * 0.12;
    const rect = cell - gapVal;
    const rad = rect * 0.2;
    const oX = (size - iW * cell) / 2;
    const oY = (size - iH * cell) / 2;
    let rects = '';
    for (let r = 0; r < iH; r++) {
      for (let c = 0; c < iW; c++) {
        if (data[r][c] === '1') {
          const x = oX + c * cell + gapVal / 2;
          const y = oY + r * cell + gapVal / 2;
          rects += `<rect x="${x}" y="${y}" width="${rect}" height="${rect}" rx="${rad}" fill="#3B82F6"/>`;
        }
      }
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
  };

  // Handle cell click
  const handleCellMouseDown = (r: number, c: number) => {
    setIsPainting(true);
    const newPaintValue = currentTool === 'erase' ? false : !grid[r]?.[c];
    setPaintValue(newPaintValue);
    const newGrid = grid.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? newPaintValue : cell))
    );
    setGrid(newGrid);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (isPainting) {
      const newGrid = grid.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? paintValue : cell))
      );
      setGrid(newGrid);
    }
  };

  // Clear grid
  const clearGrid = () => {
    setGrid(grid.map((row) => row.map(() => false)));
  };

  // Convert image to grid
  const convertImageToGrid = useCallback(
    (
      img: HTMLImageElement,
      targetCols: number,
      targetRows: number,
      thresh: number,
      mode: 'alpha' | 'luminance' | 'dark',
      invert: boolean
    ) => {
      const canvas = document.createElement('canvas');
      const sW = targetCols * 8;
      const sH = targetRows * 8;
      canvas.width = sW;
      canvas.height = sH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      if (mode === 'alpha') {
        ctx.clearRect(0, 0, sW, sH);
      } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, sW, sH);
      }

      const iA = img.width / img.height;
      const cA = sW / sH;
      let dW: number, dH: number, dX: number, dY: number;
      if (iA > cA) {
        dW = sW;
        dH = sW / iA;
        dX = 0;
        dY = (sH - dH) / 2;
      } else {
        dH = sH;
        dW = sH * iA;
        dX = (sW - dW) / 2;
        dY = 0;
      }

      ctx.drawImage(img, dX, dY, dW, dH);
      const imgData = ctx.getImageData(0, 0, sW, sH);
      const newGrid: boolean[][] = [];
      const cellW = sW / targetCols;
      const cellH = sH / targetRows;

      for (let r = 0; r < targetRows; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < targetCols; c++) {
          const sx = Math.floor(c * cellW);
          const sy = Math.floor(r * cellH);
          const ex = Math.floor((c + 1) * cellW);
          const ey = Math.floor((r + 1) * cellH);
          let sum = 0;
          let cnt = 0;

          for (let y = sy; y < ey; y++) {
            for (let x = sx; x < ex; x++) {
              const i = (y * sW + x) * 4;
              const R = imgData.data[i];
              const G = imgData.data[i + 1];
              const B = imgData.data[i + 2];
              const A = imgData.data[i + 3];

              if (mode === 'alpha') {
                sum += A / 255;
              } else {
                const l = (R * 0.299 + G * 0.587 + B * 0.114) / 255;
                sum += mode === 'luminance' ? 1 - l : l < 0.5 ? 1 : 0;
              }
              cnt++;
            }
          }

          let active = (sum / cnt) * 100 >= thresh;
          if (invert) active = !active;
          row.push(active);
        }
        newGrid.push(row);
      }

      setCols(targetCols);
      setRows(targetRows);
      setGrid(newGrid);
    },
    []
  );

  // Generate from prompt
  const handleGenerateFromPrompt = async () => {
    const prompt = promptInput.trim();
    if (!prompt) return;

    setInfoMessage(null);
    setErrorMessage(null);

    // First try library match
    const match = matchIcon(prompt);
    if (match) {
      const newGrid = placeIconInGrid(match.data, cols, rows);
      setGrid(newGrid);
      setInfoMessage(`Matched: ${match.name}`);
      return;
    }

    // If no library match, generate with AI
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Simple pixel art icon of ${prompt}. Minimalist design, clean shapes, high contrast, black and white, suitable for small pixel grid conversion.`,
          branded: false,
          imageSize: 'square_min',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const imageUrl = data.imageUrl as string;

      // Load the generated image and convert to grid
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLoadedImage(img);
        setSourcePreview(imageUrl);

        // Auto-detect mode
        const canvas = document.createElement('canvas');
        const sz = 64;
        canvas.width = sz;
        canvas.height = sz;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.clearRect(0, 0, sz, sz);
          ctx.drawImage(img, 0, 0, sz, sz);
          const imgData = ctx.getImageData(0, 0, sz, sz).data;

          let hasTrans = false;
          let totalA = 0;
          let totalL = 0;
          const px = sz * sz;

          for (let i = 0; i < imgData.length; i += 4) {
            const a = imgData[i + 3];
            totalA += a;
            if (a < 240) hasTrans = true;
            totalL += imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114;
          }

          let mode: 'alpha' | 'luminance' | 'dark' = 'luminance';
          if (hasTrans && totalA / px < 200) {
            mode = 'alpha';
          } else {
            mode = totalL / px > 180 ? 'dark' : 'luminance';
          }
          setDetectMode(mode);
          convertImageToGrid(img, cols, rows, threshold, mode, invertGrid);
        }

        setInfoMessage('Generated with AI');
        setIsGenerating(false);
      };

      img.onerror = () => {
        setErrorMessage('Failed to load generated image');
        setIsGenerating(false);
      };

      img.src = imageUrl;
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'An error occurred');
      setIsGenerating(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.endsWith('.svg')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImage(img);
        setSourcePreview(e.target?.result as string);

        // Auto-detect mode
        const canvas = document.createElement('canvas');
        const sz = 64;
        canvas.width = sz;
        canvas.height = sz;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.clearRect(0, 0, sz, sz);
        ctx.drawImage(img, 0, 0, sz, sz);
        const data = ctx.getImageData(0, 0, sz, sz).data;

        let hasTrans = false;
        let totalA = 0;
        let totalL = 0;
        const px = sz * sz;

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          totalA += a;
          if (a < 240) hasTrans = true;
          totalL += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        }

        let mode: 'alpha' | 'luminance' | 'dark' = 'luminance';
        if (hasTrans && totalA / px < 200) {
          mode = 'alpha';
        } else {
          mode = totalL / px > 180 ? 'dark' : 'luminance';
        }
        setDetectMode(mode);
        convertImageToGrid(img, uploadCols, uploadRows, threshold, mode, invertGrid);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Export functions
  const exportSVG = () => {
    const svg = generateSVG(512);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-icon.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = (size: number) => {
    const svg = generateSVG(size);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      c.getContext('2d')?.drawImage(img, 0, 0, size, size);
      c.toBlob((b) => {
        if (b) {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b);
          a.download = `pixel-icon-${size}.png`;
          a.click();
          URL.revokeObjectURL(a.href);
        }
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const saveToGallery = async () => {
    const svg = generateSVG(512);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = async () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      c.getContext('2d')?.drawImage(img, 0, 0, 512, 512);
      c.toBlob(async (b) => {
        if (b) {
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            try {
              const response = await fetch('/api/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  filename: `pixel-icon-${Date.now()}.png`,
                  url: dataUrl,
                  size: b.size,
                }),
              });
              const data = await response.json();
              if (data.success) {
                setInfoMessage('Saved to gallery!');
              } else {
                setErrorMessage(data.error || 'Failed to save');
              }
            } catch (e) {
              setErrorMessage(e instanceof Error ? e.message : 'Failed to save');
            }
          };
          reader.readAsDataURL(b);
        }
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const copyJSON = () => {
    const data = {
      cols,
      rows,
      grid,
      fill: fillColor,
      shadow: shadowColor,
      radius,
      gap,
      shadowOffsetX,
      shadowOffsetY,
    };
    navigator.clipboard.writeText(JSON.stringify(data));
    setInfoMessage('Copied to clipboard!');
  };

  // Initialize empty grid
  useEffect(() => {
    if (grid.length === 0) {
      setGrid(Array.from({ length: rows }, () => Array(cols).fill(false)));
    }
  }, [rows, cols, grid.length]);

  // Update grid when cols/rows change
  useEffect(() => {
    setGrid((prev) => {
      const newGrid: boolean[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < cols; c++) {
          row.push(prev[r]?.[c] || false);
        }
        newGrid.push(row);
      }
      return newGrid;
    });
  }, [rows, cols]);

  // Handle mouse up
  useEffect(() => {
    const handleMouseUp = () => setIsPainting(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'b') setCurrentTool('paint');
      if (e.key === 'e') setCurrentTool('erase');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Shadow map for rendering
  const shadowMap = showShadow ? getShadowMap() : null;

  // Example chips
  const examples = [
    'play', 'heart', 'star', 'lightning', 'check', 'lock', 'arrow right',
    'B', '7', 'home', 'gear', 'wifi', 'rocket', 'dice 3', 'bold A', 'cat'
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a
            href="https://availproject.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Avail Project website"
          >
            <img
              src="/images/AvailLogoWorkdmarkBlue.svg"
              alt="Avail Design Tools"
              className="h-8 w-auto"
            />
          </a>
          <div className="flex items-center gap-4">
            <Link href="/" className="brand-link">
              All Tools
            </Link>
            <Link href="/gallery" className="brand-link">
              View Gallery →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Pixel Icon Generator
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Create pixel art icons from prompts, upload images, or draw manually.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'prompt'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Prompt
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Upload Image
            </button>
          </div>
        </div>

        {/* Prompt Tab */}
        {activeTab === 'prompt' && (
          <div className="max-w-2xl mx-auto space-y-4 mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateFromPrompt()}
                placeholder='Type an icon name — e.g. "play", "heart", "bold A", "dice 3"'
                className="flex-1 px-4 py-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleGenerateFromPrompt}
                disabled={!promptInput.trim() || isGenerating}
                className="brand-button px-6 py-3 rounded-lg font-medium disabled:bg-zinc-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  setBrowseSearch('');
                  setShowBrowseModal(true);
                }}
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                Browse all icons
              </button>
            </div>

            <div className="flex gap-2 flex-wrap justify-center">
              <span className="text-xs text-zinc-500">Try:</span>
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setPromptInput(example);
                    setTimeout(() => handleGenerateFromPrompt(), 0);
                  }}
                  className="px-3 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Grid</label>
                <input
                  type="number"
                  value={cols}
                  onChange={(e) => setCols(Math.max(3, Math.min(32, parseInt(e.target.value) || 3)))}
                  min={3}
                  max={32}
                  className="w-14 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-zinc-500">×</span>
                <input
                  type="number"
                  value={rows}
                  onChange={(e) => setRows(Math.max(3, Math.min(32, parseInt(e.target.value) || 3)))}
                  min={3}
                  max={32}
                  className="w-14 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-4 mb-8">
            {!sourcePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-500');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-500');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500');
                  if (e.dataTransfer.files.length) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <div className="text-4xl mb-2 opacity-40">+</div>
                <div className="text-zinc-600 dark:text-zinc-400">Drop an icon here or click to upload</div>
                <div className="text-sm text-zinc-500 mt-1">PNG, SVG, JPG</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={sourcePreview}
                    alt="Source"
                    className="w-24 h-24 object-contain rounded-lg bg-zinc-100 dark:bg-zinc-800"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  >
                    Change Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.svg"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </div>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-zinc-600 dark:text-zinc-400">Grid</label>
                    <input
                      type="number"
                      value={uploadCols}
                      onChange={(e) => {
                        const val = Math.max(3, Math.min(32, parseInt(e.target.value) || 3));
                        setUploadCols(val);
                        if (loadedImage) convertImageToGrid(loadedImage, val, uploadRows, threshold, detectMode, invertGrid);
                      }}
                      min={3}
                      max={32}
                      className="w-14 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-zinc-500">×</span>
                    <input
                      type="number"
                      value={uploadRows}
                      onChange={(e) => {
                        const val = Math.max(3, Math.min(32, parseInt(e.target.value) || 3));
                        setUploadRows(val);
                        if (loadedImage) convertImageToGrid(loadedImage, uploadCols, val, threshold, detectMode, invertGrid);
                      }}
                      min={3}
                      max={32}
                      className="w-14 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-zinc-600 dark:text-zinc-400">Threshold</label>
                    <input
                      type="range"
                      value={threshold}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setThreshold(val);
                        if (loadedImage) convertImageToGrid(loadedImage, uploadCols, uploadRows, val, detectMode, invertGrid);
                      }}
                      min={1}
                      max={99}
                      className="w-24"
                    />
                    <span className="text-xs text-zinc-500 w-8">{threshold}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-zinc-600 dark:text-zinc-400">Mode</label>
                    <select
                      value={detectMode}
                      onChange={(e) => {
                        const val = e.target.value as 'alpha' | 'luminance' | 'dark';
                        setDetectMode(val);
                        if (loadedImage) convertImageToGrid(loadedImage, uploadCols, uploadRows, threshold, val, invertGrid);
                      }}
                      className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="alpha">Alpha</option>
                      <option value="luminance">Luminance</option>
                      <option value="dark">Dark pixels</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={invertGrid}
                      onChange={(e) => {
                        setInvertGrid(e.target.checked);
                        if (loadedImage) convertImageToGrid(loadedImage, uploadCols, uploadRows, threshold, detectMode, e.target.checked);
                      }}
                      className="rounded"
                    />
                    Invert
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {infoMessage && (
          <div className="max-w-2xl mx-auto mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 text-sm text-center">
            {infoMessage}
          </div>
        )}
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
            {errorMessage}
          </div>
        )}

        {/* Style Controls */}
        {grid.length > 0 && grid.some((row) => row.some((cell) => cell)) && (
          <>
            <div className="flex items-center justify-center gap-6 flex-wrap mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Icon</label>
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Shadow</label>
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(e) => setShadowColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Radius</label>
                <input
                  type="range"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  min={0}
                  max={50}
                  className="w-20"
                />
                <span className="text-xs text-zinc-500 w-8">{radius}%</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Gap</label>
                <input
                  type="range"
                  value={gap}
                  onChange={(e) => setGap(parseInt(e.target.value))}
                  min={0}
                  max={40}
                  className="w-20"
                />
                <span className="text-xs text-zinc-500 w-8">{gap}%</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 flex-wrap mb-8">
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Shadow offset</label>
                <div className="grid grid-cols-3 gap-0.5">
                  {[
                    { dx: -1, dy: -1, l: '↖' },
                    { dx: 0, dy: -1, l: '↑' },
                    { dx: 1, dy: -1, l: '↗' },
                    { dx: -1, dy: 0, l: '←' },
                    { dx: 0, dy: 0, l: '·' },
                    { dx: 1, dy: 0, l: '→' },
                    { dx: -1, dy: 1, l: '↙' },
                    { dx: 0, dy: 1, l: '↓' },
                    { dx: 1, dy: 1, l: '↘' },
                  ].map(({ dx, dy, l }) => (
                    <button
                      key={`${dx}-${dy}`}
                      onClick={() => {
                        if (dx !== 0 || dy !== 0) {
                          setShadowOffsetX(dx);
                          setShadowOffsetY(dy);
                        }
                      }}
                      disabled={dx === 0 && dy === 0}
                      className={`w-6 h-6 text-[10px] flex items-center justify-center rounded ${
                        dx === 0 && dy === 0
                          ? 'bg-zinc-300 dark:bg-zinc-700 cursor-default'
                          : shadowOffsetX === dx && shadowOffsetY === dy
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={showShadow}
                  onChange={(e) => setShowShadow(e.target.checked)}
                  className="rounded"
                />
                Shadow
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentTool('paint')}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg ${
                    currentTool === 'paint'
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  title="Paint (B)"
                >
                  🖌️
                </button>
                <button
                  onClick={() => setCurrentTool('erase')}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg ${
                    currentTool === 'erase'
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  title="Erase (E)"
                >
                  ✕
                </button>
              </div>
              <button
                onClick={clearGrid}
                className="px-4 py-2 text-sm border border-red-300 dark:border-red-800 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear
              </button>
            </div>
          </>
        )}

        {/* Editor Area */}
        {grid.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            {/* Grid */}
            <div className="flex flex-col items-center gap-4">
              <div
                className="inline-grid gap-1 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 select-none"
                style={{ gridTemplateColumns: `repeat(${cols}, 40px)` }}
              >
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    const isActive = cell;
                    const isShadow = showShadow && shadowMap?.[r]?.[c] && !cell;
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseDown={() => handleCellMouseDown(r, c)}
                        onMouseEnter={() => handleCellMouseEnter(r, c)}
                        className={`w-10 h-10 rounded-md cursor-pointer transition-all border ${
                          isActive || isShadow
                            ? 'border-transparent'
                            : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900'
                        } ${isActive ? '' : 'hover:scale-105'}`}
                        style={{
                          backgroundColor: isActive ? fillColor : isShadow ? shadowColor : undefined,
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col gap-6">
              <div className="flex gap-6 items-end">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-zinc-500">Light BG</span>
                  <div
                    className="bg-white rounded-xl p-6 flex items-center justify-center shadow-sm"
                    dangerouslySetInnerHTML={{ __html: generateSVG(200) }}
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-zinc-500">Dark BG</span>
                  <div
                    className="bg-zinc-900 rounded-xl p-6 flex items-center justify-center border border-zinc-700"
                    dangerouslySetInnerHTML={{ __html: generateSVG(200) }}
                  />
                </div>
              </div>
              <div className="flex gap-6 items-end">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-zinc-500">128px</span>
                  <div
                    className="bg-white rounded-lg p-2 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: generateSVG(128) }}
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-zinc-500">64px</span>
                  <div
                    className="bg-white rounded-lg p-2 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: generateSVG(64) }}
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-zinc-500">32px</span>
                  <div
                    className="bg-white rounded-lg p-2 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: generateSVG(32) }}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={exportSVG}
                  className="brand-button px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Export SVG
                </button>
                <button
                  onClick={() => exportPNG(512)}
                  className="brand-button px-4 py-2 rounded-lg text-sm font-medium"
                >
                  PNG 512
                </button>
                <button
                  onClick={() => exportPNG(1024)}
                  className="brand-button px-4 py-2 rounded-lg text-sm font-medium"
                >
                  PNG 1024
                </button>
                <button
                  onClick={saveToGallery}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  Save to Gallery
                </button>
                <button
                  onClick={copyJSON}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  Copy JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Browse Modal */}
      {showBrowseModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 overflow-y-auto p-8"
          onClick={() => setShowBrowseModal(false)}
        >
          <div
            className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Icon Library ({filteredIcons.total} icons)
              </h3>
              <button
                onClick={() => setShowBrowseModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                value={browseSearch}
                onChange={(e) => setBrowseSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Categories */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {filteredIcons.categories.map((category) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
                    {category} ({filteredIcons.icons[category]?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {filteredIcons.icons[category]?.map((icon) => (
                      <button
                        key={icon.name}
                        onClick={() => {
                          const newGrid = placeIconInGrid(icon.data, cols, rows);
                          setGrid(newGrid);
                          setPromptInput(icon.name);
                          setShowBrowseModal(false);
                          setInfoMessage(`Loaded: ${icon.name}`);
                        }}
                        className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center hover:border-blue-500 border border-zinc-200 dark:border-zinc-700 transition-colors relative group"
                        title={icon.name}
                        dangerouslySetInnerHTML={{ __html: generateMiniSVG(icon.data, 40) }}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {filteredIcons.total === 0 && (
                <div className="text-center text-zinc-500 py-12">No icons match your search.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
