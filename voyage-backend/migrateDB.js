const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/voyage';
const ATLAS_URI = 'mongodb+srv://joganimitesh14_db_user:nEGmpjgZY7UxaXYV@cluster0.xxmj3xd.mongodb.net/voyage?appName=Cluster0';

async function migrateData() {
  let localClient, atlasClient;
  try {
    console.log('Connecting to Local MongoDB...');
    localClient = await MongoClient.connect(LOCAL_URI);
    const localDb = localClient.db('voyage');
    console.log('Connected to Local MongoDB.');

    console.log('Connecting to Atlas MongoDB...');
    atlasClient = await MongoClient.connect(ATLAS_URI);
    const atlasDb = atlasClient.db('voyage');
    console.log('Connected to Atlas MongoDB.');

    // Get all collections from the local DB
    const collections = await localDb.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('No collections found in local database to migrate.');
      return;
    }

    for (let collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Migrating collection: ${collectionName}`);
      
      const localCollection = localDb.collection(collectionName);
      const atlasCollection = atlasDb.collection(collectionName);
      
      const documents = await localCollection.find({}).toArray();
      if (documents.length > 0) {
        // Optional: clear existing documents in Atlas collection to avoid duplicates during testing
        // await atlasCollection.deleteMany({});
        
        // Use insertMany with ordered: false so if a duplicate _id exists, it skips but continues
        try {
          await atlasCollection.insertMany(documents, { ordered: false });
          console.log(`✅ Successfully migrated ${documents.length} documents into ${collectionName}`);
        } catch (err) {
          if (err.code === 11000) {
            console.log(`⚠️ Some documents in ${collectionName} already exist (duplicate keys). Inserted the rest.`);
          } else {
            console.error(`❌ Error inserting into ${collectionName}:`, err);
          }
        }
      } else {
        console.log(`⏩ Skipped ${collectionName} (0 documents)`);
      }
    }
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
  }
}

migrateData();
