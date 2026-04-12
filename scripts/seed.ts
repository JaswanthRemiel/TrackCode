import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  } catch (e) {
    console.warn("Could not init firebase admin properly, skipping for tests...", e);
  }
}

let db: any = null;
try {
  db = admin.apps.length > 0 ? admin.firestore() : null;
} catch (e) {}

async function fetchRepoContents(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

async function run() {
  console.log("Fetching root repo contents...");
  // liquidslr/interview-company-wise-problems
  const baseApiUrl = "https://api.github.com/repos/liquidslr/interview-company-wise-problems/contents";
  const rootContents = await fetchRepoContents(baseApiUrl);
  
  const companyDirs = rootContents.filter((item: any) => item.type === "dir" && !item.name.startsWith('.'));
  console.log(`Found ${companyDirs.length} companies.`);

  const allProblemsMap = new Map(); // id -> problem

  let processedCount = 0;
  for (const dir of companyDirs) {
    processedCount++;

    console.log(`Processing company ${processedCount}/${companyDirs.length}: ${dir.name}...`);
    const encodedDirName = encodeURIComponent(dir.name);
    try {
      const csvUrl = `https://raw.githubusercontent.com/liquidslr/interview-company-wise-problems/main/${encodedDirName}/5.%20All.csv`;
      const csvRes = await fetch(csvUrl);
      if (!csvRes.ok) {
        console.log(`No "5. All.csv" found for ${dir.name}`);
        continue;
      }
      
      const csvText = await csvRes.text();
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true
      });

      for (const rawRecord of records) {
        const record = rawRecord as any;
        // record has: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics
        const id = record.Link.split('/problems/')[1]?.replace(/\/$/, '') || record.Title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        const existing = allProblemsMap.get(id);
        if (existing) {
          if (!existing.company.includes(dir.name)) {
            existing.company.push(dir.name);
          }
        } else {
          allProblemsMap.set(id, {
            id,
            title: record.Title,
            difficulty: record.Difficulty?.toUpperCase() || 'MEDIUM',
            leetcodeUrl: record.Link,
            tags: record.Topics ? record.Topics.split(',').map((t: string) => t.trim()) : [],
            company: [dir.name]
          });
        }
      }
    } catch (e) {
      console.error(`Error processing ${dir.name}:`, e);
    }
    // simple delay to prevent github rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const outputArray = Array.from(allProblemsMap.values());
  console.log(`Total unique problems: ${outputArray.length}`);
  
  fs.writeFileSync(path.join(__dirname, 'problems.json'), JSON.stringify(outputArray, null, 2));
  console.log("Saved local json output!");

  if (db && process.env.FIREBASE_ADMIN_PROJECT_ID) {
    console.log("Uploading to Firestore...");
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
        batch = db.batch(); // Re-initialize the batch here!
      }
    }
    if (i % 500 !== 0) {
      await batch.commit();
    }
    console.log("Done uploading!");
  } else {
    console.log("No Firebase admin credentials found, skipped Firestore upload.");
  }
}

run().catch(console.error);
