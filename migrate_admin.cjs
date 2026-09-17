const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/admin/AdminDashboard.jsx',
    'src/pages/admin/AdminSongs.jsx',
    'src/pages/admin/AdminSettings.jsx',
    'src/pages/admin/AdminSponsors.jsx',
    'src/pages/admin/AdminAbout.jsx',
    'src/pages/admin/AdminEstatisticas.jsx',
    'src/pages/admin/AdminPagantes.jsx',
    'src/pages/admin/AdminFutureEvents.jsx',
    'src/pages/admin/AdminEventList.jsx',
    'src/pages/admin/AdminShareLink.jsx',
    'src/components/admin/SongModal.jsx',
    'src/components/admin/ShowRegistrationModal.jsx'
];

function migrate(content) {
    // Basic imports
    content = content.replace(/import\s+{\s*supabase\s*}\s+from\s+['"]([^'"]+)['"]/g, 
        "import { db, auth, storage } from '../../lib/firebase'\nimport { collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, increment } from 'firebase/firestore'\nimport { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'\nimport { getAuth } from 'firebase/auth'");
    
    // Sometimes the path is different (e.g. '../lib/supabase')
    content = content.replace(/import\s+{\s*supabase\s*}\s+from\s+['"]\.\.\/lib\/supabase['"]/g, 
        "import { db, auth, storage } from '../lib/firebase'\nimport { collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, increment } from 'firebase/firestore'\nimport { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'\nimport { getAuth } from 'firebase/auth'");

    return content;
}

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = migrate(content);
        fs.writeFileSync(filePath, content, 'utf8');
    }
});

console.log("Imports updated.");
