const fs = require('fs');

(async () => {
    try {
        const jimp = require('jimp'); // Check if jimp is installed globally or locally
        // If not installed, we can't easily use it.
    } catch (e) {
        console.log("Jimp not found. Writing a node script to just copy file? No, we need to compress.");
    }
})();
