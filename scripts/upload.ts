import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function run() {
  console.log("Reading local problems.json...");
  const raw = fs.readFileSync(path.join(__dirname, 'problems.json'), 'utf-8');
  const outputArray = JSON.parse(raw);
  
  console.log(`Found ${outputArray.length} problems to upload.`);
  
  let batch = db.batch();
  const problemsRef = db.collection('problems');
  let i = 0;
  for (const prob of outputArray) {
    const docRef = problemsRef.doc(prob.id);
    batch.set(docRef, prob);
    i++;
    if (i % 500 === 0) {
      await batch.commit();
      console.log(`Committed ${i} records...`);
      batch = db.batch();
    }
  }
  if (i % 500 !== 0) {
    await batch.commit();
  }
  console.log("Upload Complete!");
}

run().catch(console.error);
