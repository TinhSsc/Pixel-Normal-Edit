require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyBSrvCt58Jhsh14wbC2bD2KLFUUVbAVim0',
  authDomain: 'pixel-normal-edit.firebaseapp.com',
  projectId: 'pixel-normal-edit',
  storageBucket: 'pixel-normal-edit.firebasestorage.app',
  messagingSenderId: '397075334229',
  appId: '1:397075334229:web:b02eede3fc7b41d02f80dc',
});

const db = getFirestore(app);

async function clearAll() {
  console.log('Fetching mcp_sessions...');
  const sessionsSnap = await getDocs(collection(db, 'mcp_sessions'));
  console.log(`Found ${sessionsSnap.size} sessions.`);

  for (const sessionDoc of sessionsSnap.docs) {
    const sessionId = sessionDoc.id;
    console.log(`Clearing commands for session: ${sessionId}`);
    const cmdsRef = collection(db, 'mcp_sessions', sessionId, 'commands');
    const cmdsSnap = await getDocs(cmdsRef);
    let count = 0;
    for (const cmdDoc of cmdsSnap.docs) {
      await deleteDoc(doc(db, 'mcp_sessions', sessionId, 'commands', cmdDoc.id));
      count++;
    }
    console.log(`Deleted ${count} commands.`);
  }
  console.log('Done!');
  process.exit(0);
}

clearAll().catch(console.error);
