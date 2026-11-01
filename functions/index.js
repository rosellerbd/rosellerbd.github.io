const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.addRoleClaim = functions.auth.user().onCreate(async (user) => {
  await admin.auth().setCustomUserClaims(user.uid, {
    role: "authenticated",
  });
  console.log("Badge given to", user.uid);
});