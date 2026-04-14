/**
 * Quick test for DigitalOcean Spaces (S3) connectivity
 * Run: node scripts/test-s3.mjs
 */
import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const KEY    = 'DO00YF8J3C9PBE6JJRL7';
const SECRET = '3YRJMlKIWY8ClyAdInWJ7ZtQqc/lx9Z+cYMldLomYIM';
const ENDPOINT = 'https://sfo3.digitaloceanspaces.com';
const REGION   = 'sfo3';
const BUCKET   = 'eit-bucket';

const client = new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
    forcePathStyle: false,
});

async function run() {
    console.log(`\n🔌 Testing connection to ${ENDPOINT}`);
    console.log(`   Bucket: ${BUCKET}\n`);

    // 1. List bucket
    try {
        const list = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 5 }));
        console.log(`✅ Bucket accessible. Objects found: ${list.KeyCount ?? 0}`);
        if (list.Contents?.length) {
            list.Contents.forEach(obj => console.log(`   - ${obj.Key} (${obj.Size} bytes)`));
        }
    } catch (err) {
        console.error(`❌ List failed: ${err.message}`);
        process.exit(1);
    }

    // 2. Upload test file
    const testKey = 'test/connection-test.txt';
    try {
        await client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: testKey,
            Body: Buffer.from(`IET connection test - ${new Date().toISOString()}`),
            ContentType: 'text/plain',
            ACL: 'public-read',
        }));
        const url = `https://${BUCKET}.sfo3.digitaloceanspaces.com/${testKey}`;
        console.log(`✅ Upload succeeded`);
        console.log(`   URL: ${url}`);
    } catch (err) {
        console.error(`❌ Upload failed: ${err.message}`);
        process.exit(1);
    }

    // 3. Delete test file
    try {
        await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: testKey }));
        console.log(`✅ Delete succeeded`);
    } catch (err) {
        console.error(`❌ Delete failed: ${err.message}`);
    }

    console.log('\n✅ All S3 tests passed — storage is ready.\n');
}

run().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
