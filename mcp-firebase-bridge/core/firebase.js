#!/usr/bin/env node
/**
 * firebase.js — Firebase initialization for MCP Firebase Bridge
 *
 * Initializes and exports the Firestore database instance.
 * All Firebase config is hardcoded (safe as these are public API keys).
 */
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const app = initializeApp({
  apiKey: 'AIzaSyBSrvCt58Jhsh14wbC2bD2KLFUUVbAVim0',
  authDomain: 'pixel-normal-edit.firebaseapp.com',
  projectId: 'pixel-normal-edit',
  storageBucket: 'pixel-normal-edit.firebasestorage.app',
  messagingSenderId: '397075334229',
  appId: '1:397075334229:web:b02eede3fc7b41d02f80dc',
});

const db = getFirestore(app);

module.exports = { db };