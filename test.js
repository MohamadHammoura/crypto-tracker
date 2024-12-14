console.log('Script started...');

setInterval(() => {
    console.log(`Interval test running at ${new Date().toISOString()}`);
}, 60000); // Run every 60 seconds
