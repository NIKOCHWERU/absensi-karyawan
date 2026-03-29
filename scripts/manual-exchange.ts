import dotenv from 'dotenv';
dotenv.config();

// Load from .env
const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3333/callback';

// Code extracted from the URL the user shared
const code = '4/0Aci98E_NrZgpGMJg3vmJna114Ta65HUlAgbrEWb0H-ZQO7psPzMR5VbW0nofNUEpjXYWdw';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function exchange() {
    try {
        console.log('⏳ Exchanging code for tokens...');
        const { tokens } = await oauth2Client.getToken(code);
        
        if (tokens.refresh_token) {
            console.log('✅ Success! Refresh Token obtained.');
            
            const envPath = path.join(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                let content = fs.readFileSync(envPath, 'utf8');
                content = content.replace(/GOOGLE_DRIVE_REFRESH_TOKEN=.*/, `GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
                fs.writeFileSync(envPath, content);
                console.log('📝 .env file updated with new GOOGLE_DRIVE_REFRESH_TOKEN.');
            } else {
                console.error('❌ .env file not found at ' + envPath);
            }
        } else {
            console.warn('⚠️ No refresh token returned. This can happen if the code was already used or prompt:consent was missing.');
            console.log('Tokens received:', Object.keys(tokens));
        }
    } catch (err: any) {
        console.error('❌ Failed to exchange code:', err.message);
    }
    process.exit(0);
}

exchange();
