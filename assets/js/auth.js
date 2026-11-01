import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const cfg = window.ROSELLER_FIREBASE_CONFIG;
const app  = initializeApp(cfg);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let _user = null;
let _readyResolve;
const _ready = new Promise(r => { _readyResolve = r; });

onAuthStateChanged(auth, user => {
  _user = user;
  _readyResolve(user);
  document.dispatchEvent(new CustomEvent('auth:changed', { detail: { user } }));
});

window.RosellerAuth = {
  get currentUser() { return _user; },
  login:  () => signInWithPopup(auth, provider),
  logout: () => signOut(auth),
  onReady: cb => _ready.then(cb),
  getIdToken: (force = false) => _user ? _user.getIdToken(force) : null
};